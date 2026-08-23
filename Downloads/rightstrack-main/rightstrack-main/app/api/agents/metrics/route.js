export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabaseClient';

export async function GET(request) {
  try {
    
    // Get metrics for all agents over last 24 hours
    const { searchParams } = new URL(request.url);
    const agent = searchParams.get('agent');
    const timeRange = searchParams.get('range') || '24h';

    const now = new Date();
    const hours = timeRange === '7d' ? 168 : timeRange === '24h' ? 24 : 1;
    const startDate = new Date(now.getTime() - hours * 60 * 60 * 1000);

    let query = supabase
      .from('agent_operations_log')
      .select('agent_name, status, execution_time_ms, created_at')
      .gte('created_at', startDate.toISOString());

    if (agent) {
      query = query.eq('agent_name', agent);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate metrics by agent
    const agentMetrics = {};
    data.forEach((op) => {
      if (!agentMetrics[op.agent_name]) {
        agentMetrics[op.agent_name] = {
          total: 0,
          success: 0,
          error: 0,
          avgTime: 0,
          totalTime: 0,
        };
      }

      agentMetrics[op.agent_name].total += 1;
      if (op.status === 'success') {
        agentMetrics[op.agent_name].success += 1;
      } else {
        agentMetrics[op.agent_name].error += 1;
      }
      agentMetrics[op.agent_name].totalTime += op.execution_time_ms || 0;
    });

    // Calculate averages
    Object.keys(agentMetrics).forEach((agentName) => {
      agentMetrics[agentName].avgTime =
        agentMetrics[agentName].totalTime / agentMetrics[agentName].total;
    });

    // Format response
    const metrics = {
      timestamp: new Date().toISOString(),
      timeRange,
      agentMetrics: {
        intake_agent: agentMetrics['intake_agent'] || {
          total: 0,
          success: 0,
          error: 0,
          avgTime: 0,
        },
        rag_agent: agentMetrics['rag_agent'] || {
          total: 0,
          success: 0,
          error: 0,
          avgTime: 0,
        },
        drafts_agent: agentMetrics['drafts_agent'] || {
          total: 0,
          success: 0,
          error: 0,
          avgTime: 0,
        },
        watchdog_agent: agentMetrics['watchdog_agent'] || {
          total: 0,
          success: 0,
          error: 0,
          avgTime: 0,
        },
      },
      cases_analyzed: data.filter((d) => d.agent_name === 'intake_agent').length,
      documents_generated: data.filter((d) => d.agent_name === 'drafts_agent').length,
      escalations_triggered: data.filter((d) => d.agent_name === 'watchdog_agent').length,
      queries_processed: data.filter((d) => d.agent_name === 'rag_agent').length,
    };

    return Response.json(metrics);
  } catch (error) {
    console.error('Metrics API error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
