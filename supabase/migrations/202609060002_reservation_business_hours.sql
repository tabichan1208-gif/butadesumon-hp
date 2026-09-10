alter table public.reservations
  drop constraint if exists reservations_business_hours;

alter table public.reservations
  add constraint reservations_business_hours
  check (
    start_time >= time '11:00'
    and start_time + make_interval(mins => duration_minutes) <= time '18:00'
  ) not valid;
