create table if not exists public.interior_photos (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  caption text not null default '',
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.interior_photos enable row level security;
drop policy if exists public_interior_read on public.interior_photos;
create policy public_interior_read on public.interior_photos for select to anon, authenticated using (published);
drop policy if exists staff_interior on public.interior_photos;
create policy staff_interior on public.interior_photos for all to authenticated using (public.is_staff()) with check (public.is_staff());
grant select on public.interior_photos to anon;
grant select, insert, update, delete on public.interior_photos to authenticated;
