-- Resource tick logic.
--
-- Production is never accumulated client-side. Every read path calls
-- tick_my_city() first, which computes production_rate * elapsed_hours
-- since resources.last_tick_at and applies it server-side, capped by
-- Storehouse capacity for food/wood/stone/ore (gold is uncapped). Gold
-- comes from a simple population-from-castle-level * fixed tax rate model
-- (see build notes: no separate population mechanic exists yet, so
-- population is derived from Castle level).
--
-- apply_resource_tick does the actual math and is intentionally not
-- granted to any client role — it is only reachable through the two
-- wrappers below, both of which establish who/what is allowed to tick
-- which city before delegating to it.

create or replace function public.apply_resource_tick(p_city_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last_tick_at timestamptz;
  v_elapsed_hours numeric;
  v_storehouse_level smallint;
  v_storehouse_building public.buildings%rowtype;
  v_capacity numeric;
  v_castle_level smallint;
  v_population numeric;
  v_food_rate numeric;
  v_wood_rate numeric;
  v_stone_rate numeric;
  v_ore_rate numeric;
  v_gold_rate numeric;
begin
  select last_tick_at into v_last_tick_at from public.resources where city_id = p_city_id for update;
  if not found then
    return;
  end if;

  v_elapsed_hours := extract(epoch from (now() - v_last_tick_at)) / 3600.0;
  if v_elapsed_hours <= 0 then
    return;
  end if;

  select level into v_storehouse_level
  from public.city_plots
  where city_id = p_city_id and building_type = 'storehouse'
  limit 1;

  select * into v_storehouse_building from public.buildings where type = 'storehouse';
  v_capacity := coalesce((v_storehouse_building.effect ->> 'capacity_base')::numeric, 1000)
    + coalesce(v_storehouse_level, 0) * coalesce((v_storehouse_building.effect ->> 'capacity_per_level')::numeric, 0);

  select
    coalesce(sum(case when b.effect ->> 'produces' = 'food'
      then coalesce((b.effect ->> 'base_rate')::numeric, 0) + fp.level * coalesce((b.effect ->> 'rate_per_level')::numeric, 0)
      else 0 end), 0),
    coalesce(sum(case when b.effect ->> 'produces' = 'wood'
      then coalesce((b.effect ->> 'base_rate')::numeric, 0) + fp.level * coalesce((b.effect ->> 'rate_per_level')::numeric, 0)
      else 0 end), 0),
    coalesce(sum(case when b.effect ->> 'produces' = 'stone'
      then coalesce((b.effect ->> 'base_rate')::numeric, 0) + fp.level * coalesce((b.effect ->> 'rate_per_level')::numeric, 0)
      else 0 end), 0),
    coalesce(sum(case when b.effect ->> 'produces' = 'ore'
      then coalesce((b.effect ->> 'base_rate')::numeric, 0) + fp.level * coalesce((b.effect ->> 'rate_per_level')::numeric, 0)
      else 0 end), 0)
  into v_food_rate, v_wood_rate, v_stone_rate, v_ore_rate
  from public.field_plots fp
  join public.buildings b on b.type = fp.building_type
  where fp.city_id = p_city_id and fp.building_type is not null;

  select level into v_castle_level
  from public.city_plots
  where city_id = p_city_id and building_type = 'castle'
  limit 1;

  -- Population/tax model: no standalone population mechanic exists yet, so
  -- population scales with Castle level, and gold accrues at a fixed tax
  -- rate against that population. Revisit if a real population/happiness
  -- system is added later.
  v_population := 50 + coalesce(v_castle_level, 0) * 50;
  v_gold_rate := v_population * 0.02;

  update public.resources
  set food = least(v_capacity, food + v_food_rate * v_elapsed_hours),
      wood = least(v_capacity, wood + v_wood_rate * v_elapsed_hours),
      stone = least(v_capacity, stone + v_stone_rate * v_elapsed_hours),
      ore = least(v_capacity, ore + v_ore_rate * v_elapsed_hours),
      gold = gold + v_gold_rate * v_elapsed_hours,
      last_tick_at = now()
  where city_id = p_city_id;
end;
$$;

revoke all on function public.apply_resource_tick(uuid) from public;

-- Player-triggered: ticks the caller's own city. Called on every page read
-- that shows resources, so displayed values are always freshly computed
-- server-side (never extrapolated in the browser).
create or replace function public.tick_my_city()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_city_id uuid;
begin
  select id into v_city_id from public.cities where owner_id = auth.uid();
  if v_city_id is null then
    return;
  end if;
  perform public.apply_resource_tick(v_city_id);
end;
$$;

revoke all on function public.tick_my_city() from public;
grant execute on function public.tick_my_city() to authenticated;

-- Service-role only: ticks every city. Intended for a scheduled job (pg_cron
-- or an external scheduler calling an Edge Function) so resources keep
-- accruing for players who aren't actively loading pages, ready for the
-- moment they do.
create or replace function public.tick_all_cities()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_city record;
begin
  for v_city in select id from public.cities loop
    perform public.apply_resource_tick(v_city.id);
  end loop;
end;
$$;

revoke all on function public.tick_all_cities() from public;
grant execute on function public.tick_all_cities() to service_role;
