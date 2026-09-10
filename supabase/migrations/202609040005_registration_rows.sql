-- NULL preserves the previous single registration until its next save.
alter table public.site_settings
  add column if not exists animal_registrations jsonb;
