create or replace function public.enforce_parking_turnover_buffer()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'CANCELLED' or not new.parking then
    return new;
  end if;

  if exists (
    select 1
    from public.reservations r
    where r.reservation_date = new.reservation_date
      and r.status <> 'CANCELLED'
      and r.parking
      and r.id <> new.id
      and r.start_time < new.start_time + make_interval(mins => new.duration_minutes + 15)
      and r.start_time + make_interval(mins => r.duration_minutes + 15) > new.start_time
  ) then
    raise exception 'PARKING_UNAVAILABLE';
  end if;

  return new;
end;
$$;

drop trigger if exists reservations_parking_turnover_buffer on public.reservations;
create trigger reservations_parking_turnover_buffer
before insert or update of reservation_date,start_time,duration_minutes,parking,status
on public.reservations
for each row execute function public.enforce_parking_turnover_buffer();
