-- Align the already-applied Member 3 corpus schema with the server-only access model.
alter table public.statutory_chunks enable row level security;
revoke all on table public.statutory_chunks from anon, authenticated;

drop policy if exists "Service role can read statutory chunks" on public.statutory_chunks;
create policy "Service role can read statutory chunks"
  on public.statutory_chunks
  for select
  to service_role
  using (true);

alter function public.match_statutory_chunks(extensions.vector(1024), text, float, int)
  set search_path = pg_catalog, public, extensions;

revoke execute on function public.match_statutory_chunks(extensions.vector(1024), text, float, int) from public, anon, authenticated;
grant execute on function public.match_statutory_chunks(extensions.vector(1024), text, float, int) to service_role;
