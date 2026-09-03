create extension if not exists pgcrypto;

create type public.reservation_source as enum ('WEB', 'PHONE', 'WALK_IN', 'OTHER');
create type public.reservation_status as enum ('PENDING', 'CONFIRMED', 'CANCELLED');
create type public.app_role as enum ('STAFF', 'ADMIN');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.app_role not null default 'STAFF',
  created_at timestamptz not null default now()
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  reservation_date date not null,
  start_time time not null,
  duration_minutes integer not null check (duration_minutes in (15, 30, 45, 60)),
  adults integer not null default 0 check (adults >= 0),
  children integer not null default 0 check (children >= 0),
  infants integer not null default 0 check (infants >= 0),
  parking boolean not null default false,
  customer_name text not null check (char_length(customer_name) between 1 and 100),
  phone text not null check (char_length(phone) between 8 and 30),
  email text,
  note text check (char_length(note) <= 2000),
  source public.reservation_source not null default 'WEB',
  status public.reservation_status not null default 'CONFIRMED',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (adults + children + infants between 1 and 8)
);

create index reservations_schedule_idx on public.reservations (reservation_date, start_time) where status <> 'CANCELLED';

create table public.site_settings (
  id boolean primary key default true check (id),
  store_name text not null default '豚ですもん。',
  tagline text not null default 'こぶたと過ごす、やさしい時間。',
  business_hours text not null default '10:00–17:00（最終受付 16:00）',
  closed_days text not null default '火曜日・水曜日',
  address text not null default '愛知県',
  phone text,
  max_capacity integer not null default 8 check (max_capacity > 0),
  parking_capacity integer not null default 1 check (parking_capacity >= 0),
  primary_color text not null default '#b75d64',
  background_color text not null default '#fbf7ee',
  font_family text not null default 'gothic',
  base_font_size integer not null default 16 check (base_font_size between 12 and 24),
  seo_title text,
  seo_description text,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (true);

create table public.site_content (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null,
  heading text,
  body text,
  sort_order integer not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.pigs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  breed text not null default 'マイクロブタ',
  bio text,
  image_path text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text unique not null,
  alt_text text,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('STAFF', 'ADMIN'));
$$;

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger reservations_touch before update on public.reservations for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.site_settings for each row execute function public.touch_updated_at();
create trigger content_touch before update on public.site_content for each row execute function public.touch_updated_at();
create trigger pigs_touch before update on public.pigs for each row execute function public.touch_updated_at();
create trigger faqs_touch before update on public.faqs for each row execute function public.touch_updated_at();

create or replace function public.create_public_reservation(
  p_reservation_date date, p_start_time time, p_duration_minutes integer,
  p_adults integer, p_children integer, p_infants integer, p_parking boolean,
  p_customer_name text, p_phone text, p_email text default null, p_note text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  new_id uuid;
  p_end_time time;
  guests integer := p_adults + p_children + p_infants;
  capacity integer;
  parking_limit integer;
  peak integer;
begin
  if p_duration_minutes not in (15,30,45,60) or guests < 1 then raise exception 'INVALID_RESERVATION'; end if;
  select max_capacity, parking_capacity into capacity, parking_limit from public.site_settings where id = true;
  if guests > capacity then raise exception 'CAPACITY_EXCEEDED'; end if;
  p_end_time := p_start_time + make_interval(mins => p_duration_minutes);
  perform pg_advisory_xact_lock(hashtextextended(p_reservation_date::text, 0));

  with points(t) as (
    select p_start_time union
    select r.start_time from public.reservations r
    where r.reservation_date = p_reservation_date and r.status <> 'CANCELLED'
      and r.start_time < p_end_time
      and r.start_time + make_interval(mins => r.duration_minutes) > p_start_time
  )
  select coalesce(max(guests + coalesce((
    select sum(r.adults + r.children + r.infants)::integer from public.reservations r
    where r.reservation_date = p_reservation_date and r.status <> 'CANCELLED'
      and r.start_time <= points.t
      and r.start_time + make_interval(mins => r.duration_minutes) > points.t
  ), 0)), guests) into peak from points;
  if peak > capacity then raise exception 'CAPACITY_EXCEEDED'; end if;

  if p_parking and parking_limit < 1 then raise exception 'PARKING_UNAVAILABLE'; end if;
  if p_parking and exists (
    select 1 from public.reservations r where r.reservation_date = p_reservation_date
      and r.status <> 'CANCELLED' and r.parking
      and r.start_time < p_end_time
      and r.start_time + make_interval(mins => r.duration_minutes) > p_start_time
  ) then raise exception 'PARKING_UNAVAILABLE'; end if;

  insert into public.reservations (reservation_date,start_time,duration_minutes,adults,children,infants,parking,customer_name,phone,email,note,source)
  values (p_reservation_date,p_start_time,p_duration_minutes,p_adults,p_children,p_infants,p_parking,trim(p_customer_name),trim(p_phone),nullif(trim(p_email),''),nullif(trim(p_note),''),'WEB') returning id into new_id;
  return new_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.reservations enable row level security;
alter table public.site_settings enable row level security;
alter table public.site_content enable row level security;
alter table public.pigs enable row level security;
alter table public.faqs enable row level security;
alter table public.media_assets enable row level security;

create policy staff_profiles on public.profiles for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_reservations on public.reservations for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy public_settings_read on public.site_settings for select to anon, authenticated using (true);
create policy public_content_read on public.site_content for select to anon, authenticated using (published);
create policy public_pigs_read on public.pigs for select to anon, authenticated using (published);
create policy public_faqs_read on public.faqs for select to anon, authenticated using (published);
create policy staff_settings on public.site_settings for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_content on public.site_content for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_pigs on public.pigs for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_faqs on public.faqs for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_media on public.media_assets for all to authenticated using (public.is_staff()) with check (public.is_staff());

revoke all on function public.create_public_reservation(date,time,integer,integer,integer,integer,boolean,text,text,text,text) from public;
grant execute on function public.create_public_reservation(date,time,integer,integer,integer,integer,boolean,text,text,text,text) to anon, authenticated;

insert into storage.buckets (id, name, public) values ('site-media', 'site-media', true) on conflict (id) do nothing;
create policy public_site_media_read on storage.objects for select to public using (bucket_id = 'site-media');
create policy staff_site_media_write on storage.objects for all to authenticated using (bucket_id = 'site-media' and public.is_staff()) with check (bucket_id = 'site-media' and public.is_staff());
