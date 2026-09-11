create or replace function public.guard_reservation_schedule()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  japan_now timestamp := now() at time zone 'Asia/Tokyo';
  schedule_changed boolean := tg_op = 'INSERT'
    or new.reservation_date is distinct from old.reservation_date
    or new.start_time is distinct from old.start_time
    or new.source is distinct from old.source;
begin
  if not schedule_changed then return new; end if;
  if new.reservation_date < japan_now::date then raise exception 'PAST_DATE'; end if;
  if new.source = 'WEB' and new.reservation_date > (japan_now::date + interval '1 month')::date
  then raise exception 'BOOKING_WINDOW'; end if;
  if new.source = 'WEB' and new.reservation_date = japan_now::date and new.start_time <= japan_now::time
  then raise exception 'PAST_TIME'; end if;
  return new;
end;
$$;
