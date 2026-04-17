'use client';

import { useEffect, useState } from 'react';
import { fetchAnalytics, fetchMachines, fetchSubmissions, updateSubmission } from '../../lib/api';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const FORM_TYPES = ['complaint', 'refund', 'feedback', 'suggestion', 'rating'];
const WA_PHONE = '919515033232';

export default function AdminDashboardPage() {
  const [machines, setMachines] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ machine_id: '', type: '' });

  useEffect(() => {
    fetchMachines()
      .then((res) => setMachines(res.data || []))
      .catch(() => setMachines([]));
    fetchAnalytics()
      .then((res) => setAnalytics(res.data))
      .catch(() => setAnalytics(null));
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [filters.machine_id, filters.type]);

  async function loadSubmissions() {
    setLoading(true);
    setError('');
    try {
      const params = { ...filters, page: 1, limit: 200 };
      if (!params.machine_id) delete params.machine_id;
      if (!params.type) delete params.type;

      const res = await fetchSubmissions(params);
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }

  async function patchSubmission(id, payload) {
    try {
      await updateSubmission(id, payload);
      setSubmissions((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          return { ...item, ...payload };
        })
      );
    } catch (_err) {
      alert('Failed to update submission');
    }
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
          Admin Dashboard
        </h1>
        <p className="text-sm text-gray-500 mb-5">All submissions with status controls and refund actions.</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard label="Total Submissions" value={analytics?.totalSubmissions ?? 0} />
          <StatCard label="Complaints" value={analytics?.totalComplaints ?? 0} />
          <StatCard label="Refunds" value={analytics?.totalRefunds ?? 0} />
          <StatCard label="Feedback" value={analytics?.totalFeedback ?? 0} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Complaints per machine</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buildComplaintsBarData(analytics?.complaintsPerMachine || [])}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="machine" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="complaints" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Form type distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={buildTypePieData(analytics?.byType || [])}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {buildTypePieData(analytics?.byType || []).map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
              value={filters.machine_id}
              onChange={(e) => setFilters((prev) => ({ ...prev, machine_id: e.target.value }))}
            >
              <option value="">All machines</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.machineCode || m.machine_code || m.id}
                </option>
              ))}
            </select>

            <select
              className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
              value={filters.type}
              onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
            >
              <option value="">All form types</option>
              {FORM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading submissions...</div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-3">Machine ID</th>
                      <th className="text-left px-3 py-3">Form Type</th>
                      <th className="text-left px-3 py-3">Submitted Data</th>
                      <th className="text-left px-3 py-3">Status</th>
                      <th className="text-left px-3 py-3">WhatsApp Status</th>
                      <th className="text-left px-3 py-3">Created</th>
                      <th className="text-left px-3 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="border-b border-gray-100 align-top">
                        <td className="px-3 py-3">{submission.machine_id}</td>
                        <td className="px-3 py-3 capitalize">{submission.type}</td>
                        <td className="px-3 py-3">
                          <pre className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs whitespace-pre-wrap break-words max-w-[350px]">
                            {JSON.stringify(submission.data || {}, null, 2)}
                          </pre>
                        </td>
                        <td className="px-3 py-3">
                          <select
                            className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                            value={submission.status}
                            onChange={(e) => patchSubmission(submission.id, { status: e.target.value })}
                          >
                            <option value="pending">pending</option>
                            <option value="resolved">resolved</option>
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <select
                            className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                            value={submission.whatsapp_status}
                            onChange={(e) =>
                              patchSubmission(submission.id, { whatsapp_status: e.target.value })
                            }
                          >
                            <option value="not_contacted">not_contacted</option>
                            <option value="in_progress">in_progress</option>
                            <option value="done">done</option>
                          </select>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-600">
                          {new Date(submission.created_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-3">
                          <ActionButtons submission={submission} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden divide-y divide-gray-100">
                {submissions.map((submission) => (
                  <div key={submission.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800">
                        Machine: {submission.machine_id}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(submission.created_at).toLocaleString()}</p>
                    </div>
                    <p className="text-sm capitalize text-gray-700">Form: {submission.type}</p>
                    <pre className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs whitespace-pre-wrap break-words">
                      {JSON.stringify(submission.data || {}, null, 2)}
                    </pre>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={submission.status}
                        onChange={(e) => patchSubmission(submission.id, { status: e.target.value })}
                      >
                        <option value="pending">pending</option>
                        <option value="resolved">resolved</option>
                      </select>
                      <select
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value={submission.whatsapp_status}
                        onChange={(e) => patchSubmission(submission.id, { whatsapp_status: e.target.value })}
                      >
                        <option value="not_contacted">not_contacted</option>
                        <option value="in_progress">in_progress</option>
                        <option value="done">done</option>
                      </select>
                    </div>
                    <ActionButtons submission={submission} />
                  </div>
                ))}
              </div>

              {submissions.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-500">No submissions found.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

const PIE_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#eab308'];

function buildComplaintsBarData(rows) {
  return rows.slice(0, 10).map((row) => ({
    machine: row.machine_code || `Machine ${row.machine_id}`,
    complaints: Number(row.complaints || 0),
  }));
}

function buildTypePieData(rows) {
  return rows.map((row) => ({
    name: row.type,
    value: Number(row.count || 0),
  }));
}

function ActionButtons({ submission }) {
  const waLink = buildWhatsAppLink(submission);

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold"
      >
        Open WhatsApp
      </a>
      {submission.type === 'refund' && (
        <a
          href="https://dashboard.paytm.com/login/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
        >
          Open Paytm
        </a>
      )}
    </div>
  );
}

function buildWhatsAppLink(submission) {
  const data = submission.data || {};
  const message =
    `Submission Update:\n` +
    `Machine: ${submission.machine_id}\n` +
    `Type: ${submission.type}\n` +
    `Name: ${data.name || ''}\n` +
    `Phone: ${data.phone || ''}\n` +
    `Details: ${JSON.stringify(data)}`;

  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(message)}`;
}
