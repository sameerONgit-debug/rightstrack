'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AgentDashboard() {
  const [agentMetrics, setAgentMetrics] = useState(null);
  const [caseAnalytics, setCaseAnalytics] = useState(null);
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, caseRes, escalRes] = await Promise.all([
        fetch('/api/agents/metrics'),
        fetch('/api/analytics/cases'),
        fetch('/api/escalations/pending'),
      ]);

      if (metricsRes.ok) setAgentMetrics(await metricsRes.json());
      if (caseRes.ok) setCaseAnalytics(await caseRes.json());
      if (escalRes.ok) setEscalations(await escalRes.json());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Agent Operations Dashboard</h1>
          <p className="text-slate-600">Real-time monitoring of autonomous legal agents</p>
        </div>

        {/* Agent Status Cards */}
        {agentMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { name: 'Intake Agent', metric: 'cases_analyzed', icon: '📋' },
              { name: 'RAG Agent', metric: 'queries_processed', icon: '🔍' },
              { name: 'Drafts Agent', metric: 'documents_generated', icon: '📄' },
              { name: 'Watchdog Agent', metric: 'escalations_triggered', icon: '⚠️' },
            ].map((agent) => (
              <div key={agent.name} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">{agent.name}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {agentMetrics[agent.metric] || 0}
                    </p>
                  </div>
                  <span className="text-2xl">{agent.icon}</span>
                </div>
                <p className="text-xs text-green-600 font-medium">✓ Operational</p>
              </div>
            ))}
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Case Processing Trend */}
          {caseAnalytics?.trend && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Case Processing Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={caseAnalytics.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="processed" stroke="#3b82f6" />
                  <Line type="monotone" dataKey="escalated" stroke="#ef4444" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Case Status Distribution */}
          {caseAnalytics?.status && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Case Status Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={caseAnalytics.status}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {caseAnalytics.status.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Agent Workload */}
        {caseAnalytics?.agentWorkload && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Agent Workload Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={caseAnalytics.agentWorkload}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="agent" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="active_tasks" fill="#3b82f6" />
                <Bar dataKey="completed_tasks" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Escalations Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Pending Escalations</h2>
          {escalations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Case ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Issue</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Deadline</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Priority</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {escalations.map((esc) => (
                    <tr key={esc.caseId} className="border-b hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono text-blue-600">{esc.caseId}</td>
                      <td className="px-4 py-3">{esc.issue}</td>
                      <td className="px-4 py-3">{new Date(esc.deadline).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          esc.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          esc.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {esc.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-blue-600 hover:text-blue-800 font-medium">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No pending escalations</p>
          )}
        </div>
      </div>
    </div>
  );
}
