alter table public.site_settings
  add column if not exists animal_registrant text not null default '',
  add column if not exists animal_business_name text not null default '',
  add column if not exists animal_business_address text not null default '',
  add column if not exists animal_business_type text not null default '',
  add column if not exists animal_registration_published boolean not null default false;
