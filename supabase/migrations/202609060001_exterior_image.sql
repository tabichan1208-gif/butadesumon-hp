alter table public.site_settings
  add column if not exists exterior_image_path text;

grant select on table public.site_settings to anon, authenticated;
grant update on table public.site_settings to authenticated;
