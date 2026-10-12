-- Keep database-level authorization aligned with the application: owners have
-- the same full operational access as administrators, including future RLS
-- policies that delegate to has_permission().
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
        role in ('ADMIN', 'OWNER')
        or coalesce((permissions ->> permission_name)::boolean, false)
      )
  );
$$;

create or replace function public.is_staff()
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
      and role in ('STAFF', 'OWNER', 'ADMIN')
  );
$$;

-- The existing profiles policy delegates account management to is_admin().
-- Keep that policy intact while allowing owners to manage accounts just like
-- administrators.
create or replace function public.is_admin()
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
      and role in ('ADMIN', 'OWNER')
  );
$$;

-- SECURITY DEFINER helpers are only needed by authenticated management flows.
-- Do not leave their default PUBLIC execute privilege in place. The two pricing
-- policies below keep anonymous visitors able to read published prices without
-- executing is_staff().
revoke all on function public.has_permission(text) from public;
revoke all on function public.is_staff() from public;
revoke all on function public.is_admin() from public;

grant execute on function public.has_permission(text) to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- Preserve the former result for all callers:
-- * anonymous visitors: published prices only;
-- * authenticated non-staff: published prices only;
-- * STAFF / OWNER / ADMIN: published and unpublished prices.
-- Splitting the public policy prevents anonymous reads from requiring execute
-- on the SECURITY DEFINER is_staff() helper.
drop policy if exists public_pricing_settings_read on public.pricing_settings;
drop policy if exists authenticated_pricing_settings_read on public.pricing_settings;
create policy public_pricing_settings_read on public.pricing_settings
  for select to anon using (published);
create policy authenticated_pricing_settings_read on public.pricing_settings
  for select to authenticated using (published);

drop policy if exists public_pricing_items_read on public.pricing_items;
drop policy if exists authenticated_pricing_items_read on public.pricing_items;
create policy public_pricing_items_read on public.pricing_items
  for select to anon using (published);
create policy authenticated_pricing_items_read on public.pricing_items
  for select to authenticated using (published);
