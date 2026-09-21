-- Management accounts always have every operational permission.  Keep the
-- stored permission object in sync so the account-management screen cannot
-- show a misleading, partially unchecked set of permissions.
update public.profiles
set permissions = jsonb_build_object(
  'reservations', true,
  'email', true,
  'site', true,
  'store', true,
  'pricing', true,
  'pigs', true,
  'faqs', true,
  'media', true,
  'seo', true
)
where role in ('ADMIN', 'OWNER');
