alter table public.site_settings
  add column if not exists instagram_url text;

grant select on table public.site_settings to anon, authenticated;
grant update on table public.site_settings to authenticated;
