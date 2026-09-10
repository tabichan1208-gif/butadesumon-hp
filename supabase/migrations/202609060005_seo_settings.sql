alter table public.site_settings
  add column if not exists seo_title text not null default '豚ですもん。｜マイクロブタカフェ' check (char_length(seo_title) between 1 and 100),
  add column if not exists seo_description text not null default 'マイクロブタさんと、のんびりやさしい時間を。愛知県安城市のふれあいカフェ「豚ですもん。」' check (char_length(seo_description) between 1 and 300),
  add column if not exists seo_keywords text not null default 'マイクロブタカフェ,マイクロブタ,愛知県,安城市,豚ですもん',
  add column if not exists seo_canonical_url text,
  add column if not exists seo_image_path text,
  add column if not exists seo_indexing_enabled boolean not null default true;

grant select on table public.site_settings to anon, authenticated;
grant update on table public.site_settings to authenticated;
