-- RightsTrack Member 3 legal retrieval schema.
-- Voyage legal embeddings are stored at 1024 dimensions.
create schema if not exists extensions;
create extension if not exists vector with schema extensions;

create table if not exists public.statutory_chunks (
  chunk_id text primary key,
  act_name text not null,
  section_number text not null,
  section_title text not null,
  full_text text not null,
  jurisdiction text not null default 'Central',
  document_type text not null default 'statute',
  source_authority text not null default 'India Code',
  source_url text not null,
  effective_date date,
  last_verified_date date,
  domain_tag text not null check (domain_tag in ('RTI', 'Consumer')),
  embedding extensions.vector(1024) not null
);

create index if not exists statutory_chunks_domain_idx on public.statutory_chunks(domain_tag);

-- Statutory corpus access is server-side only. The service role is used by the
-- retrieval endpoint; browser roles must not enumerate the full legal corpus.
alter table public.statutory_chunks enable row level security;
revoke all on table public.statutory_chunks from anon, authenticated;
create policy "Service role can read statutory chunks"
  on public.statutory_chunks
  for select
  to service_role
  using (true);

create or replace function public.match_statutory_chunks(
  query_embedding extensions.vector(1024),
  match_domain text,
  match_threshold float default 0.55,
  match_count int default 5
)
returns table (
  chunk_id text,
  act_name text,
  section_number text,
  section_title text,
  full_text text,
  jurisdiction text,
  document_type text,
  source_authority text,
  source_url text,
  effective_date date,
  last_verified_date date,
  domain_tag text,
  similarity float
)
language sql stable
set search_path = pg_catalog, public, extensions
as $$
  select
    s.chunk_id,
    s.act_name,
    s.section_number,
    s.section_title,
    s.full_text,
    s.jurisdiction,
    s.document_type,
    s.source_authority,
    s.source_url,
    s.effective_date,
    s.last_verified_date,
    s.domain_tag,
    1 - (s.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.statutory_chunks s
  where s.domain_tag = match_domain
    and 1 - (s.embedding operator(extensions.<=>) query_embedding) >= match_threshold
  order by s.embedding operator(extensions.<=>) query_embedding
  limit least(match_count, 10);
$$;

revoke execute on function public.match_statutory_chunks(extensions.vector(1024), text, float, int) from public, anon, authenticated;
grant execute on function public.match_statutory_chunks(extensions.vector(1024), text, float, int) to service_role;
