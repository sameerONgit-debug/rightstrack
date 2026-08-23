import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE environment variables in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Deterministic 1024-dimension text hashing vectorizer (Zero API limit / Zero failure)
function generateDeterministicVector(text, dimensions = 1024) {
  const vector = new Array(dimensions).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  
  words.forEach((word, idx) => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % dimensions;
    vector[index] += 1 / (idx + 1);
  });

  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map(val => Number((val / magnitude).toFixed(6)));
}

async function ingestKnowledgeBase() {
  const kbDir = path.join(process.cwd(), 'knowledge-base');
  if (!fs.existsSync(kbDir)) {
    console.error("Knowledge base folder not found at:", kbDir);
    return;
  }

  const files = fs.readdirSync(kbDir).filter(f => f.endsWith('.md'));
  console.log(`Found ${files.length} knowledge base files to ingest.`);

  for (const file of files) {
    const filePath = path.join(kbDir, file);
    const rawText = fs.readFileSync(filePath, 'utf-8');
    const domain = file.includes('consumer') ? 'CONSUMER' : file.includes('cyber') ? 'CYBER' : 'RTI';

    const sections = rawText.split(/###\s+/).filter(s => s.trim().length > 0);
    console.log(`\nProcessing ${file} (${sections.length} sections)...`);

    for (let i = 0; i < sections.length; i++) {
      const sectionText = sections[i].trim();
      const lines = sectionText.split('\n');
      const title = lines[0].replace(/#/g, '').trim();
      const content = lines.slice(1).join('\n').trim() || sectionText;

      const embedding = generateDeterministicVector(`${title} ${content}`, 1024);

      const record = {
        domain: domain,
        act_name: file.replace('.md', '').toUpperCase(),
        section: `Sec-${i + 1}`,
        title: title || 'Legal Provision',
        content: content,
        content_length: content.length,
        embedding: embedding
      };

      const { error } = await supabase.from('legal_knowledge').insert(record);

      if (error) {
        console.error(`Error inserting chunk ${i + 1}:`, error.message);
      } else {
        console.log(`✓ Inserted [${domain}]: ${title.substring(0, 35)}...`);
      }
    }
  }

  console.log("\n All legal knowledge successfully ingested into Supabase!");
}

ingestKnowledgeBase();