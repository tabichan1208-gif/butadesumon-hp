create or replace function public.upsert_staff_reservation(
  p_reservation_date date, p_start_time time, p_duration_minutes integer,
  p_adults integer, p_children integer, p_infants integer, p_parking boolean,
  p_customer_name text, p_phone text, p_email text, p_note text,
  p_source public.reservation_source, p_id uuid default null
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  target_reservation_id uuid := coalesce(p_id, gen_random_uuid());
  p_end_time time;
  guests integer := p_adults + p_children + p_infants;
  capacity integer;
  parking_limit integer;
  peak integer;
begin
  if not public.is_staff() then raise exception 'NOT_AUTHORIZED'; end if;
  if p_duration_minutes not in (15,30,45,60) or guests < 1
    or char_length(trim(p_customer_name)) not between 1 and 100
    or char_length(trim(p_phone)) not between 8 and 30
  then raise exception 'INVALID_RESERVATION'; end if;
  select max_capacity, parking_capacity into capacity, parking_limit from public.site_settings where id = true;
  if guests > capacity then raise exception 'CAPACITY_EXCEEDED'; end if;
  p_end_time := p_start_time + make_interval(mins => p_duration_minutes);
  perform pg_advisory_xact_lock(hashtextextended(p_reservation_date::text, 0));

  with points(t) as (
    select p_start_time union select r.start_time from public.reservations r
    where r.reservation_date = p_reservation_date and r.status <> 'CANCELLED' and r.id <> target_reservation_id
      and r.start_time < p_end_time and r.start_time + make_interval(mins => r.duration_minutes) > p_start_time
  )
  select coalesce(max(guests + coalesce((select sum(r.adults+r.children+r.infants)::integer
    from public.reservations r where r.reservation_date=p_reservation_date and r.status<>'CANCELLED'
      and r.id<>target_reservation_id and r.start_time<=points.t
      and r.start_time+make_interval(mins=>r.duration_minutes)>points.t),0)),guests) into peak from points;
  if peak > capacity then raise exception 'CAPACITY_EXCEEDED'; end if;

  if p_parking and parking_limit < 1 then raise exception 'PARKING_UNAVAILABLE'; end if;
  if p_parking and exists (select 1 from public.reservations r
    where r.reservation_date=p_reservation_date and r.status<>'CANCELLED' and r.id<>target_reservation_id and r.parking
      and r.start_time<p_end_time and r.start_time+make_interval(mins=>r.duration_minutes)>p_start_time)
  then raise exception 'PARKING_UNAVAILABLE'; end if;

  insert into public.reservations (id,reservation_date,start_time,duration_minutes,adults,children,infants,parking,customer_name,phone,email,note,source,status,created_by)
  values (target_reservation_id,p_reservation_date,p_start_time,p_duration_minutes,p_adults,p_children,p_infants,p_parking,trim(p_customer_name),trim(p_phone),nullif(trim(p_email),''),nullif(trim(p_note),''),p_source,'CONFIRMED',auth.uid())
  on conflict (id) do update set reservation_date=excluded.reservation_date,start_time=excluded.start_time,
    duration_minutes=excluded.duration_minutes,adults=excluded.adults,children=excluded.children,infants=excluded.infants,
    parking=excluded.parking,customer_name=excluded.customer_name,phone=excluded.phone,email=excluded.email,
    note=excluded.note,source=excluded.source,status='CONFIRMED';
  return target_reservation_id;
end;
$$;

revoke all on function public.upsert_staff_reservation(date,time,integer,integer,integer,integer,boolean,text,text,text,text,public.reservation_source,uuid) from public;
grant execute on function public.upsert_staff_reservation(date,time,integer,integer,integer,integer,boolean,text,text,text,text,public.reservation_source,uuid) to authenticated;
