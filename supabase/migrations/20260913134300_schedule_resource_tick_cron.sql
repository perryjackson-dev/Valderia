-- Backstop scheduled tick, so resources keep accruing for players who
-- aren't actively loading pages (tick_my_city already covers active
-- players on every read). pg_cron runs jobs as the postgres role, which
-- owns tick_all_cities, so no extra grant is needed for this to work.

create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'tick-all-cities-every-minute',
  '* * * * *',
  $$ select public.tick_all_cities(); $$
);
