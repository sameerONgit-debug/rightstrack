import { createClient } from '@supabase/supabase-js';
import { getDomainConfig, calculateEscalationDeadline } from '@/lib/utils/agentUtils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const priority = searchParams.get('priority');

    let query = supabase
      .from('escalations')
      .select(`
        id,
        case_id,
        domain,
        appeal_level,
        authority,
        status,
        filing_date,
        created_at,
        cases(id, domain, status, filing_date)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data, error } = await query;

    if (error) throw error;

    // Format and filter response
    const escalations = data.map((esc) => {
      const config = getDomainConfig(esc.domain);
      const deadlines = calculateEscalationDeadline(
        esc.domain,
        esc.filing_date || new Date().toISOString()
      );

      const nextDeadline = deadlines?.find((d) => d.level === esc.appeal_level + 1);

      // Determine priority
      let escapePriority = 'normal';
      if (nextDeadline) {
        if (nextDeadline.isOverdue) {
          escapePriority = 'critical';
        } else if (nextDeadline.isUrgent) {
          escapePriority = 'high';
        }
      }

      return {
        caseId: esc.case_id,
        escalationId: esc.id,
        domain: esc.domain,
        appealLevel: esc.appeal_level,
        authority: esc.authority,
        status: esc.status,
        priority: escapePriority,
        deadline: nextDeadline?.deadline,
        daysRemaining: nextDeadline?.daysRemaining,
        isUrgent: nextDeadline?.isUrgent,
        isOverdue: nextDeadline?.isOverdue,
        createdAt: esc.created_at,
      };
    });

    // Filter by priority if specified
    const filtered = priority
      ? escalations.filter((e) => e.priority === priority)
      : escalations;

    return Response.json({
      timestamp: new Date().toISOString(),
      status,
      total: filtered.length,
      escalations: filtered,
      summary: {
        critical: filtered.filter((e) => e.priority === 'critical').length,
        high: filtered.filter((e) => e.priority === 'high').length,
        normal: filtered.filter((e) => e.priority === 'normal').length,
      },
    });
  } catch (error) {
    console.error('Escalations API error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { escalationId, status, decision, remarks } = body;

    const { data, error } = await supabase
      .from('escalations')
      .update({
        status: status || 'filed',
        decision_date: new Date().toISOString(),
        decision_remarks: remarks || null,
      })
      .eq('id', escalationId)
      .select();

    if (error) throw error;

    return Response.json({
      success: true,
      escalationId: escalationId,
      newStatus: status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Escalations update error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
