-- Players will eventually have up to 4 cities. tick_my_city previously
-- picked a single (arbitrary) city via SELECT INTO; now it ticks every
-- city the caller owns.

create or replace function public.tick_my_city()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_city record;
begin
  for v_city in select id from public.cities where owner_id = auth.uid() loop
    perform public.apply_resource_tick(v_city.id);
  end loop;
end;
$$;
