'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchSubmissions, updateSubmission, fetchMachines } from '../../../lib/api';
import { buildWhatsAppLink } from '../../../lib/whatsapp';
import {
  RefreshCcw,
  Filter,
  Search,
  MessageCircle,
  CheckCircle2,
  Clock,
  ChevronDown,
  X,
  MapPin,
  Calendar,
} from 'lucide-react';

const TYPE_META = {
  complaint: { label: 'Complaint', icon: '🚨', color: 'bg-red-50 text-red-700 border-red-200' },
  refund: { label: 'Refund', icon: '💰', color: 'bg-green-50 text-green-700 border-green-200' },
  feedback: { label: 'Feedback', icon: '📋', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  suggestion: { label: 'Suggestion', icon: '💡', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  rating: { label: 'Rating', icon: '⭐', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
};

const WA_STATUS_META = {
  not_contacted: { label: 'Not Contacted', color: 'text-gray-500' },
  in_progress: { label: 'In Progress', color: 'text-blue-600' },
  done: { label: 'Done', color: 'text-green-600' },
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const [filters, setFilters] = useState({
    machine_id: '',
    type: '',
    status: '',
    from_date: '',
    to_date: '',
  });

  useEffect(() => {
    fetchMachines().then((r) => setMachines(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [filters, page]);

  async function load() {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const res = await fetchSubmissions(params);
      setSubmissions(res.data.submissions);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function setFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  async function handleStatusUpdate(id, updates) {
    try {
      await updateSubmission(id, updates);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
      if (selected?.id === id) setSelected((prev) => ({ ...prev, ...updates }));
    } catch (err) {
      alert('Failed to update status');
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            All Submissions
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total submissions</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all"
        >
          <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <select
            value={filters.machine_id}
            onChange={(e) => setFilter('machine_id', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 input-brand"
          >
            <option value="">All Machines</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.machine_code} — {m.location.slice(0, 30)}
              </option>
            ))}
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilter('type', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 input-brand"
          >
            <option value="">All Types</option>
            {Object.entries(TYPE_META).map(([key, { label, icon }]) => (
              <option key={key} value={key}>{icon} {label}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 input-brand"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="completed">Completed</option>
          </select>
          <input
            type="date"
            value={filters.from_date}
            onChange={(e) => setFilter('from_date', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 input-brand"
          />
          <input
            type="date"
            value={filters.to_date}
            onChange={(e) => setFilter('to_date', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 input-brand"
          />
        </div>

        {(filters.machine_id || filters.type || filters.status || filters.from_date || filters.to_date) && (
          <button
            onClick={() => { setFilters({ machine_id: '', type: '', status: '', from_date: '', to_date: '' }); setPage(1); }}
            className="mt-2 flex items-center gap-1 text-xs text-orange-600 font-medium hover:underline"
          >
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCcw size={24} className="animate-spin text-orange-500" />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Machine</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {submissions.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-orange-50 transition-colors cursor-pointer"
                      onClick={() => setSelected(s)}
                    >
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${TYPE_META[s.type]?.color || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {TYPE_META[s.type]?.icon} {TYPE_META[s.type]?.label || s.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">{s.machine_code}</p>
                        <p className="text-gray-400 text-xs truncate max-w-[120px]">{s.location}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <SubmissionSummary data={s.data} type={s.type} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(s.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <StatusSelect
                          type={s.type}
                          value={s.status}
                          onChange={(v) => handleStatusUpdate(s.id, { status: v })}
                        />
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={s.whatsapp_status}
                          onChange={(e) => handleStatusUpdate(s.id, { whatsapp_status: e.target.value })}
                          className={`text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white input-brand ${WA_STATUS_META[s.whatsapp_status]?.color}`}
                        >
                          <option value="not_contacted">Not Contacted</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <ActionButtons submission={s} onUpdate={(u) => handleStatusUpdate(s.id, u)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {submissions.map((s) => (
                <MobileSubmissionCard
                  key={s.id}
                  submission={s}
                  onTap={() => setSelected(s)}
                  onUpdate={(u) => handleStatusUpdate(s.id, u)}
                />
              ))}
            </div>

            {!submissions.length && (
              <div className="text-center py-12 text-gray-400 text-sm">
                No submissions match your filters.
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                ← Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <SubmissionModal
          submission={selected}
          onClose={() => setSelected(null)}
          onUpdate={(u) => handleStatusUpdate(selected.id, u)}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SubmissionSummary({ data, type }) {
  if (!data) return null;
  if (type === 'complaint') return (
    <div>
      <p className="font-medium text-gray-700 truncate">{data.name || '—'}</p>
      <p className="text-gray-400 text-xs truncate">{data.issue_type || ''}</p>
    </div>
  );
  if (type === 'refund') return (
    <div>
      <p className="font-medium text-gray-700 truncate">{data.name || '—'}</p>
      <p className="text-green-600 text-xs font-semibold">₹{data.amount || 0}</p>
    </div>
  );
  if (type === 'rating') return (
    <p className="text-gray-600 text-xs">
      Service: {'⭐'.repeat(parseInt(data.service) || 0)}
    </p>
  );
  if (type === 'suggestion') return (
    <p className="text-gray-700 text-xs truncate">{data.product || '—'}</p>
  );
  if (type === 'feedback') return (
    <p className="text-gray-700 text-xs">{'⭐'.repeat(parseInt(data.rating) || 0)}</p>
  );
  return <p className="text-gray-400 text-xs">—</p>;
}

function StatusSelect({ type, value, onChange }) {
  const options = ['complaint', 'feedback', 'suggestion', 'rating'].includes(type)
    ? [{ v: 'pending', l: 'Pending' }, { v: 'resolved', l: 'Resolved' }]
    : [{ v: 'pending', l: 'Pending' }, { v: 'completed', l: 'Completed' }];

  const colors = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    resolved: 'bg-green-50 text-green-700 border-green-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`text-xs border rounded-lg px-2 py-1.5 font-medium input-brand ${colors[value] || ''}`}
    >
      {options.map(({ v, l }) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
  );
}

function ActionButtons({ submission }) {
  const waLink = buildWhatsAppLink(
    submission.type,
    submission.data || {},
    { machine_code: submission.machine_code, location: submission.location }
  );

  return (
    <div className="flex items-center gap-1.5">
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
        style={{ background: '#25D366' }}
        title="Chat on WhatsApp"
      >
        <MessageCircle size={12} /> WA
      </a>
      {submission.type === 'refund' && (
        <a
          href="https://dashboard.paytm.com/login/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all"
          title="Open Paytm"
        >
          Paytm
        </a>
      )}
    </div>
  );
}

function MobileSubmissionCard({ submission, onTap, onUpdate }) {
  const meta = TYPE_META[submission.type] || { label: submission.type, icon: '📝', color: 'bg-gray-100 text-gray-600 border-gray-200' };
  const waLink = buildWhatsAppLink(
    submission.type,
    submission.data || {},
    { machine_code: submission.machine_code, location: submission.location }
  );

  return (
    <div className="p-4 space-y-3" onClick={onTap}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.icon}</span>
          <div>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${meta.color}`}>
              {meta.label}
            </span>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <MapPin size={10} /> {submission.machine_code}
            </p>
          </div>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(submission.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      </div>

      <SubmissionSummary data={submission.data} type={submission.type} />

      <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
        <StatusSelect type={submission.type} value={submission.status} onChange={(v) => onUpdate({ status: v })} />
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
          style={{ background: '#25D366' }}
        >
          <MessageCircle size={12} /> WhatsApp
        </a>
      </div>
    </div>
  );
}

function SubmissionModal({ submission, onClose, onUpdate }) {
  const [editableData, setEditableData] = useState(JSON.stringify(submission.data || {}, null, 2));
  const [adminNotes, setAdminNotes] = useState(submission.admin_notes || '');
  const [refundStatus, setRefundStatus] = useState(submission.refund_status || 'pending');
  const [adminRemarks, setAdminRemarks] = useState(submission.admin_remarks || '');
  const meta = TYPE_META[submission.type] || { label: submission.type, icon: '📝' };
  const waLink = buildWhatsAppLink(
    submission.type,
    submission.data || {},
    { machine_code: submission.machine_code, location: submission.location }
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #FF6B00, #FFB800)' }}
        >
          <div>
            <p className="text-white font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
              {meta.icon} {meta.label} #{submission.id}
            </p>
            <p className="text-white text-xs opacity-80">{submission.machine_code} · {submission.location}</p>
          </div>
          <button onClick={onClose} className="text-white opacity-80 hover:opacity-100 p-1">
            <X size={22} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Data fields */}
          <div className="space-y-2.5">
            {Object.entries(submission.data || {}).map(([k, v]) => {
              if (k === 'machine_code') return null;
              const label = k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
              return (
                <div key={k} className="flex gap-3">
                  <span className="text-xs font-semibold text-gray-500 w-32 flex-shrink-0 pt-0.5">{label}</span>
                  <span className="text-sm text-gray-800 flex-1 break-words">
                    {typeof v === 'number' ? (k === 'amount' ? `₹${v}` : v) : String(v || '—')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Status row */}
          <div className="flex items-center gap-3 pt-2 border-t">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 mb-1">Status</p>
              <StatusSelect type={submission.type} value={submission.status} onChange={(v) => onUpdate({ status: v })} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 mb-1">WhatsApp Status</p>
              <select
                value={submission.whatsapp_status}
                onChange={(e) => onUpdate({ whatsapp_status: e.target.value })}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 input-brand w-full"
              >
                <option value="not_contacted">Not Contacted</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-semibold text-gray-500">Edit submission data (JSON)</p>
            <textarea
              className="w-full min-h-28 border border-gray-200 rounded-xl p-2 text-xs"
              value={editableData}
              onChange={(e) => setEditableData(e.target.value)}
            />
            <button
              onClick={() => {
                try {
                  const parsed = JSON.parse(editableData);
                  onUpdate({ data: parsed });
                } catch (_err) {
                  alert('Invalid JSON');
                }
              }}
              className="text-xs px-3 py-1.5 rounded-lg border"
            >
              Save JSON
            </button>
          </div>

          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-semibold text-gray-500">Admin Notes</p>
            <textarea
              className="w-full min-h-20 border border-gray-200 rounded-xl p-2 text-sm"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal notes"
            />
            <button onClick={() => onUpdate({ admin_notes: adminNotes })} className="text-xs px-3 py-1.5 rounded-lg border">
              Save Notes
            </button>
          </div>

          {submission.type === 'refund' && (
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-semibold text-gray-500">Refund Controls</p>
              <select
                className="w-full border border-gray-200 rounded-xl px-2 py-2 text-sm"
                value={refundStatus}
                onChange={(e) => setRefundStatus(e.target.value)}
              >
                <option value="pending">pending</option>
                <option value="processing">processing</option>
                <option value="completed">completed</option>
              </select>
              <textarea
                className="w-full min-h-20 border border-gray-200 rounded-xl p-2 text-sm"
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                placeholder="Refund remarks"
              />
              <button
                onClick={() => onUpdate({ refund_status: refundStatus, admin_remarks: adminRemarks })}
                className="text-xs px-3 py-1.5 rounded-lg border"
              >
                Save Refund Update
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-all"
              style={{ background: '#25D366' }}
            >
              <MessageCircle size={16} /> Chat on WhatsApp
            </a>
            {submission.type === 'refund' && (
              <a
                href="https://dashboard.paytm.com/login/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm bg-blue-600 hover:bg-blue-700 transition-all"
              >
                Open Paytm
              </a>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center">
            Submitted {new Date(submission.created_at).toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
}
