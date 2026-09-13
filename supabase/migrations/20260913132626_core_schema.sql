-- Valderia core schema
-- Server-authoritative city builder: all mutation of gameplay state happens
-- through SECURITY DEFINER functions added in later migrations, never via
-- direct client writes. This migration only defines structure.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- reference tables (not per-player; seeded in a later migration)
-- ---------------------------------------------------------------------------
create table public.buildings (
  type text primary key,
  display_name text not null,
  category text not null check (category in ('city', 'field')),
  max_level smallint not null default 20,
  base_cost jsonb not null default '{}'::jsonb, -- {food,wood,stone,ore,gold}
  cost_multiplier numeric not null default 1.5,
  base_build_seconds integer not null,
  build_seconds_multiplier numeric not null default 1.4,
  effect jsonb not null default '{}'::jsonb -- e.g. {"produces":"food","base_rate":10,"rate_per_level":5}
);

create table public.troop_types (
  type text primary key,
  display_name text not null,
  tier smallint not null,
  class text not null check (class in ('ground', 'artillery', 'cavalry', 'supply')),
  attack integer not null,
  life integer not null,
  speed integer not null, -- tiles per hour
  load integer not null, -- loot capacity per troop
  train_seconds integer not null,
  train_cost jsonb not null default '{}'::jsonb,
  requires_building text references public.buildings (type),
  requires_building_level smallint not null default 1
);

create table public.wilderness_camps (
  id uuid primary key default gen_random_uuid(),
  x integer not null,
  y integer not null,
  level smallint not null,
  garrison jsonb not null default '{}'::jsonb, -- {troop_type: quantity}
  loot_table jsonb not null default '{}'::jsonb, -- {food,wood,stone,ore,gold}
  created_at timestamptz not null default now(),
  unique (x, y)
);

-- ---------------------------------------------------------------------------
-- cities
-- ---------------------------------------------------------------------------
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'New City',
  x integer not null,
  y integer not null,
  created_at timestamptz not null default now(),
  unique (x, y)
);

create index cities_owner_id_idx on public.cities (owner_id);

create table public.city_plots (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete cascade,
  plot_index smallint not null check (plot_index between 0 and 23),
  building_type text references public.buildings (type),
  level smallint not null default 0,
  upgrade_started_at timestamptz,
  upgrade_completes_at timestamptz,
  unique (city_id, plot_index)
);

create table public.field_plots (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete cascade,
  plot_index smallint not null check (plot_index between 0 and 9),
  building_type text references public.buildings (type),
  level smallint not null default 0,
  upgrade_started_at timestamptz,
  upgrade_completes_at timestamptz,
  unique (city_id, plot_index)
);

create table public.resources (
  city_id uuid primary key references public.cities (id) on delete cascade,
  food numeric not null default 0,
  wood numeric not null default 0,
  stone numeric not null default 0,
  ore numeric not null default 0,
  gold numeric not null default 0,
  last_tick_at timestamptz not null default now()
);

create table public.research (
  city_id uuid not null references public.cities (id) on delete cascade,
  tech_type text not null,
  level smallint not null default 0,
  in_progress boolean not null default false,
  started_at timestamptz,
  completes_at timestamptz,
  primary key (city_id, tech_type)
);

create table public.troops (
  city_id uuid not null references public.cities (id) on delete cascade,
  troop_type text not null references public.troop_types (type),
  quantity integer not null default 0 check (quantity >= 0),
  primary key (city_id, troop_type)
);

create table public.training_queue (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete cascade,
  troop_type text not null references public.troop_types (type),
  quantity integer not null check (quantity > 0),
  started_at timestamptz not null default now(),
  completes_at timestamptz not null,
  resolved boolean not null default false
);

create index training_queue_city_id_idx on public.training_queue (city_id);

-- ---------------------------------------------------------------------------
-- marches & combat
-- ---------------------------------------------------------------------------
create table public.marches (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete cascade,
  camp_id uuid references public.wilderness_camps (id),
  target_x integer not null,
  target_y integer not null,
  march_type text not null default 'attack' check (march_type in ('attack')),
  troops jsonb not null, -- {troop_type: quantity} sent on the march
  departure_time timestamptz not null default now(),
  arrival_time timestamptz not null,
  return_time timestamptz not null,
  resolved boolean not null default false
);

create index marches_city_id_idx on public.marches (city_id);
create index marches_unresolved_idx on public.marches (resolved, arrival_time) where not resolved;

create table public.battle_reports (
  id uuid primary key default gen_random_uuid(),
  march_id uuid not null references public.marches (id) on delete cascade,
  city_id uuid not null references public.cities (id) on delete cascade,
  camp_id uuid references public.wilderness_camps (id),
  outcome text not null check (outcome in ('victory', 'defeat')),
  attacker_losses jsonb not null default '{}'::jsonb,
  defender_losses jsonb not null default '{}'::jsonb,
  loot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index battle_reports_city_id_idx on public.battle_reports (city_id);
