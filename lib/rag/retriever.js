import { getVoyageEmbedding } from './voyage';
import { supabase } from '../supabase/client';

/**
 * Semantic Vector Retriever — Queries Supabase pgvector for statutory sections matching query embedding.
 */
export async function retrieveStatutoryPassages(query, domain, topK = 5) {
  try {
    const embedding = await getVoyageEmbedding(query);
    if (!embedding) {
      return getFallbackStatutes(domain);
    }

    const { data, error } = await supabase.rpc('match_statutory_chunks', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: topK,
      filter_domain: domain,
    });

    if (error || !data || data.length === 0) {
      return getFallbackStatutes(domain);
    }

    return data;
  } catch (err) {
    console.warn('[Retriever] Vector retrieval failed, using fallback:', err.message);
    return getFallbackStatutes(domain);
  }
}

function getFallbackStatutes(domain) {
  if (domain === 'RTI') {
    return [
      {
        citation_key: 'RTI-SEC-6(1)',
        statute: 'Right to Information Act, 2005',
        section: 'Section 6(1)',
        text: 'A person, who desires to obtain any information under this Act, shall make a request in writing or through electronic means...',
      },
      {
        citation_key: 'RTI-SEC-7(1)',
        statute: 'Right to Information Act, 2005',
        section: 'Section 7(1)',
        text: 'The Public Information Officer on receipt of a request shall within thirty days either provide information or reject...',
      },
      {
        citation_key: 'RTI-SEC-19(1)',
        statute: 'Right to Information Act, 2005',
        section: 'Section 19(1)',
        text: 'Any person who does not receive a decision within thirty days may prefer a First Appeal...',
      },
    ];
  }

  return [
    {
      citation_key: 'CPA-SEC-2(11)',
      statute: 'Consumer Protection Act, 2019',
      section: 'Section 2(11)',
      text: 'Deficiency means any fault, imperfection, shortcoming or inadequacy in the quality, nature and manner of performance...',
    },
    {
      citation_key: 'CPA-SEC-35',
      statute: 'Consumer Protection Act, 2019',
      section: 'Section 35',
      text: 'A complaint in relation to any goods sold or delivered or agreed to be sold or delivered or any service provided may be filed with a District Commission...',
    },
  ];
}
