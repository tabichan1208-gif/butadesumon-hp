create table if not exists public.pricing_settings (
  id boolean primary key default true check (id),
  heading text not null default 'ご利用料金' check (char_length(heading) between 1 and 100),
  description text not null default '' check (char_length(description) <= 1000),
  note text not null default '' check (char_length(note) <= 1000),
  published boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.pricing_items (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(label) between 1 and 100),
  price text not null check (char_length(price) between 1 and 100),
  description text check (description is null or char_length(description) <= 500),
  sort_order integer not null default 0 check (sort_order between -1000000 and 1000000),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.pricing_settings (id, description, note)
values (true, 'こぶたちゃんたちと過ごす、やさしいひとときをお楽しみください。', '料金は当日、店舗にてお支払いください。')
on conflict (id) do nothing;

alter table public.pricing_settings enable row level security;
alter table public.pricing_items enable row level security;

drop policy if exists public_pricing_settings_read on public.pricing_settings;
create policy public_pricing_settings_read on public.pricing_settings for select to anon, authenticated using (published or public.is_staff());
drop policy if exists staff_pricing_settings on public.pricing_settings;
create policy staff_pricing_settings on public.pricing_settings for all to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists public_pricing_items_read on public.pricing_items;
create policy public_pricing_items_read on public.pricing_items for select to anon, authenticated using (published or public.is_staff());
drop policy if exists staff_pricing_items on public.pricing_items;
create policy staff_pricing_items on public.pricing_items for all to authenticated using (public.is_staff()) with check (public.is_staff());

grant select on table public.pricing_settings, public.pricing_items to anon, authenticated;
grant insert, update, delete on table public.pricing_settings, public.pricing_items to authenticated;
