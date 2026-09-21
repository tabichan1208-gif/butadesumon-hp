create table if not exists public.business_schedule (
  id boolean primary key default true check (id),
  closed_weekdays smallint[] not null default '{1}',
  open_time time not null default '11:00', close_time time not null default '18:00',
  check (open_time < close_time)
);
insert into public.business_schedule(id) values(true) on conflict(id) do nothing;

create table if not exists public.business_exceptions (
  exception_date date primary key,
  kind text not null check(kind in ('CLOSED','OPEN')),
  open_time time, close_time time, note text,
  check(kind='CLOSED' or (open_time is not null and close_time is not null and open_time < close_time))
);
alter table public.business_schedule enable row level security;
alter table public.business_exceptions enable row level security;
grant select on public.business_schedule,public.business_exceptions to anon,authenticated;
grant insert,update,delete on public.business_schedule,public.business_exceptions to authenticated;
drop policy if exists public_schedule_read on public.business_schedule;
drop policy if exists public_exceptions_read on public.business_exceptions;
drop policy if exists staff_schedule_write on public.business_schedule;
drop policy if exists staff_exceptions_write on public.business_exceptions;
create policy public_schedule_read on public.business_schedule for select to anon,authenticated using(true);
create policy public_exceptions_read on public.business_exceptions for select to anon,authenticated using(true);
create policy staff_schedule_write on public.business_schedule for all to authenticated using(public.has_permission('store')) with check(public.has_permission('store'));
create policy staff_exceptions_write on public.business_exceptions for all to authenticated using(public.has_permission('store')) with check(public.has_permission('store'));

alter table public.reservations drop constraint if exists reservations_business_hours;

create or replace function public.assert_business_hours(p_date date,p_start time,p_duration integer)
returns void language plpgsql stable security definer set search_path='' as $$
declare s public.business_schedule%rowtype; e public.business_exceptions%rowtype; opens time; closes time;
begin
  select * into s from public.business_schedule where id=true;
  select * into e from public.business_exceptions where exception_date=p_date;
  if e.kind='CLOSED' or (e.exception_date is null and extract(isodow from p_date)::int=any(s.closed_weekdays)) then raise exception 'CLOSED_DAY'; end if;
  opens:=case when e.kind='OPEN' then e.open_time else s.open_time end;
  closes:=case when e.kind='OPEN' then e.close_time else s.close_time end;
  if p_start<opens or p_start+make_interval(mins=>p_duration)>closes then raise exception 'BUSINESS_HOURS'; end if;
end;$$;

create or replace function public.enforce_business_calendar()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform public.assert_business_hours(new.reservation_date,new.start_time,new.duration_minutes);
  return new;
end;$$;

drop trigger if exists reservations_business_calendar on public.reservations;
create trigger reservations_business_calendar
before insert or update of reservation_date,start_time,duration_minutes on public.reservations
for each row execute function public.enforce_business_calendar();
