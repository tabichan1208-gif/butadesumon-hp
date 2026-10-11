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
