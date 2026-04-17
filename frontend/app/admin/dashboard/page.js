'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAnalytics, fetchSubmissions } from '../../../lib/api';
import {
  AlertCircle,
  RefreshCcw,
  Star,
  Lightbulb,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  MapPin,
} from 'lucide-react';

const TYPE_META = {
  complaint: { label: 'Complaints', icon: '🚨', color: 'bg-red-100 text-red-700 border-red-200' },
  refund: { label: 'Refunds', icon: '💰', color: 'bg-green-100 text-green-700 border-green-200' },
  feedback: { label: 'Feedback', icon: '📋', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  suggestion: { label: 'Suggestions', icon: '💡', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  rating: { label: 'Ratings', icon: '⭐', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
};

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [analyticsRes, submissionsRes] = await Promise.all([
        fetchAnalytics(),
        fetchSubmissions({ page: 1, limit: 8 }),
      ]);
      setAnalytics(analyticsRes.data);
      setRecent(submissionsRes.data.submissions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const totalCount = analytics?.byType?.reduce((sum, r) => sum + parseInt(r.count), 0) || 0;
  const pendingCount = analytics?.pending?.reduce((sum, r) => sum + parseInt(r.count), 0) || 0;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl lg:text-3xl font-bold text-gray-900"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          Dashboard
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back! Here's what's happening across your machines.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <RefreshCcw size={28} className="animate-spin text-orange-500" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <StatCard
              label="Total Submissions"
              value={totalCount}
              icon="📊"
              gradient="from-orange-500 to-yellow-400"
            />
            <StatCard
              label="Pending Actions"
              value={pendingCount}
              icon="⏳"
              gradient="from-red-500 to-orange-400"
            />
            <StatCard
              label="Refund Amount"
              value={`₹${Math.round(analytics?.refunds?.total_amount || 0)}`}
              icon="💸"
              gradient="from-green-500 to-emerald-400"
            />
            <StatCard
              label="Total Refunds"
              value={analytics?.refunds?.total_refunds || 0}
              icon="🔄"
              gradient="from-blue-500 to-indigo-400"
            />
          </div>

          {/* By type breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3
                className="text-base font-bold text-gray-800 mb-4"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                Submissions by Type
              </h3>
              <div className="space-y-3">
                {(analytics?.byType || []).map((row) => {
                  const meta = TYPE_META[row.type] || { label: row.type, icon: '📝', color: 'bg-gray-100 text-gray-700 border-gray-200' };
                  const pct = totalCount > 0 ? Math.round((row.count / totalCount) * 100) : 0;
                  return (
                    <div key={row.type}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span>{meta.icon}</span>
                          <span className="text-sm font-medium text-gray-700">{meta.label}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-800">{row.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg, #FF6B00, #FFB800)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top machines */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3
                className="text-base font-bold text-gray-800 mb-4"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                Top Machines by Activity
              </h3>
              <div className="space-y-2.5">
                {(analytics?.byMachine || []).slice(0, 6).map((row, idx) => (
                  <div
                    key={`${row.machine_code}-${row.type}`}
                    className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                  >
                    <span className="text-xs font-bold text-gray-400 w-5">#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{row.machine_code}</p>
                      <p className="text-xs text-gray-400 truncate">{row.location}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_META[row.type]?.color || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {TYPE_META[row.type]?.icon} {row.type}
                      </span>
                      <span className="text-sm font-bold text-gray-700">{row.count}</span>
                    </div>
                  </div>
                ))}
                {!analytics?.byMachine?.length && (
                  <p className="text-gray-400 text-sm text-center py-4">No data yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent submissions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3
                className="text-base font-bold text-gray-800"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                Recent Submissions
              </h3>
              <Link
                href="/admin/submissions"
                className="text-sm font-medium flex items-center gap-1"
                style={{ color: '#FF6B00' }}
              >
                View all <ChevronRight size={14} />
              </Link>
            </div>

            <div className="divide-y divide-gray-50">
              {recent.map((s) => (
                <SubmissionRow key={s.id} submission={s} />
              ))}
              {!recent.length && (
                <div className="py-10 text-center text-gray-400 text-sm">
                  No submissions yet
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, gradient }) {
  return (
    <div
      className="rounded-2xl p-4 text-white shadow-sm"
      style={{ background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }}
    >
      <div
        className={`rounded-2xl p-4 text-white bg-gradient-to-br ${gradient}`}
      >
        <div className="text-2xl mb-2">{icon}</div>
        <div
          className="text-2xl font-bold"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          {value}
        </div>
        <div className="text-xs opacity-80 mt-0.5 font-medium">{label}</div>
      </div>
    </div>
  );
}

function SubmissionRow({ submission }) {
  const meta = TYPE_META[submission.type] || { label: submission.type, icon: '📝', color: 'bg-gray-100 text-gray-600 border-gray-200' };
  const date = new Date(submission.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="px-5 py-3.5 flex items-center gap-3">
      <span className="text-xl flex-shrink-0">{meta.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${meta.color}`}>
            {meta.label}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <MapPin size={10} /> {submission.machine_code}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{date}</p>
      </div>
      <StatusBadge status={submission.status} />
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    completed: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
