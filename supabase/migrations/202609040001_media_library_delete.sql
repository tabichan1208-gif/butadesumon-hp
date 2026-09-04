-- Recoverable library deletion: original Storage files remain untouched.
alter table public.media_assets add column if not exists deleted_at timestamptz;
