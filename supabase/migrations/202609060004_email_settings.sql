create table if not exists public.email_settings (
  id boolean primary key default true check (id),
  customer_email_enabled boolean not null default false,
  customer_subject text not null default '【豚ですもん。】ご予約を受け付けました' check (char_length(customer_subject) between 1 and 200),
  customer_body text not null default '' check (char_length(customer_body) between 1 and 10000),
  store_email_enabled boolean not null default false,
  store_notification_email text not null default '' check (char_length(store_notification_email) <= 320),
  store_subject text not null default '【新規予約】{{来店日}} {{開始時間}}／{{お名前}} 様' check (char_length(store_subject) between 1 and 200),
  store_body text not null default '' check (char_length(store_body) between 1 and 10000),
  updated_at timestamptz not null default now()
);

insert into public.email_settings (id, customer_body, store_body)
values (
  true,
  E'{{お名前}} 様\n\n豚ですもん。へご予約いただき、ありがとうございます。\n以下の内容でご予約を受け付けました。\n\n来店日：{{来店日}}\n開始時間：{{開始時間}}\n利用時間：{{利用時間}}\n人数：{{人数}}\n駐車場：{{駐車場}}\n備考：{{備考}}\n\nご来店を心よりお待ちしております。',
  E'ホームページから新しい予約が入りました。\n\n受付番号：{{予約番号}}\n来店日：{{来店日}}\n開始時間：{{開始時間}}\n利用時間：{{利用時間}}\nお名前：{{お名前}}\n電話番号：{{電話番号}}\nメール：{{メール}}\n人数：{{人数}}\n駐車場：{{駐車場}}\n備考：{{備考}}'
)
on conflict (id) do nothing;

alter table public.email_settings enable row level security;
drop policy if exists staff_email_settings on public.email_settings;
create policy staff_email_settings on public.email_settings for all to authenticated
using (public.is_staff()) with check (public.is_staff());

grant select, insert, update on table public.email_settings to authenticated;
