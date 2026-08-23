import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
/**
 * Queries the Supabase pgvector knowledge base for relevant legal sections
 * Performs semantic search across embedded statutory documents
 */
async function queryKnowledgeBase(query, domain, topK = 5) {
  try {
    // Generate embedding for the query
    const embedding = await generateEmbedding(query);

    // Query Supabase pgvector for semantically similar documents
    const { data, error } = await supabase.rpc('search_legal_knowledge', {
      query_embedding: embedding,
      similarity_threshold: 0.6,
      match_count: topK,
      domain_filter: domain,
    });

    if (error) {
      console.error('Supabase query error:', error);
      return { results: [], error: error.message };
    }

    return {
      results: data || [],
      queryId: uuidv4(),
      timestamp: new Date().toISOString(),
      query,
      domain,
      resultsCount: data?.length || 0,
    };
  } catch (error) {
    console.error('Knowledge Base Query Error:', error);
    return { results: [], error: error.message };
  }
}

/**
 * Generates embeddings for text using Voyage API or Gemini API
 */
async function generateEmbedding(text) {
  try {
    // Using Gemini's embedding capability
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    
    const result = await model.embedContent({
      content: text,
    });

    return result.embedding.values;
  } catch (error) {
    console.error('Embedding generation error:', error);
    // Fallback: return a zero vector of appropriate dimension
    return new Array(768).fill(0);
  }
}

/**
 * Validates citations against knowledge base with anti-hallucination scoring
 * Checks if AI-generated citations are actually grounded in the knowledge base
 */
async function validateCitations(citations, domain) {
  try {
    const validationResults = [];

    for (const citation of citations) {
      const query = `${citation.actName} ${citation.section} ${citation.excerpt}`;
      const results = await queryKnowledgeBase(query, domain, 3);

      const isVerified = results.results.length > 0 && results.results[0].similarity > 0.75;
      const confidenceScore = isVerified ? results.results[0].similarity : 0;

      validationResults.push({
        citation,
        isVerified,
        confidenceScore: Math.round(confidenceScore * 100),
        matchedDocuments: results.results.map(r => ({
          section: r.section,
          excerpt: r.content,
          similarity: Math.round(r.similarity * 100),
        })),
        status: isVerified ? 'verified' : 'unverified',
      });
    }

    const overallScore = validationResults.length > 0
      ? Math.round(validationResults.reduce((sum, r) => sum + r.confidenceScore, 0) / validationResults.length)
      : 0;

    return {
      validationId: uuidv4(),
      timestamp: new Date().toISOString(),
      citations: validationResults,
      antiHallucinationScore: overallScore,
      status: overallScore >= 70 ? 'approved' : 'flagged_for_review',
      flaggedCount: validationResults.filter(r => !r.isVerified).length,
    };
  } catch (error) {
    console.error('Citation Validation Error:', error);
    return {
      validationId: uuidv4(),
      citations: [],
      error: error.message,
      status: 'error',
    };
  }
}

/**
 * Performs comprehensive statutory grounding check
 * Returns which sections of relevant acts apply to the grievance
 */
async function performStatutoryGrounding(grievanceSummary, domain, relevantActs = []) {
  try {
    //const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const groundingPrompt = `
You are a legal researcher. Based on this grievance and the relevant acts, identify all applicable statutory sections with high precision.

Domain: ${domain}
Relevant Acts: ${relevantActs.join(', ')}

Grievance Summary: "${grievanceSummary}"

For each applicable section, provide:
1. Act Name
2. Section Number
3. Exact excerpt from the act
4. How it applies to this grievance
5. Remedies available under this section

Respond in valid JSON:
{
  "applicableSections": [
    {
      "actName": string,
      "section": string,
      "excerpt": string,
      "applicability": string,
      "availableRemedies": [string],
      "priority": "primary" | "secondary"
    }
  ],
  "legalBasis": string,
  "recommendedApproach": string
}`;

    const completion = await groq.chat.completions.create({
  model: 'openai/gpt-oss-120b',
  messages: [{ role: 'user', content: groundingPrompt }],
});

const text = completion.choices[0].message.content;

let cleanText = text.trim();
if (cleanText.includes('```json')) {
  cleanText = cleanText.split('```json')[1].split('```')[0].trim();
} else if (cleanText.includes('```')) {
  cleanText = cleanText.split('```')[1].split('```')[0].trim();
}

const firstBrace = cleanText.indexOf('{');
const lastBrace = cleanText.lastIndexOf('}');

if (firstBrace === -1 || lastBrace === -1) {
  return { applicableSections: [], error: 'Failed to parse response' };
}

const groundingData = JSON.parse(cleanText.substring(firstBrace, lastBrace + 1));
    // Verify each section in knowledge base
    const verified = [];
    for (const section of groundingData.applicableSections) {
      const query = `${section.actName} ${section.section}`;
      const results = await queryKnowledgeBase(query, domain, 1);
      
      section.verified = results.results.length > 0;
      section.verificationScore = results.results[0]?.similarity || 0;
      verified.push(section);
    }

    return {
      groundingId: uuidv4(),
      timestamp: new Date().toISOString(),
      domain,
      applicableSections: verified,
      legalBasis: groundingData.legalBasis,
      recommendedApproach: groundingData.recommendedApproach,
      verifiedCount: verified.filter(s => s.verified).length,
      totalSections: verified.length,
    };
  } catch (error) {
    console.error('Statutory Grounding Error:', error);
    return {
      groundingId: uuidv4(),
      applicableSections: [],
      error: error.message,
    };
  }
}

/**
 * Generates a confidence report on the quality of research
 */
function generateResearchQualityReport(citations, groundingData, queryResults) {
  const metrics = {
    citationCoverage: citations?.length || 0,
    verifiedCitations: citations?.filter(c => c.isVerified).length || 0,
    groundingSections: groundingData?.verifiedCount || 0,
    totalGroundingSections: groundingData?.totalSections || 0,
    queryResultsCount: queryResults?.resultsCount || 0,
  };

  const citationScore = metrics.citationCoverage > 0
    ? (metrics.verifiedCitations / metrics.citationCoverage) * 100
    : 0;

  const groundingScore = metrics.totalGroundingSections > 0
    ? (metrics.groundingSections / metrics.totalGroundingSections) * 100
    : 0;

  const overallQualityScore = (citationScore + groundingScore) / 2;

  return {
    reportId: uuidv4(),
    timestamp: new Date().toISOString(),
    metrics,
    citationScore: Math.round(citationScore),
    groundingScore: Math.round(groundingScore),
    overallQualityScore: Math.round(overallQualityScore),
    confidence: overallQualityScore >= 80 ? 'high' : overallQualityScore >= 60 ? 'medium' : 'low',
    recommendations: overallQualityScore < 80
      ? ['Review unverified citations', 'Check knowledge base for missing documents']
      : [],
  };
}

export const ragAgent = {
  queryKnowledgeBase,
  generateEmbedding,
  validateCitations,
  performStatutoryGrounding,
  generateResearchQualityReport,
};
