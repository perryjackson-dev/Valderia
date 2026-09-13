-- Troop training RPCs.
--
-- Same pattern as building upgrades: the client never writes to troops or
-- training_queue directly (no authenticated RLS policy allows it). It
-- calls start_troop_training, which validates the Barracks requirement,
-- computes cost/time from troop_types, deducts resources, and queues a
-- training_queue row. resolve_training_queue finalizes elapsed entries by
-- crediting troops and is called before every read of troops/queue state.

create or replace function public.resolve_training_queue(p_city_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
begin
  if not exists (select 1 from public.cities where id = p_city_id and owner_id = auth.uid()) then
    raise exception 'not your city';
  end if;

  for v_row in
    select id, troop_type, quantity
    from public.training_queue
    where city_id = p_city_id and not resolved and completes_at <= now()
    for update
  loop
    insert into public.troops (city_id, troop_type, quantity)
    values (p_city_id, v_row.troop_type, v_row.quantity)
    on conflict (city_id, troop_type)
    do update set quantity = public.troops.quantity + excluded.quantity;

    update public.training_queue set resolved = true where id = v_row.id;
  end loop;
end;
$$;

revoke all on function public.resolve_training_queue(uuid) from public;
grant execute on function public.resolve_training_queue(uuid) to authenticated;

create or replace function public.start_troop_training(
  p_city_id uuid,
  p_troop_type text,
  p_quantity integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_troop public.troop_types%rowtype;
  v_barracks_level smallint;
  v_cost_food numeric;
  v_cost_wood numeric;
  v_cost_stone numeric;
  v_cost_ore numeric;
  v_cost_gold numeric;
  v_total_seconds numeric;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'quantity must be positive';
  end if;

  if not exists (select 1 from public.cities where id = p_city_id and owner_id = auth.uid()) then
    raise exception 'not your city';
  end if;

  perform public.apply_resource_tick(p_city_id);
  perform public.resolve_plot_upgrades(p_city_id);

  select * into v_troop from public.troop_types where type = p_troop_type;
  if not found then
    raise exception 'unknown troop type: %', p_troop_type;
  end if;

  if v_troop.requires_building is not null then
    select level into v_barracks_level
    from public.city_plots
    where city_id = p_city_id and building_type = v_troop.requires_building
    limit 1;

    if coalesce(v_barracks_level, 0) < v_troop.requires_building_level then
      raise exception '% level % required to train %', v_troop.requires_building, v_troop.requires_building_level, p_troop_type;
    end if;
  end if;

  v_cost_food := coalesce((v_troop.train_cost ->> 'food')::numeric, 0) * p_quantity;
  v_cost_wood := coalesce((v_troop.train_cost ->> 'wood')::numeric, 0) * p_quantity;
  v_cost_stone := coalesce((v_troop.train_cost ->> 'stone')::numeric, 0) * p_quantity;
  v_cost_ore := coalesce((v_troop.train_cost ->> 'ore')::numeric, 0) * p_quantity;
  v_cost_gold := coalesce((v_troop.train_cost ->> 'gold')::numeric, 0) * p_quantity;
  v_total_seconds := v_troop.train_seconds * p_quantity;

  update public.resources
  set food = food - v_cost_food,
      wood = wood - v_cost_wood,
      stone = stone - v_cost_stone,
      ore = ore - v_cost_ore,
      gold = gold - v_cost_gold
  where city_id = p_city_id
    and food >= v_cost_food
    and wood >= v_cost_wood
    and stone >= v_cost_stone
    and ore >= v_cost_ore
    and gold >= v_cost_gold;

  if not found then
    raise exception 'insufficient resources';
  end if;

  insert into public.training_queue (city_id, troop_type, quantity, started_at, completes_at)
  values (p_city_id, p_troop_type, p_quantity, now(), now() + (v_total_seconds || ' seconds')::interval);
end;
$$;

revoke all on function public.start_troop_training(uuid, text, integer) from public;
grant execute on function public.start_troop_training(uuid, text, integer) to authenticated;
