-- New-player provisioning.
--
-- On first signup (a row appearing in auth.users) we auto-create: a profile,
-- one city at a free world-map coordinate, its 24 city plots + 10 field
-- plots (empty except Castle/Walls/Alchemy Lab prebuilt at level 1, per the
-- alpha spec), and a starting resources row. This runs as a SECURITY
-- DEFINER trigger function so it can write across tables regardless of RLS.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_city_id uuid;
  v_x integer;
  v_y integer;
  v_attempt integer := 0;
begin
  v_display_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    split_part(new.email, '@', 1),
    'Lord'
  );

  insert into public.profiles (id, display_name)
  values (new.id, v_display_name);

  -- Pick a free coordinate on a 1000x1000 world map, retrying on collision.
  loop
    v_attempt := v_attempt + 1;
    v_x := floor(random() * 1000)::integer;
    v_y := floor(random() * 1000)::integer;

    begin
      insert into public.cities (owner_id, name, x, y)
      values (new.id, v_display_name || '''s City', v_x, v_y)
      returning id into v_city_id;
      exit;
    exception when unique_violation then
      if v_attempt >= 50 then
        raise exception 'Could not find a free city location after % attempts', v_attempt;
      end if;
    end;
  end loop;

  -- 24 city plots: Castle, Walls, Alchemy Lab prebuilt at level 1; rest empty.
  insert into public.city_plots (city_id, plot_index, building_type, level)
  select v_city_id, s.idx,
    case s.idx when 0 then 'castle' when 1 then 'walls' when 2 then 'alchemy_lab' else null end,
    case when s.idx in (0, 1, 2) then 1 else 0 end
  from generate_series(0, 23) as s(idx);

  -- 10 field plots: all empty, ready to build on.
  insert into public.field_plots (city_id, plot_index, building_type, level)
  select v_city_id, s.idx, null, 0
  from generate_series(0, 9) as s(idx);

  insert into public.resources (city_id, food, wood, stone, ore, gold, last_tick_at)
  values (v_city_id, 500, 500, 500, 200, 100, now());

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
