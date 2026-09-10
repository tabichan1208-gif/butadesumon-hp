-- Existing staff_pigs RLS policy restricts deletion to staff/admin.
grant delete on table public.pigs to authenticated;
