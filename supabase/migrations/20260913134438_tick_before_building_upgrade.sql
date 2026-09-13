-- start_building_upgrade now applies the resource tick before checking
-- affordability, so a player who just accrued enough resources isn't
-- rejected against a stale (pre-tick) resources row.

create or replace function public.start_building_upgrade(
  p_city_id uuid,
  p_plot_kind text, -- 'city' | 'field'
  p_plot_index smallint,
  p_building_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_building public.buildings%rowtype;
  v_level smallint;
  v_upgrading boolean;
  v_current_building text;
  v_cost_food numeric;
  v_cost_wood numeric;
  v_cost_stone numeric;
  v_cost_ore numeric;
  v_cost_gold numeric;
  v_build_seconds numeric;
begin
  if p_plot_kind not in ('city', 'field') then
    raise exception 'invalid plot kind';
  end if;

  if not exists (select 1 from public.cities where id = p_city_id and owner_id = auth.uid()) then
    raise exception 'not your city';
  end if;

  perform public.apply_resource_tick(p_city_id);
  perform public.resolve_plot_upgrades(p_city_id);

  select * into v_building from public.buildings
  where type = p_building_type and category = p_plot_kind;

  if not found then
    raise exception 'unknown % building type: %', p_plot_kind, p_building_type;
  end if;

  if p_plot_kind = 'city' then
    select level, (upgrade_started_at is not null), building_type
      into v_level, v_upgrading, v_current_building
    from public.city_plots
    where city_id = p_city_id and plot_index = p_plot_index
    for update;
  else
    select level, (upgrade_started_at is not null), building_type
      into v_level, v_upgrading, v_current_building
    from public.field_plots
    where city_id = p_city_id and plot_index = p_plot_index
    for update;
  end if;

  if not found then
    raise exception 'plot % not found', p_plot_index;
  end if;

  if v_upgrading then
    raise exception 'plot is already under construction';
  end if;

  if v_current_building is not null and v_current_building <> p_building_type then
    raise exception 'plot already holds a different building; demolition is not supported yet';
  end if;

  if v_level >= v_building.max_level then
    raise exception 'building already at max level';
  end if;

  v_cost_food := coalesce((v_building.base_cost ->> 'food')::numeric, 0) * power(v_building.cost_multiplier, v_level);
  v_cost_wood := coalesce((v_building.base_cost ->> 'wood')::numeric, 0) * power(v_building.cost_multiplier, v_level);
  v_cost_stone := coalesce((v_building.base_cost ->> 'stone')::numeric, 0) * power(v_building.cost_multiplier, v_level);
  v_cost_ore := coalesce((v_building.base_cost ->> 'ore')::numeric, 0) * power(v_building.cost_multiplier, v_level);
  v_cost_gold := coalesce((v_building.base_cost ->> 'gold')::numeric, 0) * power(v_building.cost_multiplier, v_level);
  v_build_seconds := v_building.base_build_seconds * power(v_building.build_seconds_multiplier, v_level);

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

  if p_plot_kind = 'city' then
    update public.city_plots
    set building_type = p_building_type,
        upgrade_started_at = now(),
        upgrade_completes_at = now() + (v_build_seconds || ' seconds')::interval
    where city_id = p_city_id and plot_index = p_plot_index;
  else
    update public.field_plots
    set building_type = p_building_type,
        upgrade_started_at = now(),
        upgrade_completes_at = now() + (v_build_seconds || ' seconds')::interval
    where city_id = p_city_id and plot_index = p_plot_index;
  end if;
end;
$$;
