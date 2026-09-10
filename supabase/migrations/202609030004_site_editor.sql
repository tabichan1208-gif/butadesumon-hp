alter table public.site_settings
  add column if not exists heading_font_family text not null default 'serif',
  add column if not exists heading_font_size integer not null default 48 check (heading_font_size between 24 and 80),
  add column if not exists eyebrow_font_size integer not null default 11 check (eyebrow_font_size between 8 and 20),
  add column if not exists hero_image_path text,
  add column if not exists about_image_path text,
  add column if not exists map_url text;

insert into public.site_content (section_key, heading, body, sort_order) values
  ('hero', 'ちいさな幸せに、\n会いにきてね。', '個性豊かなこぶたちゃんたちと、のんびり過ごす特別な時間。', 10),
  ('about', 'こぶたちゃんと過ごす、\nやさしいひととき。', '「豚ですもん。」は、かわいいマイクロブタたちと触れ合える小さなカフェです。木の温もりを感じる落ち着いた空間で、それぞれの個性をゆっくりお楽しみください。\n\n初めての方も、おひとりさまも、お子さま連れも大歓迎。こぶたちゃんたちと一緒に、皆さまをお待ちしています。', 20),
  ('friends', '豚ですもん。の仲間たち', 'みんな性格も模様もそれぞれ。お気に入りの子を見つけてね。', 30),
  ('guide_reservation', 'ご予約', '完全予約制ではありませんが、ご予約がおすすめです。このサイトから空き状況を確認してご予約いただけます。', 40),
  ('guide_parking', '駐車場', '店舗前に予約のお客様専用の駐車場が1台ございます。Web予約時に空き状況を確認してお選びください。', 41),
  ('guide_access', 'アクセス', '愛知県安城市。詳しい場所はご予約時にご案内します。', 42),
  ('reservation', 'オンライン予約', '空き状況を確認して、そのままご予約いただけます。', 50),
  ('footer', '豚ですもん。', 'こぶたちゃん達と一緒に、皆さまのご来店をお待ちしております。', 60)
on conflict (section_key) do nothing;

grant select on table public.site_settings, public.site_content, public.pigs, public.faqs to anon, authenticated;
grant insert, update on table public.site_content, public.pigs, public.faqs, public.media_assets to authenticated;
