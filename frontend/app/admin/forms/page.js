'use client';

import { useEffect, useState } from 'react';
import {
  fetchFormConfigs,
  createFormConfig,
  deleteFormConfig,
  updateFormConfig,
  fetchWeeklyConfig,
  updateWeeklyConfig,
  fetchMachines,
  addMachine,
  updateMachine,
  deleteMachine,
  fetchMachineUiConfig,
  saveMachineUiConfig,
} from '../../../lib/api';
import { RefreshCcw, Save, Plus, Calendar, Settings2, MapPin, Trash2, QrCode } from 'lucide-react';

const FIELD_TYPES = ['text', 'textarea', 'number', 'select', 'rating', 'like_dislike'];
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function FormsPage() {
  const [forms, setForms] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weeklyForm, setWeeklyForm] = useState({ title: '', start_date: '', end_date: '' });
  const [newMachine, setNewMachine] = useState({
    machineCode: '',
    name: '',
    location: '',
    area: '',
    status: 'active',
  });
  const [newForm, setNewForm] = useState({ type: '', label: '' });
  const [editingMachineId, setEditingMachineId] = useState(null);
  const [selectedMachineId, setSelectedMachineId] = useState(null);
  const [uiConfig, setUiConfig] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [formsRes, weeklyRes, machinesRes] = await Promise.all([
        fetchFormConfigs(),
        fetchWeeklyConfig(),
        fetchMachines(),
      ]);
      setForms(formsRes.data || []);
      setMachines((machinesRes.data || []).map((m) => ({ ...m, _draft: { ...m } })));
      if (weeklyRes.data) {
        setWeeklyForm({
          title: weeklyRes.data.title || '',
          start_date: weeklyRes.data.start_date?.slice(0, 10) || '',
          end_date: weeklyRes.data.end_date?.slice(0, 10) || '',
        });
      }
    } catch (_err) {
      setStatusMsg('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  async function saveWeekly() {
    setSaving(true);
    try {
      await updateWeeklyConfig({ ...weeklyForm, is_active: true });
      setStatusMsg('Weekly config updated');
    } catch (_err) {
      setStatusMsg('Failed to save weekly config');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMachine() {
    if (!newMachine.machineCode || !newMachine.location) return;
    setSaving(true);
    try {
      await addMachine(newMachine);
      setNewMachine({ machineCode: '', name: '', location: '', area: '', status: 'active' });
      setStatusMsg('Machine added with QR');
      await loadAll();
    } catch (err) {
      setStatusMsg(err.response?.data?.error || 'Failed to add machine');
    } finally {
      setSaving(false);
    }
  }

  function setMachineDraft(id, key, value) {
    setMachines((prev) => prev.map((m) => (m.id === id ? { ...m, _draft: { ...m._draft, [key]: value } } : m)));
  }

  async function saveMachine(machine) {
    setSaving(true);
    try {
      await updateMachine(machine.id, machine._draft);
      setEditingMachineId(null);
      setStatusMsg(`Machine ${machine.machineCode || machine.machine_code} updated`);
      await loadAll();
    } catch (err) {
      setStatusMsg(err.response?.data?.error || 'Failed to update machine');
    } finally {
      setSaving(false);
    }
  }

  async function removeMachine(id) {
    if (!confirm('Soft-delete this machine?')) return;
    setSaving(true);
    try {
      await deleteMachine(id);
      setStatusMsg('Machine disabled');
      await loadAll();
    } catch (_err) {
      setStatusMsg('Failed to delete machine');
    } finally {
      setSaving(false);
    }
  }

  async function loadUiConfig(machineId) {
    try {
      const res = await fetchMachineUiConfig(machineId);
      setUiConfig(res.data || {});
      setSelectedMachineId(machineId);
    } catch (_err) {
      setUiConfig({});
      setSelectedMachineId(machineId);
    }
  }

  async function saveUiConfig() {
    if (!selectedMachineId) return;
    setSaving(true);
    try {
      await saveMachineUiConfig(selectedMachineId, {
        banner_message: uiConfig.bannerMessage,
        highlight_text: uiConfig.highlightText,
        image_url: uiConfig.imageUrl,
        poll_question: uiConfig.pollQuestion,
        poll_options: uiConfig.pollOptions ? uiConfig.pollOptions.split(',').map(o => o.trim()) : [],
        poll_active: uiConfig.pollActive,
        show_whatsapp: uiConfig.showWhatsapp
      });
      setStatusMsg('UI Config saved');
    } catch (_err) {
      setStatusMsg('Failed to save UI config');
    } finally {
      setSaving(false);
    }
  }

  async function createForm() {
    if (!newForm.type || !newForm.label) return;
    setSaving(true);
    try {
      await createFormConfig({
        type: newForm.type.toLowerCase().trim(),
        label: newForm.label.trim(),
        fields: [],
        is_enabled: true,
      });
      setNewForm({ type: '', label: '' });
      await loadAll();
    } finally {
      setSaving(false);
    }
  }

  async function saveForm(formId, patch) {
    await updateFormConfig(formId, patch);
    await loadAll();
  }

  async function removeForm(id) {
    if (!confirm('Delete this form type?')) return;
    await deleteFormConfig(id);
    await loadAll();
  }

  function updateField(formId, index, key, value) {
    setForms((prev) =>
      prev.map((f) => {
        if (f.id !== formId) return f;
        const fields = Array.isArray(f.fields) ? [...f.fields] : [];
        fields[index] = { ...fields[index], [key]: value };
        return { ...f, fields };
      })
    );
  }

  function addField(formId) {
    setForms((prev) =>
      prev.map((f) =>
        f.id === formId
          ? {
              ...f,
              fields: [...(Array.isArray(f.fields) ? f.fields : []), { name: '', label: '', type: 'text', required: false, placeholder: '' }],
            }
          : f
      )
    );
  }

  function deleteField(formId, index) {
    setForms((prev) =>
      prev.map((f) => {
        if (f.id !== formId) return f;
        return { ...f, fields: (f.fields || []).filter((_, i) => i !== index) };
      })
    );
  }

  if (loading) return <div className="flex justify-center items-center h-60"><RefreshCcw size={24} className="animate-spin text-orange-500" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Control Center</h1>
      {!!statusMsg && <p className="text-sm text-gray-600">{statusMsg}</p>}

      <section className="bg-white rounded-2xl p-5 border border-gray-100">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><Calendar size={16} /> Weekly Feedback Config</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <input className="border rounded-xl px-3 py-2 text-sm" value={weeklyForm.title} onChange={(e) => setWeeklyForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" />
          <input className="border rounded-xl px-3 py-2 text-sm" type="date" value={weeklyForm.start_date} onChange={(e) => setWeeklyForm((p) => ({ ...p, start_date: e.target.value }))} />
          <input className="border rounded-xl px-3 py-2 text-sm" type="date" value={weeklyForm.end_date} onChange={(e) => setWeeklyForm((p) => ({ ...p, end_date: e.target.value }))} />
        </div>
        <button onClick={saveWeekly} disabled={saving} className="mt-3 px-4 py-2 text-sm rounded-xl bg-orange-600 text-white">Save</button>
      </section>

      <section className="bg-white rounded-2xl p-5 border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="font-semibold flex items-center gap-2"><MapPin size={16} /> Machine Management ({machines.length})</h2>
        </div>

        <div className="grid md:grid-cols-5 gap-2 mb-3">
          <input className="border rounded-xl px-3 py-2 text-sm" placeholder="machineCode" value={newMachine.machineCode} onChange={(e) => setNewMachine((p) => ({ ...p, machineCode: e.target.value }))} />
          <input className="border rounded-xl px-3 py-2 text-sm" placeholder="name" value={newMachine.name} onChange={(e) => setNewMachine((p) => ({ ...p, name: e.target.value }))} />
          <input className="border rounded-xl px-3 py-2 text-sm" placeholder="location" value={newMachine.location} onChange={(e) => setNewMachine((p) => ({ ...p, location: e.target.value }))} />
          <input className="border rounded-xl px-3 py-2 text-sm" placeholder="area" value={newMachine.area || ''} onChange={(e) => setNewMachine((p) => ({ ...p, area: e.target.value }))} />
          <button onClick={handleAddMachine} disabled={saving} className="rounded-xl bg-orange-600 text-white text-sm"><Plus size={14} className="inline mr-1" />Add</button>
        </div>

        <div className="space-y-3">
          {machines.map((m) => {
            const draft = m._draft || m;
            const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
            const machineCode = draft.machineCode || draft.machine_code || '';
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${frontendUrl}/machine/${machineCode}`)}`;
            const editing = editingMachineId === m.id;
            return (
              <div key={m.id} className="border rounded-xl p-3">
                <div className="grid md:grid-cols-8 gap-2 items-center">
                  <input disabled={!editing} className="border rounded px-2 py-1 text-sm" value={draft.machineCode || draft.machine_code || ''} onChange={(e) => setMachineDraft(m.id, 'machineCode', e.target.value)} />
                  <input disabled={!editing} className="border rounded px-2 py-1 text-sm" value={draft.name || ''} onChange={(e) => setMachineDraft(m.id, 'name', e.target.value)} />
                  <input disabled={!editing} className="border rounded px-2 py-1 text-sm" value={draft.location || ''} onChange={(e) => setMachineDraft(m.id, 'location', e.target.value)} />
                  <input disabled={!editing} className="border rounded px-2 py-1 text-sm" value={draft.area || ''} onChange={(e) => setMachineDraft(m.id, 'area', e.target.value)} />
                  <select disabled={!editing} className="border rounded px-2 py-1 text-sm" value={draft.status || 'active'} onChange={(e) => setMachineDraft(m.id, 'status', e.target.value)}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                  <div className="flex flex-col gap-1 items-start">
                    <img src={qrUrl} alt={`${machineCode} qr`} className="h-10 w-10 border rounded" />
                    <a href={qrUrl} download target="_blank" rel="noopener noreferrer" className="text-xs underline text-blue-600">Download</a>
                  </div>
                  <div className="flex gap-2">
                    {editing ? (
                      <button onClick={() => saveMachine(m)} className="text-xs bg-green-600 text-white rounded px-2 py-1">Save</button>
                    ) : (
                      <>
                        <button onClick={() => setEditingMachineId(m.id)} className="text-xs border rounded px-2 py-1">Edit</button>
                        <button onClick={() => loadUiConfig(m.id)} className="text-xs border rounded px-2 py-1">UI</button>
                      </>
                    )}
                    <button onClick={() => removeMachine(m.id)} className="text-xs bg-red-50 text-red-700 rounded px-2 py-1"><Trash2 size={12} className="inline mr-1" />Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {selectedMachineId && (
        <section className="bg-white rounded-2xl p-5 border border-gray-100">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Settings2 size={16} /> Machine UI Settings (ID: {selectedMachineId})</h2>

          <div className="space-y-4">
            {/* Banner */}
            <div>
              <label className="text-sm font-medium">Banner Message</label>
              <textarea className="w-full border rounded-xl px-3 py-2 text-sm mt-1" placeholder="Display banner at top of machine page" value={uiConfig.bannerMessage || ''} onChange={(e) => setUiConfig(p => ({ ...p, bannerMessage: e.target.value }))} />
            </div>

            {/* Highlight */}
            <div>
              <label className="text-sm font-medium">Highlight Text</label>
              <textarea className="w-full border rounded-xl px-3 py-2 text-sm mt-1" placeholder="Important note or highlight" value={uiConfig.highlightText || ''} onChange={(e) => setUiConfig(p => ({ ...p, highlightText: e.target.value }))} />
            </div>

            {/* Image */}
            <div>
              <label className="text-sm font-medium">Image URL</label>
              <input type="text" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" placeholder="https://example.com/image.jpg" value={uiConfig.imageUrl || ''} onChange={(e) => setUiConfig(p => ({ ...p, imageUrl: e.target.value }))} />
            </div>

            {/* Poll */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Poll System</h3>
              <div>
                <label className="text-sm font-medium">Poll Question</label>
                <input type="text" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" placeholder="What would you like to know?" value={uiConfig.pollQuestion || ''} onChange={(e) => setUiConfig(p => ({ ...p, pollQuestion: e.target.value }))} />
              </div>
              <div className="mt-3">
                <label className="text-sm font-medium">Poll Options (comma-separated)</label>
                <input type="text" className="w-full border rounded-xl px-3 py-2 text-sm mt-1" placeholder="Option 1, Option 2, Option 3" value={typeof uiConfig.pollOptions === 'string' ? uiConfig.pollOptions : (Array.isArray(uiConfig.pollOptions) ? uiConfig.pollOptions.join(', ') : '')} onChange={(e) => setUiConfig(p => ({ ...p, pollOptions: e.target.value }))} />
              </div>
              <label className="text-sm mt-3 flex items-center gap-2"><input type="checkbox" checked={!!uiConfig.pollActive} onChange={(e) => setUiConfig(p => ({ ...p, pollActive: e.target.checked }))} /> Enable Poll</label>
            </div>

            {/* WhatsApp */}
            <div className="border-t pt-4">
              <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={uiConfig.showWhatsapp !== false} onChange={(e) => setUiConfig(p => ({ ...p, showWhatsapp: e.target.checked }))} /> Show WhatsApp Button</label>
            </div>

            <button onClick={saveUiConfig} disabled={saving} className="w-full bg-blue-600 text-white rounded-xl px-4 py-2 font-semibold mt-4">Save UI Config</button>
          </div>
        </section>
      )}

      <section className="bg-white rounded-2xl p-5 border border-gray-100">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><Settings2 size={16} /> Dynamic Form Builder</h2>
        <div className="grid md:grid-cols-3 gap-2 mb-4">
          <input className="border rounded-xl px-3 py-2 text-sm" placeholder="form type (refund_custom)" value={newForm.type} onChange={(e) => setNewForm((p) => ({ ...p, type: e.target.value }))} />
          <input className="border rounded-xl px-3 py-2 text-sm" placeholder="label" value={newForm.label} onChange={(e) => setNewForm((p) => ({ ...p, label: e.target.value }))} />
          <button onClick={createForm} className="rounded-xl bg-orange-600 text-white text-sm">Create Form</button>
        </div>

        <div className="space-y-4">
          {forms.map((form) => (
            <div key={form.id} className="border rounded-xl p-3">
              <div className="grid md:grid-cols-5 gap-2 items-center mb-2">
                <input className="border rounded px-2 py-1 text-sm" value={form.type} onChange={(e) => setForms((prev) => prev.map((f) => (f.id === form.id ? { ...f, type: e.target.value } : f)))} />
                <input className="border rounded px-2 py-1 text-sm" value={form.label} onChange={(e) => setForms((prev) => prev.map((f) => (f.id === form.id ? { ...f, label: e.target.value } : f)))} />
                <label className="text-sm"><input type="checkbox" checked={!!form.is_enabled} onChange={(e) => setForms((prev) => prev.map((f) => (f.id === form.id ? { ...f, is_enabled: e.target.checked } : f)))} /> enabled</label>
                <button onClick={() => saveForm(form.id, { label: form.label, is_enabled: form.is_enabled, fields: form.fields })} className="text-sm border rounded px-3 py-1"><Save size={14} className="inline mr-1" />Save Form</button>
                <button onClick={() => removeForm(form.id)} className="text-sm bg-red-50 text-red-700 rounded px-3 py-1">Delete Form</button>
              </div>

              <div className="space-y-2">
                {(form.fields || []).map((field, idx) => (
                  <div key={`${form.id}-${idx}`} className="grid md:grid-cols-7 gap-2">
                    <input className="border rounded px-2 py-1 text-xs" placeholder="name" value={field.name || ''} onChange={(e) => updateField(form.id, idx, 'name', e.target.value)} />
                    <input className="border rounded px-2 py-1 text-xs" placeholder="label" value={field.label || ''} onChange={(e) => updateField(form.id, idx, 'label', e.target.value)} />
                    <select className="border rounded px-2 py-1 text-xs" value={field.type || 'text'} onChange={(e) => updateField(form.id, idx, 'type', e.target.value)}>
                      {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input className="border rounded px-2 py-1 text-xs" placeholder="placeholder" value={field.placeholder || ''} onChange={(e) => updateField(form.id, idx, 'placeholder', e.target.value)} />
                    <input className="border rounded px-2 py-1 text-xs" placeholder="options: a,b,c" value={Array.isArray(field.options) ? field.options.join(',') : ''} onChange={(e) => updateField(form.id, idx, 'options', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
                    <label className="text-xs"><input type="checkbox" checked={!!field.required} onChange={(e) => updateField(form.id, idx, 'required', e.target.checked)} /> required</label>
                    <button onClick={() => deleteField(form.id, idx)} className="text-xs bg-red-50 text-red-700 rounded px-2 py-1">Remove</button>
                  </div>
                ))}
                <button onClick={() => addField(form.id)} className="text-xs border rounded px-2 py-1">+ Add Field</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
