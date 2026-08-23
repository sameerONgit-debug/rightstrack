import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    const now = new Date();
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 1;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get case statistics
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select('status, domain, created_at, updated_at')
      .gte('created_at', startDate.toISOString());

    if (casesError) throw casesError;

    // Get escalation statistics
    const { data: escalations, error: escalError } = await supabase
      .from('escalations')
      .select('status, appeal_level, created_at')
      .gte('created_at', startDate.toISOString());

    if (escalError) throw escalError;

    // Process data
    const statusCounts = {
      intake_analysis: 0,
      clarification_needed: 0,
      analysis_complete: 0,
      document_draft: 0,
      draft_ready: 0,
      filed: 0,
      appeal_drafted: 0,
      resolved: 0,
      closed: 0,
    };

    const domainCounts = {
      RTI: 0,
      CONSUMER: 0,
      CYBER_FRAUD: 0,
      MUNICIPAL: 0,
    };

    cases.forEach((c) => {
      if (statusCounts.hasOwnProperty(c.status)) {
        statusCounts[c.status]++;
      }
      if (domainCounts.hasOwnProperty(c.domain)) {
        domainCounts[c.domain]++;
      }
    });

    // Generate trend data (daily)
    const trend = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const processed = cases.filter((c) => c.created_at.startsWith(dateStr)).length;
      const escalated = escalations.filter((e) => e.created_at.startsWith(dateStr)).length;

      trend.push({
        date: dateStr,
        processed,
        escalated,
      });
    }

    // Agent workload distribution
    const agentWorkload = [
      {
        agent: 'Intake Agent',
        active_tasks: Math.max(statusCounts.intake_analysis, 1),
        completed_tasks: statusCounts.analysis_complete,
      },
      {
        agent: 'RAG Agent',
        active_tasks: Math.max(statusCounts.analysis_complete, 1),
        completed_tasks: statusCounts.document_draft,
      },
      {
        agent: 'Drafts Agent',
        active_tasks: Math.max(statusCounts.document_draft, 1),
        completed_tasks: statusCounts.draft_ready,
      },
      {
        agent: 'Watchdog Agent',
        active_tasks: Math.max(statusCounts.filed, 1),
        completed_tasks: escalations.length,
      },
    ];

    return Response.json({
      timeRange: range,
      timestamp: new Date().toISOString(),
      status: Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
      })),
      domain: Object.entries(domainCounts).map(([name, value]) => ({
        name,
        value,
      })),
      trend,
      agentWorkload,
      totals: {
        total_cases: cases.length,
        total_escalations: escalations.length,
        completion_rate:
          cases.length > 0
            ? Math.round(
                ((statusCounts.draft_ready +
                  statusCounts.filed +
                  statusCounts.resolved +
                  statusCounts.closed) /
                  cases.length) *
                  100
              )
            : 0,
      },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
