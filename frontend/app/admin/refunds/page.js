'use client';

import { useEffect, useState } from 'react';
import { fetchSubmissions, updateSubmission } from '../../../lib/api';
import { buildWhatsAppLink } from '../../../lib/whatsapp';
import { RefreshCcw, MessageCircle, ExternalLink, IndianRupee } from 'lucide-react';

export default function RefundsPage() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | pending | completed

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetchSubmissions({ type: 'refund', limit: 100 });
      setRefunds(res.data.submissions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function markCompleted(id) {
    try {
      await updateSubmission(id, { status: 'completed', refund_status: 'completed' });
      setRefunds((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'completed', refund_status: 'completed' } : r))
      );
    } catch {
      alert('Failed to update');
    }
  }

  async function updateWAStatus(id, whatsapp_status) {
    try {
      await updateSubmission(id, { whatsapp_status });
      setRefunds((prev) =>
        prev.map((r) => (r.id === id ? { ...r, whatsapp_status } : r))
      );
    } catch {
      alert('Failed to update');
    }
  }

  async function updateRefundStatus(id, refund_status) {
    try {
      await updateSubmission(id, { refund_status });
      setRefunds((prev) =>
        prev.map((r) => (r.id === id ? { ...r, refund_status } : r))
      );
    } catch {
      alert('Failed to update refund status');
    }
  }

  const filtered = filter === 'all'
    ? refunds
    : refunds.filter((r) => r.status === filter);

  const totalPending = refunds
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + (parseFloat(r.data?.amount) || 0), 0);

  const totalCompleted = refunds
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + (parseFloat(r.data?.amount) || 0), 0);

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Syne, sans-serif' }}>
            Refund Requests
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{refunds.length} total requests</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
        >
          <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-4 text-white">
          <p className="text-xs font-medium opacity-80 mb-1">Pending Amount</p>
          <p className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>₹{totalPending.toFixed(0)}</p>
          <p className="text-xs opacity-70 mt-0.5">{refunds.filter(r => r.status === 'pending').length} requests</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl p-4 text-white">
          <p className="text-xs font-medium opacity-80 mb-1">Completed Amount</p>
          <p className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>₹{totalCompleted.toFixed(0)}</p>
          <p className="text-xs opacity-70 mt-0.5">{refunds.filter(r => r.status === 'completed').length} requests</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
              filter === f
                ? 'text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            style={filter === f ? { background: 'linear-gradient(135deg, #FF6B00, #FFB800)' } : {}}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <RefreshCcw size={24} className="animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((refund) => (
            <RefundCard
              key={refund.id}
              refund={refund}
              onMarkCompleted={() => markCompleted(refund.id)}
              onUpdateWA={(status) => updateWAStatus(refund.id, status)}
              onUpdateRefundStatus={(status) => updateRefundStatus(refund.id, status)}
            />
          ))}
          {!filtered.length && (
            <div className="bg-white rounded-2xl p-10 text-center text-gray-400 text-sm border border-gray-100">
              No {filter === 'all' ? '' : filter} refund requests found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RefundCard({ refund, onMarkCompleted, onUpdateWA, onUpdateRefundStatus }) {
  const { data = {} } = refund;
  const waLink = buildWhatsAppLink(
    'refund',
    data,
    { machine_code: refund.machine_code, location: refund.location }
  );

  const waColors = {
    not_contacted: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700',
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">💰</span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                refund.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {refund.status === 'completed' ? '✅ Completed' : '⏳ Pending'}
            </span>
          </div>
          <p className="font-bold text-gray-800 text-base">{data.name || 'Unknown'}</p>
          <p className="text-gray-500 text-sm">{data.phone || 'No phone'}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-bold text-green-600" style={{ fontFamily: 'Syne, sans-serif' }}>
            ₹{data.amount || 0}
          </p>
          <p className="text-xs text-gray-400">{refund.machine_code}</p>
        </div>
      </div>

      {data.description && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 mb-4 italic">
          "{data.description}"
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {/* WhatsApp Chat */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90"
          style={{ background: '#25D366' }}
        >
          <MessageCircle size={15} /> Chat on WhatsApp
        </a>

        {/* Paytm */}
        <a
          href="https://dashboard.paytm.com/login/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm bg-blue-600 hover:bg-blue-700 transition-all"
        >
          <ExternalLink size={15} /> Open Paytm
        </a>

        {/* Mark completed */}
        {refund.status !== 'completed' && (
          <button
            onClick={onMarkCompleted}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border-2 border-green-400 text-green-700 hover:bg-green-50 transition-all"
          >
            ✅ Mark Completed
          </button>
        )}

        <select
          value={refund.refund_status || 'pending'}
          onChange={(e) => onUpdateRefundStatus(e.target.value)}
          className="text-xs px-2.5 py-2 rounded-xl border font-medium input-brand"
        >
          <option value="pending">Refund Pending</option>
          <option value="processing">Refund Processing</option>
          <option value="completed">Refund Completed</option>
        </select>

        {/* WA status */}
        <select
          value={refund.whatsapp_status}
          onChange={(e) => onUpdateWA(e.target.value)}
          className={`text-xs px-2.5 py-2 rounded-xl border font-medium input-brand ${waColors[refund.whatsapp_status]}`}
        >
          <option value="not_contacted">Not Contacted</option>
          <option value="in_progress">In Progress</option>
          <option value="done">WA Done</option>
        </select>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        {new Date(refund.created_at).toLocaleString('en-IN')}
      </p>
      <textarea
        defaultValue={refund.admin_remarks || ''}
        onBlur={(e) => updateSubmission(refund.id, { admin_remarks: e.target.value })}
        className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2 text-xs"
        placeholder="Admin remarks"
      />
    </div>
  );
}
