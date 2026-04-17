'use client';

import { useEffect, useState } from 'react';
import {
  fetchFormConfigs,
  updateFormConfig,
  fetchWeeklyConfig,
  updateWeeklyConfig,
  fetchMachines,
  addMachine,
  updateMachine,
} from '../../../lib/api';
import {
  RefreshCcw,
  ToggleLeft,
  ToggleRight,
  Save,
  Plus,
  Calendar,
  Settings2,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const TYPE_ICONS = {
  complaint: '🚨',
  refund: '💰',
  feedback: '📋',
  suggestion: '💡',
  rating: '⭐',
};

export default function FormsPage() {
  const [forms, setForms] = useState([]);
  const [weekly, setWeekly] = useState(null);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [weeklyForm, setWeeklyForm] = useState({ title: '', start_date: '', end_date: '' });
  const [weeklyMsg, setWeeklyMsg] = useState('');
  const [expandedForm, setExpandedForm] = useState(null);
  const [newMachine, setNewMachine] = useState({ machine_code: '', location: '', area: '' });
  const [addingMachine, setAddingMachine] = useState(false);
  const [machineMsg, setMachineMsg] = useState('');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [formsRes, weeklyRes, machinesRes] = await Promise.all([
        fetchFormConfigs(),
        fetchWeeklyConfig(),
        fetchMachines(),
      ]);
      setForms(formsRes.data);
      setMachines(machinesRes.data);
      if (weeklyRes.data) {
        setWeekly(weeklyRes.data);
        setWeeklyForm({
          title: weeklyRes.data.title || '',
          start_date: weeklyRes.data.start_date?.slice(0, 10) || '',
          end_date: weeklyRes.data.end_date?.slice(0, 10) || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleForm(form) {
    setSaving((prev) => ({ ...prev, [form.id]: true }));
    try {
      await updateFormConfig(form.id, { is_enabled: !form.is_enabled });
      setForms((prev) =>
        prev.map((f) => (f.id === form.id ? { ...f, is_enabled: !f.is_enabled } : f))
      );
    } catch {
      alert('Failed to update form');
    } finally {
      setSaving((prev) => ({ ...prev, [form.id]: false }));
    }
  }

  async function saveLabelChange(form, newLabel) {
    setSaving((prev) => ({ ...prev, [`label_${form.id}`]: true }));
    try {
      await updateFormConfig(form.id, { label: newLabel });
      setForms((prev) =>
        prev.map((f) => (f.id === form.id ? { ...f, label: newLabel } : f))
      );
    } catch {
      alert('Failed to save label');
    } finally {
      setSaving((prev) => ({ ...prev, [`label_${form.id}`]: false }));
    }
  }

  async function saveWeekly() {
    setSaving((prev) => ({ ...prev, weekly: true }));
    setWeeklyMsg('');
    try {
      const res = await updateWeeklyConfig({ ...weeklyForm, is_active: true });
      setWeekly(res.data);
      setWeeklyMsg('✅ Weekly config saved!');
    } catch {
      setWeeklyMsg('❌ Failed to save');
    } finally {
      setSaving((prev) => ({ ...prev, weekly: false }));
    }
  }

  async function handleAddMachine() {
    if (!newMachine.machine_code || !newMachine.location) {
      setMachineMsg('❌ Machine code and location required');
      return;
    }
    setAddingMachine(true);
    setMachineMsg('');
    try {
      const res = await addMachine(newMachine);
      setMachines((prev) => [...prev, res.data]);
      setNewMachine({ machine_code: '', location: '', area: '' });
      setMachineMsg('✅ Machine added!');
    } catch (err) {
      setMachineMsg(err.response?.data?.error || '❌ Failed to add machine');
    } finally {
      setAddingMachine(false);
    }
  }

  async function toggleMachineStatus(machine) {
    const newStatus = machine.status === 'active' ? 'inactive' : 'active';
    try {
      await updateMachine(machine.id, { status: newStatus });
      setMachines((prev) =>
        prev.map((m) => (m.id === machine.id ? { ...m, status: newStatus } : m))
      );
    } catch {
      alert('Failed to update machine status');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <RefreshCcw size={24} className="animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Syne, sans-serif' }}>
          Form Builder & Settings
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage forms, weekly config, and machine list
        </p>
      </div>

      {/* ── Form toggles ─────────────────────────────── */}
      <section>
        <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Settings2 size={18} className="text-orange-500" /> Form Controls
        </h2>
        <div className="space-y-3">
          {forms.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              expanded={expandedForm === form.id}
              onToggleExpand={() =>
                setExpandedForm(expandedForm === form.id ? null : form.id)
              }
              onToggleEnabled={() => toggleForm(form)}
              onSaveLabel={(label) => saveLabelChange(form, label)}
              saving={saving[form.id]}
            />
          ))}
        </div>
      </section>

      {/* ── Weekly Feedback Config ────────────────────── */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-blue-500" /> Weekly Feedback Title
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Title / Date Range
            </label>
            <input
              type="text"
              value={weeklyForm.title}
              onChange={(e) => setWeeklyForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Mar 30 – Apr 5, 2025"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm input-brand bg-gray-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date</label>
              <input
                type="date"
                value={weeklyForm.start_date}
                onChange={(e) => setWeeklyForm((p) => ({ ...p, start_date: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm input-brand bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date</label>
              <input
                type="date"
                value={weeklyForm.end_date}
                onChange={(e) => setWeeklyForm((p) => ({ ...p, end_date: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm input-brand bg-gray-50"
              />
            </div>
          </div>

          <button
            onClick={saveWeekly}
            disabled={saving.weekly}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #FF6B00, #FFB800)' }}
          >
            {saving.weekly
              ? <><RefreshCcw size={14} className="animate-spin" /> Saving...</>
              : <><Save size={14} /> Save Config</>
            }
          </button>

          {weeklyMsg && (
            <p className="text-sm font-medium">{weeklyMsg}</p>
          )}
        </div>
      </section>

      {/* ── Machines Management ───────────────────────── */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin size={18} className="text-green-500" /> Vending Machines ({machines.length})
        </h2>

        {/* Add new machine */}
        <div className="bg-orange-50 rounded-xl p-4 mb-5 border border-orange-100">
          <p className="text-sm font-semibold text-orange-800 mb-3">Add New Machine</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            <input
              type="text"
              value={newMachine.machine_code}
              onChange={(e) => setNewMachine((p) => ({ ...p, machine_code: e.target.value }))}
              placeholder="Code (e.g. SM-2118)"
              className="border border-orange-200 rounded-xl px-3 py-2 text-sm bg-white input-brand"
            />
            <input
              type="text"
              value={newMachine.location}
              onChange={(e) => setNewMachine((p) => ({ ...p, location: e.target.value }))}
              placeholder="Location"
              className="border border-orange-200 rounded-xl px-3 py-2 text-sm bg-white input-brand"
            />
            <input
              type="text"
              value={newMachine.area}
              onChange={(e) => setNewMachine((p) => ({ ...p, area: e.target.value }))}
              placeholder="Area (optional)"
              className="border border-orange-200 rounded-xl px-3 py-2 text-sm bg-white input-brand"
            />
          </div>
          <button
            onClick={handleAddMachine}
            disabled={addingMachine}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white text-sm disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #FF6B00, #FFB800)' }}
          >
            {addingMachine
              ? <><RefreshCcw size={13} className="animate-spin" /> Adding...</>
              : <><Plus size={13} /> Add Machine</>
            }
          </button>
          {machineMsg && <p className="text-xs mt-2 font-medium">{machineMsg}</p>}
        </div>

        {/* Machine list */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {machines.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{m.machine_code}</p>
                <p className="text-gray-500 text-xs truncate">{m.location}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={`/machine/${m.machine_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  Preview
                </a>
                <button
                  onClick={() => toggleMachineStatus(m)}
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${
                    m.status === 'active'
                      ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                      : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'
                  }`}
                >
                  {m.status === 'active' ? '● Active' : '○ Inactive'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Form Card ─────────────────────────────────────────────────────────────
function FormCard({ form, expanded, onToggleExpand, onToggleEnabled, onSaveLabel, saving }) {
  const [labelEdit, setLabelEdit] = useState(form.label);
  const [labelChanged, setLabelChanged] = useState(false);

  return (
    <div className={`bg-white rounded-2xl border-2 transition-all shadow-sm ${
      form.is_enabled ? 'border-orange-200' : 'border-gray-200 opacity-60'
    }`}>
      <div className="flex items-center gap-3 p-4">
        <span className="text-2xl">{TYPE_ICONS[form.type] || '📝'}</span>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-sm">{form.label}</p>
          <p className="text-gray-400 text-xs capitalize">{form.type} form · Order #{form.display_order}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleEnabled}
            disabled={saving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              form.is_enabled
                ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
            }`}
          >
            {saving ? <RefreshCcw size={12} className="animate-spin" /> : null}
            {form.is_enabled ? '● Enabled' : '○ Disabled'}
          </button>

          <button
            onClick={onToggleExpand}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-all"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Edit label */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Form Label (shown to users)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={labelEdit}
                onChange={(e) => {
                  setLabelEdit(e.target.value);
                  setLabelChanged(e.target.value !== form.label);
                }}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm input-brand bg-gray-50"
              />
              {labelChanged && (
                <button
                  onClick={() => { onSaveLabel(labelEdit); setLabelChanged(false); }}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #FF6B00, #FFB800)' }}
                >
                  <Save size={12} /> Save
                </button>
              )}
            </div>
          </div>

          {/* Field list (read-only view) */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Fields ({form.fields?.length || 0})</p>
            <div className="space-y-1.5">
              {(form.fields || []).map((field, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-400 w-5">{idx + 1}.</span>
                  <span className="text-xs font-medium text-gray-700 flex-1">{field.label}</span>
                  <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">{field.type}</span>
                  {field.required && (
                    <span className="text-xs text-red-500 font-semibold">*req</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
