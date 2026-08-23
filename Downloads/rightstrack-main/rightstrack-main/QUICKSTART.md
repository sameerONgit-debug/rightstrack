# RightsTrack - Autonomous Legal Agent System

## 🚀 Quick Start Guide

Welcome to RightsTrack, a fully autonomous, multi-domain Civic AI Legal Agent system designed to help citizens file grievances, track deadlines, and prepare appeals across 4 legal domains.

### What RightsTrack Does

**Autonomously handles:**
- 📋 Grievance analysis and domain classification
- 🔍 Statutory knowledge base queries with verified citations
- 📄 Generation of formal, statutory-compliant legal documents
- ⚠️ Statutory deadline monitoring and automatic appeal generation
- 🌍 Multi-language support (EN, HI, MR, BN, TA)
- 🎯 4 legal domains: RTI, Consumer Protection, Cyber Crime, Municipal

---

## ⚡ 30-Minute Setup

### 1. Install Dependencies
```bash
cd rightstrack
npm install
```

### 2. Configure Environment

Create `.env.local` in project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_[key]
SUPABASE_SERVICE_ROLE_KEY=sb_secret_[key]

# AI APIs
GEMINI_API_KEY=AQ.[your-key]

# Optional
GROQ_API_KEY=gsk_[key]
VOYAGE_API_KEY=pa_[key]
```

Get your credentials from:
- **Supabase**: https://supabase.com/dashboard
- **Gemini API**: https://ai.google.dev

### 3. Initialize Database

```bash
npm run db:init
```

This creates all required tables and indexes.

**Important**: Enable pgvector extension in Supabase dashboard:
1. Go to SQL Editor
2. Run: `CREATE EXTENSION IF NOT EXISTS vector;`

### 4. Ingest Knowledge Base

```bash
npm run ingest
```

This process:
- Parses 4 statutory markdown files
- Generates embeddings (768-dimensional vectors)
- Stores searchable legal knowledge (~200 chunks)
- **Takes ~2 minutes** on first run

### 5. Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

---

## 📱 Using the System

### Step 1: File a Grievance

Navigate to the intake form and describe your issue:
```
"I bought a laptop online on Jan 15, 2026 for ₹1,00,000. 
It stopped working after 2 weeks. The seller refuses to refund or replace."
```

### Step 2: System Analyzes Automatically

The Intake Agent:
- ✅ Classifies as CONSUMER domain
- ✅ Identifies missing information (invoice, proof of purchase)
- ✅ Generates clarifying questions
- ✅ Scores completeness (70%)

### Step 3: Answer Clarifying Questions

Provide:
- Invoice photo
- Communication with seller
- Proof of defect
- Amount sought as relief

### Step 4: Document Generated

The Drafts Agent creates:
- Formal Consumer Complaint Notice (Section 35 CPA 2019)
- Statutory citations and legal references
- Filing instructions
- Authority contact details
- Estimated filing timelines

**Document is ready to file with District Consumer Commission**

### Step 5: Automatic Deadline Monitoring

The Watchdog Agent:
- Tracks 30-day response deadline
- Alerts when 7 days remain (URGENT)
- Alerts when deadline passes (CRITICAL)
- Auto-generates First Appeal petition

**Example Alert**:
```
🔴 CRITICAL: District Commission deadline OVERDUE (25 days)
Action: File First Appeal to State Commission immediately
```

---

## 🔗 API Endpoints

### POST /api/analyze
**Analyze and classify grievance**

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "My RTI application was rejected wrongfully",
    "language": "en"
  }'
```

**Response**: Domain classification, missing fields, clarifying questions

---

### POST /api/cases
**Generate formal document from analysis**

```bash
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -d '{
    "analysis": { /* from /api/analyze */ },
    "answers": {
      "fieldName": "value"
    },
    "language": "en"
  }'
```

**Response**: Generated document, citations, filing guidance

---

### POST /api/cases/[caseId]/escalate
**File appeal automatically when eligible**

```bash
curl -X POST http://localhost:3000/api/cases/case-uuid-123/escalate \
  -H "Content-Type: application/json" \
  -d '{
    "caseStatus": "order_unfavorable",
    "appealReason": "Inadequate compensation",
    "language": "en"
  }'
```

**Response**: Appeal petition, filing instructions, next steps

---

### GET /api/agents/metrics
**Monitor agent performance**

```bash
curl http://localhost:3000/api/agents/metrics
```

**Returns**: Success rates, execution times, case counts

---

### GET /api/escalations/pending
**Monitor escalation deadlines**

```bash
curl "http://localhost:3000/api/escalations/pending?status=pending&priority=high"
```

**Returns**: Pending cases with deadline status

---

## 📊 Dashboard

Access the Agent Dashboard at `http://localhost:3000/dashboard`:

- Real-time agent metrics
- Case processing trends
- Escalation timeline
- Pending actions summary

---

## 🗄️ Database Tables

### cases
Citizen grievance cases with domain, status, documents

### case_documents
Generated formal documents (petitions, notices, complaints)

### escalations
Appeals and multi-level remedy tracking

### legal_knowledge
Vectorized statutory documents (searchable)

### case_monitoring
Watchdog agent monitoring logs

### agent_operations_log
Audit trail of all agent actions

---

## 🔒 Security

### Multi-Layer Verification
1. **Citations validated** against knowledge base (anti-hallucination)
2. **Documents verified** for completeness before submission
3. **Deadlines monitored** automatically to prevent missed appeals
4. **Audit logs** track all agent operations

### Row-Level Security
- Users see only their own cases
- Public read on legal knowledge base
- Service role for backend operations

---

## 📚 Legal Domains Supported

### 1. **RTI Act 2005** (Right to Information)
- Application drafting
- 45-day response deadline
- 2-level appeal framework
- State → Central Information Commission

### 2. **Consumer Protection Act 2019**
- Complaint notice generation
- 30-day response deadline
- 3-level appeal framework
- District → State → National Commission

### 3. **Cyber Crime & IT Act**
- Complaint memo generation
- 60-day FIR deadline
- CBI escalation for large frauds
- Banking fraud procedures

### 4. **Municipal Civic Grievance**
- Infrastructure complaints
- 15-day response deadline
- 3-level municipal hierarchy
- Category A/B/C handling

---

## 🛠️ Maintenance

### Add New Statutory Documents

1. Create markdown file in `knowledge-base/`
2. Follow hierarchical section structure (# ## ###)
3. Include legal section numbers (e.g., "Section 6(1)")
4. Run ingestion:
   ```bash
   npm run ingest
   ```

### Monitor Agent Performance

```bash
# Get all metrics
npm run db:metrics

# View specific agent
curl "http://localhost:3000/api/agents/metrics?agent=intake_agent"
```

### Check Database Status

```bash
npm run db:verify
```

---

## 🐛 Troubleshooting

### Issue: Ingestion fails
- Check `GEMINI_API_KEY` is valid
- Verify API quota not exceeded
- Check markdown files exist in `knowledge-base/`

### Issue: Vector search returns no results
- Run `npm run ingest` to populate knowledge base
- Check `npm run ingest:stats` shows records
- Verify pgvector extension is enabled

### Issue: Documents not saving
- Check Supabase connection
- Verify `SUPABASE_SERVICE_ROLE_KEY`
- Check database tables exist: `npm run db:verify`

### Issue: API returns 500 error
- Check server logs for errors
- Verify environment variables
- Check Supabase database is accessible

---

## 📖 Documentation

- **Full Guide**: See `AGENT_IMPLEMENTATION_GUIDE.md`
- **File Reference**: See `FILE_REFERENCE.md`
- **Implementation Summary**: See `IMPLEMENTATION_SUMMARY.md`

---

## 🚀 Production Deployment

### Pre-Production Checklist

```bash
# 1. Build
npm run build

# 2. Verify database
npm run db:verify

# 3. Check ingestion
npm run ingest:stats

# 4. Test API endpoints
curl http://localhost:3000/api/agents/metrics
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Other Platforms

- **Railway**: `railway up`
- **Firebase**: `firebase deploy`
- **DigitalOcean**: Add environment variables → Deploy

---

## 📞 Support

- Check troubleshooting section above
- Review error logs: `npm run db:verify`
- Test ingestion: `npm run ingest:test-search "test query" RTI`

---

## 📄 License

RightsTrack - Open Source Legal Agent System

---

## 🎯 Next Steps

1. ✅ Install and setup (completed above)
2. 📋 File your first grievance via UI
3. 📊 Check Agent Dashboard for monitoring
4. 📈 Scale by adding more statutory documents
5. 🚀 Deploy to production

---

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: 2026-08-23

**Happy serving citizens! 🇮🇳**
