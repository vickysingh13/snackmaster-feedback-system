'use client';

import { useEffect, useState } from 'react';
import { fetchAnalytics } from '../../../lib/api';
import { RefreshCcw, TrendingUp } from 'lucide-react';

const TYPE_META = {
  complaint: { label: 'Complaints', icon: '🚨', color: '#EF4444' },
  refund: { label: 'Refunds', icon: '💰', color: '#10B981' },
  feedback: { label: 'Feedback', icon: '📋', color: '#3B82F6' },
  suggestion: { label: 'Suggestions', icon: '💡', color: '#8B5CF6' },
  rating: { label: 'Ratings', icon: '⭐', color: '#F59E0B' },
};

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetchAnalytics();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const total = data?.byType?.reduce((s, r) => s + parseInt(r.count), 0) || 0;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Syne, sans-serif' }}>
            Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">System-wide insights and trends</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
        >
          <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <RefreshCcw size={24} className="animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Submission type breakdown */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold text-gray-800 mb-5" style={{ fontFamily: 'Syne, sans-serif' }}>
              Submissions by Type
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              {(data?.byType || []).map((row) => {
                const meta = TYPE_META[row.type] || { label: row.type, icon: '📝', color: '#6B7280' };
                const pct = total > 0 ? ((row.count / total) * 100).toFixed(1) : 0;
                return (
                  <div key={row.type} className="text-center p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-3xl mb-2">{meta.icon}</div>
                    <div className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {row.count}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{meta.label}</div>
                    <div className="text-xs font-semibold mt-1" style={{ color: meta.color }}>
                      {pct}%
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bar chart visual */}
            <div className="space-y-2">
              {(data?.byType || []).map((row) => {
                const meta = TYPE_META[row.type] || { label: row.type, icon: '📝', color: '#6B7280' };
                const pct = total > 0 ? (row.count / total) * 100 : 0;
                return (
                  <div key={row.type} className="flex items-center gap-3">
                    <span className="text-sm w-24 text-gray-600 flex-shrink-0">{meta.icon} {meta.label}</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: meta.color }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-700 w-8 text-right">{row.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold text-gray-800 mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
              ⏳ Pending Actions
            </h2>
            {(data?.pending || []).length === 0 ? (
              <p className="text-green-600 font-semibold text-sm">🎉 All caught up! No pending items.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(data?.pending || []).map((row) => {
                  const meta = TYPE_META[row.type] || { label: row.type, icon: '📝' };
                  return (
                    <div key={row.type} className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
                      <div className="text-2xl">{meta.icon}</div>
                      <div className="text-xl font-bold text-yellow-700 mt-1" style={{ fontFamily: 'Syne, sans-serif' }}>
                        {row.count}
                      </div>
                      <div className="text-xs text-yellow-600">{meta.label} pending</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Refund summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className="rounded-2xl p-6 text-white"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
            >
              <p className="text-sm font-medium opacity-80 mb-1">Total Refund Amount</p>
              <p className="text-4xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
                ₹{Math.round(data?.refunds?.total_amount || 0)}
              </p>
              <p className="text-sm opacity-70 mt-1">
                across {data?.refunds?.total_refunds || 0} requests
              </p>
            </div>
            <div
              className="rounded-2xl p-6 text-white"
              style={{ background: 'linear-gradient(135deg, #FF6B00, #FFB800)' }}
            >
              <p className="text-sm font-medium opacity-80 mb-1">Total Submissions</p>
              <p className="text-4xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
                {total}
              </p>
              <p className="text-sm opacity-70 mt-1">across all machines</p>
            </div>
          </div>

          {/* Top machines */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold text-gray-800 mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
              🏆 Top Machines by Activity
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase">Machine</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase">Location</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(data?.byMachine || []).slice(0, 10).map((row, idx) => {
                    const meta = TYPE_META[row.type] || { label: row.type, icon: '📝' };
                    return (
                      <tr key={`${row.machine_code}-${row.type}-${idx}`} className="hover:bg-gray-50">
                        <td className="py-2.5 pr-4 text-gray-400 font-medium">#{idx + 1}</td>
                        <td className="py-2.5 pr-4 font-semibold text-gray-800">{row.machine_code}</td>
                        <td className="py-2.5 pr-4 text-gray-500 text-xs max-w-[180px] truncate">{row.location}</td>
                        <td className="py-2.5 pr-4">
                          <span className="text-xs">{meta.icon} {meta.label}</span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-gray-800">{row.count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!data?.byMachine?.length && (
                <p className="text-center py-6 text-gray-400 text-sm">No machine data yet</p>
              )}
            </div>
          </div>

          {/* 7-day trend */}
          {data?.trend?.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-base font-bold text-gray-800 mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
                📈 Last 7 Days Activity
              </h2>
              <TrendChart trend={data.trend} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TrendChart({ trend }) {
  // Group by date
  const byDate = {};
  trend.forEach(({ date, type, count }) => {
    const d = date.slice(0, 10);
    if (!byDate[d]) byDate[d] = { total: 0 };
    byDate[d].total += parseInt(count);
    byDate[d][type] = parseInt(count);
  });

  const dates = Object.keys(byDate).sort();
  const maxVal = Math.max(...dates.map((d) => byDate[d].total), 1);

  return (
    <div className="space-y-2.5">
      {dates.map((date) => {
        const dayData = byDate[date];
        const pct = (dayData.total / maxVal) * 100;
        const label = new Date(date).toLocaleDateString('en-IN', {
          weekday: 'short', day: 'numeric', month: 'short',
        });
        return (
          <div key={date} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-28 flex-shrink-0">{label}</span>
            <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, #FF6B00, #FFB800)',
                }}
              />
            </div>
            <span className="text-xs font-bold text-gray-700 w-6 text-right">{dayData.total}</span>
          </div>
        );
      })}
    </div>
  );
}
