-- Move pgvector out of the API schema and prevent direct calls to the RLS
-- event-trigger helper. Event triggers continue to invoke the helper internally.
alter function public.match_statutory_chunks(vector(1024), text, float, int)
  set search_path = pg_catalog, public, extensions;
alter extension vector set schema extensions;

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
