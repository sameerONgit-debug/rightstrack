-- RightsTrack Database Schema
-- Supabase Postgres + pgvector for Problem Statement PS3

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Cases Table
CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'anon-user',
  domain TEXT NOT NULL CHECK (domain IN ('RTI', 'CONSUMER')),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFTING' CHECK (
    status IN ('DRAFTING', 'READY_TO_FILE', 'FILED', 'UNDER_REVIEW', 'DEADLINE_BREACHED', 'ESCALATED', 'RESOLVED', 'CANCELLED')
  ),
  narrative TEXT NOT NULL,
  entities JSONB DEFAULT '{}'::jsonb,
  filing_date TIMESTAMPTZ,
  acknowledgement_number TEXT,
  deadline_date TIMESTAMPTZ,
  statutory_rule TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('RTI_APPLICATION', 'CONSUMER_COMPLAINT', 'RTI_FIRST_APPEAL', 'CONSUMER_NOTICE')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  verified_citations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Statutory Knowledge Chunks (pgvector 1024-dim for Voyage Law)
CREATE TABLE IF NOT EXISTS statutory_chunks (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL CHECK (domain IN ('RTI', 'CONSUMER')),
  statute TEXT NOT NULL,
  section TEXT NOT NULL,
  citation_key TEXT NOT NULL UNIQUE,
  title TEXT,
  chunk_text TEXT NOT NULL,
  source_url TEXT,
  embedding vector(1024),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vector similarity search RPC function
CREATE OR REPLACE FUNCTION match_statutory_chunks (
  query_embedding vector(1024),
  match_threshold float,
  match_count int,
  filter_domain text
)
RETURNS TABLE (
  id text,
  domain text,
  statute text,
  section text,
  citation_key text,
  chunk_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    statutory_chunks.id,
    statutory_chunks.domain,
    statutory_chunks.statute,
    statutory_chunks.section,
    statutory_chunks.citation_key,
    statutory_chunks.chunk_text,
    1 - (statutory_chunks.embedding <=> query_embedding) AS similarity
  FROM statutory_chunks
  WHERE statutory_chunks.domain = filter_domain
    AND 1 - (statutory_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY statutory_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5. Case Escalations Table
CREATE TABLE IF NOT EXISTS escalations (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  escalation_type TEXT NOT NULL,
  grounds TEXT NOT NULL,
  appeal_document_id TEXT REFERENCES documents(id),
  new_deadline_days INT DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
