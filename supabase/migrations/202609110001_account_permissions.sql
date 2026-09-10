alter table public.profiles
  add column if not exists permissions jsonb not null default '{"reservations": true}'::jsonb;

alter table public.profiles
  add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

create or replace function public.has_permission(permission_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (
        role = 'ADMIN'
        or coalesce((permissions ->> permission_name)::boolean, false)
      )
  );
$$;

revoke all on function public.has_permission(text) from public;
grant execute on function public.has_permission(text) to authenticated;

drop policy if exists staff_reservations on public.reservations;
create policy staff_reservations on public.reservations for all to authenticated
using (public.has_permission('reservations'))
with check (public.has_permission('reservations'));

drop policy if exists staff_email_settings on public.email_settings;
create policy staff_email_settings on public.email_settings for all to authenticated
using (public.has_permission('email'))
with check (public.has_permission('email'));

drop policy if exists staff_content on public.site_content;
create policy staff_content on public.site_content for all to authenticated
using (public.has_permission('site'))
with check (public.has_permission('site'));

drop policy if exists staff_interior on public.interior_photos;
create policy staff_interior on public.interior_photos for all to authenticated
using (public.has_permission('site'))
with check (public.has_permission('site'));

drop policy if exists staff_settings on public.site_settings;
create policy staff_settings on public.site_settings for all to authenticated
using (
  public.has_permission('store') or public.has_permission('seo') or public.has_permission('media')
)
with check (
  public.has_permission('store') or public.has_permission('seo') or public.has_permission('media')
);

drop policy if exists staff_pricing_settings on public.pricing_settings;
create policy staff_pricing_settings on public.pricing_settings for all to authenticated
using (public.has_permission('pricing'))
with check (public.has_permission('pricing'));

drop policy if exists staff_pricing_items on public.pricing_items;
create policy staff_pricing_items on public.pricing_items for all to authenticated
using (public.has_permission('pricing'))
with check (public.has_permission('pricing'));

drop policy if exists staff_pigs on public.pigs;
create policy staff_pigs on public.pigs for all to authenticated
using (public.has_permission('pigs'))
with check (public.has_permission('pigs'));

drop policy if exists staff_faqs on public.faqs;
create policy staff_faqs on public.faqs for all to authenticated
using (public.has_permission('faqs'))
with check (public.has_permission('faqs'));

drop policy if exists staff_media on public.media_assets;
create policy staff_media on public.media_assets for all to authenticated
using (public.has_permission('media'))
with check (public.has_permission('media'));

drop policy if exists staff_site_media_write on storage.objects;
create policy staff_site_media_write on storage.objects for all to authenticated
using (bucket_id = 'site-media' and public.has_permission('media'))
with check (bucket_id = 'site-media' and public.has_permission('media'));

create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('STAFF', 'ADMIN'));
$$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, email, role, permissions)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email),
    new.email,
    'STAFF',
    '{"reservations": true}'::jsonb
  );
  return new;
end;
$$;
