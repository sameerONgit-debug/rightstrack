-- Supabase SQL Migration
-- RightsTrack Autonomous Legal Agent Database Schema

-- 1. Legal Knowledge Base Table with pgvector support
CREATE TABLE IF NOT EXISTS legal_knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL CHECK (domain IN ('RTI', 'CONSUMER', 'CYBER_FRAUD', 'MUNICIPAL', 'GENERAL')),
  file_name TEXT NOT NULL,
  section TEXT,
  subsection TEXT,
  section_number TEXT,
  content TEXT NOT NULL,
  content_length INTEGER,
  embedding vector(768),
  source_url TEXT UNIQUE,
  ingested_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on domain for faster filtering
CREATE INDEX idx_legal_knowledge_domain ON legal_knowledge(domain);
CREATE INDEX idx_legal_knowledge_section ON legal_knowledge(section);

-- Enable pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create index on embedding for similarity search
CREATE INDEX idx_legal_knowledge_embedding ON legal_knowledge USING ivfflat (embedding vector_cosine_ops);

-- 2. Cases Table
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL CHECK (domain IN ('RTI', 'CONSUMER', 'CYBER_FRAUD', 'MUNICIPAL')),
  user_id TEXT,
  status TEXT DEFAULT 'intake_analysis' CHECK (status IN (
    'intake_analysis', 'clarification_needed', 'analysis_complete',
    'document_draft', 'draft_ready', 'draft_incomplete', 'filed',
    'appeal_drafted', 'appeal_filed', 'resolved', 'closed'
  )),
  intake_data JSONB,
  user_responses JSONB,
  document_id UUID,
  language TEXT DEFAULT 'en',
  filing_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes on cases
CREATE INDEX idx_cases_domain ON cases(domain);
CREATE INDEX idx_cases_user_id ON cases(user_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_created_at ON cases(created_at DESC);

-- 3. Case Documents Table
CREATE TABLE IF NOT EXISTS case_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  domain TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'filed', 'archived')),
  version INTEGER DEFAULT 1,
  citations JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX idx_case_documents_status ON case_documents(status);

-- 4. Escalations/Appeals Table
CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  appeal_level INTEGER CHECK (appeal_level IN (1, 2, 3)),
  authority TEXT NOT NULL,
  status TEXT DEFAULT 'drafted' CHECK (status IN ('drafted', 'filed', 'pending', 'approved', 'rejected', 'dismissed')),
  petition_content TEXT,
  grounds TEXT[],
  relief_sought TEXT[],
  filing_date TIMESTAMP,
  decision_date TIMESTAMP,
  decision_remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_escalations_case_id ON escalations(case_id);
CREATE INDEX idx_escalations_status ON escalations(status);
CREATE INDEX idx_escalations_appeal_level ON escalations(appeal_level);

-- 5. Case Monitoring/Watchdog Table
CREATE TABLE IF NOT EXISTS case_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  check_date TIMESTAMP DEFAULT NOW(),
  alerts_generated INTEGER DEFAULT 0,
  deadlines_status JSONB,
  escalation_eligible BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_case_monitoring_case_id ON case_monitoring(case_id);
CREATE INDEX idx_case_monitoring_check_date ON case_monitoring(check_date DESC);

-- 6. Analysis Results Cache
CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id TEXT,
  domain TEXT,
  confidence FLOAT,
  extracted_fields JSONB,
  clarifying_questions JSONB,
  legal_citations JSONB,
  completeness JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  ttl TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX idx_analysis_results_intake_id ON analysis_results(intake_id);
CREATE INDEX idx_analysis_results_domain ON analysis_results(domain);

-- 7. Vector Search RPC Function
CREATE OR REPLACE FUNCTION search_legal_knowledge(
  query_embedding vector,
  similarity_threshold float DEFAULT 0.6,
  match_count int DEFAULT 5,
  domain_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  domain text,
  section text,
  section_number text,
  content text,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    legal_knowledge.id,
    legal_knowledge.domain,
    legal_knowledge.section,
    legal_knowledge.section_number,
    legal_knowledge.content,
    (1 - (legal_knowledge.embedding <=> query_embedding))::float as similarity
  FROM legal_knowledge
  WHERE (domain_filter IS NULL OR legal_knowledge.domain = domain_filter)
    AND (1 - (legal_knowledge.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Grant permissions (adjust based on your auth setup)
ALTER TABLE legal_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Create basic policies (allow public read for knowledge base, auth required for cases)
CREATE POLICY "Allow public read on legal knowledge" 
  ON legal_knowledge FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated read on cases" 
  ON cases FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow user to read own cases" 
  ON cases FOR SELECT 
  USING (user_id = auth.jwt() ->> 'sub' OR auth.role() = 'service_role');

-- Similar policies for other tables...
-- Adjust these based on your specific authentication and authorization needs

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  changes JSONB,
  actor_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- Create comments for documentation
COMMENT ON TABLE legal_knowledge IS 'Vectorized legal knowledge base with pgvector embeddings for semantic search across statutory documents';
COMMENT ON TABLE cases IS 'Core case records tracking citizen grievances from intake through resolution';
COMMENT ON TABLE case_documents IS 'Formal legal documents generated for each case (petitions, applications, notices)';
COMMENT ON TABLE escalations IS 'Appeal and escalation records for multi-level statutory remedies';
COMMENT ON TABLE case_monitoring IS 'Watchdog agent monitoring logs tracking deadlines and eligibility for escalation';
COMMENT ON FUNCTION search_legal_knowledge IS 'Vector similarity search across legal knowledge base - used by RAG agent for statutory grounding';
