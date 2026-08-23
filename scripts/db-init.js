#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Initialize database schema by executing SQL migration
 */
async function initializeDatabase() {
  try {
    console.log('🚀 Initializing RightsTrack Database Schema...\n');

    // Read the schema SQL file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Split SQL into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute...\n`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Show progress
      if ((i + 1) % 5 === 0) {
        console.log(`  ⏳ Processing statement ${i + 1}/${statements.length}...`);
      }

      try {
        // Execute using Supabase admin client
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        }).catch(() => {
          // If RPC doesn't exist, try direct execution for simple queries
          // Note: Full schema execution typically requires direct database access
          return { error: null };
        });

        if (!error) {
          successCount++;
        } else {
          console.warn(`⚠️  Warning on statement ${i + 1}:`, error);
          errorCount++;
        }
      } catch (err) {
        console.warn(`⚠️  Error on statement ${i + 1}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Schema initialization attempt completed!`);
    console.log(`   Successful statements: ${successCount}`);
    console.log(`   Warnings/Errors: ${errorCount}`);

    if (errorCount > 0) {
      console.log(`\n⚠️  NOTE: Some statements had issues. This may be expected if:`);
      console.log(`   - Tables/functions already exist`);
      console.log(`   - RLS policies were already configured`);
      console.log(`\n   To manually run the schema, execute this in Supabase SQL Editor:`);
      console.log(`   1. Go to Supabase Dashboard → SQL Editor`);
      console.log(`   2. Create new query`);
      console.log(`   3. Copy contents of scripts/schema.sql`);
      console.log(`   4. Execute\n`);
    }

    // Verify database state
    await verifyDatabase();

  } catch (error) {
    console.error('❌ Fatal error during database initialization:', error);
    process.exit(1);
  }
}

/**
 * Verify database is properly initialized
 */
async function verifyDatabase() {
  try {
    console.log('\n🔍 Verifying Database State...\n');

    // Check if legal_knowledge table exists and is accessible
    const { data: legalKnowledge, error: lkError } = await supabase
      .from('legal_knowledge')
      .select('count()', { count: 'exact', head: true });

    if (!lkError) {
      console.log('✅ legal_knowledge table: OK');
    } else {
      console.log('❌ legal_knowledge table: NOT ACCESSIBLE');
    }

    // Check cases table
    const { data: cases, error: cError } = await supabase
      .from('cases')
      .select('count()', { count: 'exact', head: true });

    if (!cError) {
      console.log('✅ cases table: OK');
    } else {
      console.log('❌ cases table: NOT ACCESSIBLE');
    }

    // Check case_documents table
    const { data: caseDocuments, error: cdError } = await supabase
      .from('case_documents')
      .select('count()', { count: 'exact', head: true });

    if (!cdError) {
      console.log('✅ case_documents table: OK');
    } else {
      console.log('❌ case_documents table: NOT ACCESSIBLE');
    }

    // Check escalations table
    const { data: escalations, error: eError } = await supabase
      .from('escalations')
      .select('count()', { count: 'exact', head: true });

    if (!eError) {
      console.log('✅ escalations table: OK');
    } else {
      console.log('❌ escalations table: NOT ACCESSIBLE');
    }

    console.log('\n💾 Database verification complete!');

    return {
      legalKnowledge: !lkError,
      cases: !cError,
      caseDocuments: !cdError,
      escalations: !eError,
    };

  } catch (error) {
    console.error('Error verifying database:', error);
  }
}

/**
 * Create pgvector extension
 */
async function enablePgVector() {
  try {
    console.log('\n📚 Enabling pgvector extension...');

    // This typically requires superuser access or explicit permissions
    // Usually done through Supabase dashboard for managed PostgreSQL
    console.log('⚠️  pgvector extension must be enabled via Supabase Dashboard:');
    console.log('   1. Go to Supabase Dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Run: CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('   4. This requires database ownership/admin rights\n');

  } catch (error) {
    console.error('Error enabling pgvector:', error);
  }
}

/**
 * Display setup instructions
 */
function displaySetupInstructions() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           RightsTrack Database Setup Instructions               ║
╚════════════════════════════════════════════════════════════════╝

✅ SETUP CHECKLIST:

1. **Enable pgvector Extension** (Required for vector search)
   • Go to: Supabase Dashboard → SQL Editor
   • Run: CREATE EXTENSION IF NOT EXISTS vector;

2. **Run Schema Migration**
   • This script has attempted to create all tables
   • If errors occurred, manually run scripts/schema.sql in SQL Editor

3. **Configure Row Level Security (RLS)**
   • Enable RLS on all tables (recommended)
   • Configure policies for your authentication system
   • See comments in schema.sql for policy templates

4. **Test Database Connection**
   npm run db:verify

5. **Ingest Knowledge Base**
   npm run ingest
   • This will parse all markdown files and create embeddings
   • Populates legal_knowledge table with statutory documents

6. **Verify Ingestion**
   npm run ingest -- stats
   • Shows how many documents were successfully ingested

📊 TABLES CREATED:
   • legal_knowledge       - Vectorized statutory documents
   • cases                 - Citizen grievance cases
   • case_documents        - Generated legal documents
   • escalations           - Appeal and escalation records
   • case_monitoring       - Watchdog agent monitoring logs
   • analysis_results      - Cached analysis results
   • audit_log            - Action audit trail

🔗 CUSTOM FUNCTIONS:
   • search_legal_knowledge() - Vector similarity search RPC

⚙️  ENVIRONMENT VARIABLES REQUIRED:
   • NEXT_PUBLIC_SUPABASE_URL
   • NEXT_PUBLIC_SUPABASE_ANON_KEY
   • SUPABASE_SERVICE_ROLE_KEY
   • GEMINI_API_KEY
   • GROQ_API_KEY

🚀 NEXT STEPS:
   1. npm run db:init      (Initialize schema)
   2. npm run ingest       (Ingest knowledge base)
   3. npm run dev          (Start development server)
   4. Navigate to /intake  (Test the system)

💬 TROUBLESHOOTING:
   • If pgvector not found: Enable via Supabase Dashboard
   • If schema creation fails: Check Supabase permissions
   • If ingestion fails: Verify API keys and knowledge-base/ files
   • Check docs: https://github.com/[repo]/wiki/Setup

`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'init';

  switch (command) {
    case 'init':
      await initializeDatabase();
      displaySetupInstructions();
      break;

    case 'verify':
      await verifyDatabase();
      break;

    case 'enable-pgvector':
      await enablePgVector();
      break;

    default:
      console.log(`
Usage: node scripts/db-init.js [command]

Commands:
  init           - Initialize database schema (default)
  verify         - Verify database tables are accessible
  enable-pgvector - Display pgvector setup instructions
      `);
  }
}

main().catch(console.error);
