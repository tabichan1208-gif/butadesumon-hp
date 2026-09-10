alter table public.site_settings
  add column if not exists animal_registration_number text not null default '',
  add column if not exists animal_registration_date text not null default '',
  add column if not exists animal_registration_expiry text not null default '',
  add column if not exists animal_responsible_person text not null default '';
