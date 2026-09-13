-- Row Level Security
--
-- Players can only ever READ their own gameplay state. There are no
-- authenticated-role INSERT/UPDATE/DELETE policies on player-owned tables:
-- all mutation (building upgrades, troop training, marches, combat
-- resolution, resource ticks) happens through SECURITY DEFINER Postgres
-- functions (added in later migrations) that run as the function owner and
-- therefore bypass RLS after performing their own validation. The service
-- role (used by scheduled jobs / Edge Functions) also bypasses RLS entirely.

alter table public.profiles enable row level security;
alter table public.buildings enable row level security;
alter table public.troop_types enable row level security;
alter table public.wilderness_camps enable row level security;
alter table public.cities enable row level security;
alter table public.city_plots enable row level security;
alter table public.field_plots enable row level security;
alter table public.resources enable row level security;
alter table public.research enable row level security;
alter table public.troops enable row level security;
alter table public.training_queue enable row level security;
alter table public.marches enable row level security;
alter table public.battle_reports enable row level security;

-- profiles: a player can read and rename their own profile only.
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- reference tables: public read for any signed-in player.
create policy "buildings_select_all" on public.buildings
  for select to authenticated
  using (true);

create policy "troop_types_select_all" on public.troop_types
  for select to authenticated
  using (true);

create policy "wilderness_camps_select_all" on public.wilderness_camps
  for select to authenticated
  using (true);

-- cities: readable only by their owner.
create policy "cities_select_own" on public.cities
  for select to authenticated
  using (owner_id = auth.uid());

-- per-city tables: readable only when the parent city belongs to the caller.
create policy "city_plots_select_own" on public.city_plots
  for select to authenticated
  using (city_id in (select id from public.cities where owner_id = auth.uid()));

create policy "field_plots_select_own" on public.field_plots
  for select to authenticated
  using (city_id in (select id from public.cities where owner_id = auth.uid()));

create policy "resources_select_own" on public.resources
  for select to authenticated
  using (city_id in (select id from public.cities where owner_id = auth.uid()));

create policy "research_select_own" on public.research
  for select to authenticated
  using (city_id in (select id from public.cities where owner_id = auth.uid()));

create policy "troops_select_own" on public.troops
  for select to authenticated
  using (city_id in (select id from public.cities where owner_id = auth.uid()));

create policy "training_queue_select_own" on public.training_queue
  for select to authenticated
  using (city_id in (select id from public.cities where owner_id = auth.uid()));

create policy "marches_select_own" on public.marches
  for select to authenticated
  using (city_id in (select id from public.cities where owner_id = auth.uid()));

create policy "battle_reports_select_own" on public.battle_reports
  for select to authenticated
  using (city_id in (select id from public.cities where owner_id = auth.uid()));
