create or replace function public.guard_reservation_schedule()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  japan_now timestamp := now() at time zone 'Asia/Tokyo';
  schedule_changed boolean := tg_op = 'INSERT'
    or new.reservation_date is distinct from old.reservation_date
    or new.start_time is distinct from old.start_time;
begin
  if not schedule_changed then return new; end if;
  if new.reservation_date < japan_now::date then raise exception 'PAST_DATE'; end if;
  if new.source = 'WEB' and new.reservation_date = japan_now::date and new.start_time <= japan_now::time
  then raise exception 'PAST_TIME'; end if;
  return new;
end;
$$;

drop trigger if exists reservations_schedule_guard on public.reservations;
create trigger reservations_schedule_guard
before insert or update on public.reservations
for each row execute function public.guard_reservation_schedule();
