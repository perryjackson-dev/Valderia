-- Design change: buildings are single-instance per city by default (one
-- Castle, one Farm, etc. — leveling up an existing plot is still fine, but
-- you can't build a second copy on a different plot). Barracks and Cottage
-- are the only multi-instance buildings, and both live in Field View now
-- (Barracks moves out of City View). A city also has a single citywide
-- build queue: only one plot (city or field) may be under construction at
-- a time. Troop training slots equal the number of built Barracks, and any
-- built Barracks can be used to queue into any free slot (not tied to one
-- specific Barracks instance).

alter table public.buildings add column unique_per_city boolean not null default true;

update public.buildings set category = 'field' where type = 'barracks';
update public.buildings set unique_per_city = false where type = 'barracks';

insert into public.buildings
  (type, display_name, category, max_level, base_cost, cost_multiplier, base_build_seconds, build_seconds_multiplier, effect, unique_per_city)
values
  ('cottage', 'Cottage', 'field', 20,
    '{"food":0,"wood":80,"stone":40,"ore":0,"gold":0}', 1.5, 60, 1.35,
    '{"population_base":0,"population_per_level":30}', false);

-- ---------------------------------------------------------------------------
-- start_building_upgrade: add citywide single-build-queue and
-- unique-per-city checks.
-- ---------------------------------------------------------------------------
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

  -- Citywide single build queue: only one plot under construction at a time.
  if exists (select 1 from public.city_plots where city_id = p_city_id and upgrade_started_at is not null)
    or exists (select 1 from public.field_plots where city_id = p_city_id and upgrade_started_at is not null)
  then
    raise exception 'this city already has a construction in progress';
  end if;

  -- Unique-per-city buildings (everything except Barracks/Cottage): block a
  -- second copy on a different plot. Leveling up the existing one is fine.
  if v_current_building is null and v_building.unique_per_city then
    if exists (select 1 from public.city_plots where city_id = p_city_id and building_type = p_building_type)
      or exists (select 1 from public.field_plots where city_id = p_city_id and building_type = p_building_type)
    then
      raise exception '% can only be built once per city', v_building.display_name;
    end if;
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

-- ---------------------------------------------------------------------------
-- start_troop_training: slots come from the number of built Barracks
-- (any one of them can be used to fill any free slot), not a single
-- barracks-level gate.
-- ---------------------------------------------------------------------------
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
  v_barracks_count integer;
  v_max_barracks_level smallint;
  v_active_queue_count integer;
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
  perform public.resolve_training_queue(p_city_id);

  select * into v_troop from public.troop_types where type = p_troop_type;
  if not found then
    raise exception 'unknown troop type: %', p_troop_type;
  end if;

  select count(*), coalesce(max(level), 0)
    into v_barracks_count, v_max_barracks_level
  from public.field_plots
  where city_id = p_city_id and building_type = 'barracks' and level >= 1;

  if v_barracks_count = 0 then
    raise exception 'requires a Barracks';
  end if;

  if v_troop.requires_building_level > v_max_barracks_level then
    raise exception 'requires a Barracks of level % (highest built is %)', v_troop.requires_building_level, v_max_barracks_level;
  end if;

  select count(*) into v_active_queue_count
  from public.training_queue
  where city_id = p_city_id and not resolved;

  if v_active_queue_count >= v_barracks_count then
    raise exception 'all barracks are busy (%/% training slots in use)', v_active_queue_count, v_barracks_count;
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

-- ---------------------------------------------------------------------------
-- apply_resource_tick: population now also gets a bonus from Cottages, not
-- just Castle level.
-- ---------------------------------------------------------------------------
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
  v_cottage_bonus numeric;
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
      else 0 end), 0),
    coalesce(sum(case when b.type = 'cottage'
      then coalesce((b.effect ->> 'population_base')::numeric, 0) + fp.level * coalesce((b.effect ->> 'population_per_level')::numeric, 0)
      else 0 end), 0)
  into v_food_rate, v_wood_rate, v_stone_rate, v_ore_rate, v_cottage_bonus
  from public.field_plots fp
  join public.buildings b on b.type = fp.building_type
  where fp.city_id = p_city_id and fp.building_type is not null;

  select level into v_castle_level
  from public.city_plots
  where city_id = p_city_id and building_type = 'castle'
  limit 1;

  -- Population/tax model: population scales with Castle level plus a
  -- per-level bonus from every built Cottage; gold accrues at a fixed tax
  -- rate against that population. Revisit if a real population/happiness
  -- system is added later.
  v_population := 50 + coalesce(v_castle_level, 0) * 50 + v_cottage_bonus;
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
