'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchMachine, submitForm } from '../../../lib/api';

export default function MachinePage({ params }) {
  const machineCode = String(params?.id || '').trim();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [machine, setMachine] = useState(null);
  const [forms, setForms] = useState([]);
  const [ui_config, setUiConfig] = useState(null);
  const [selectedFormType, setSelectedFormType] = useState('');
  const [formData, setFormData] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [submittedMeta, setSubmittedMeta] = useState(null);
  const [pollSelected, setPollSelected] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError('');
        const response = await fetchMachine(machineCode);

        if (!mounted) return;

        setMachine(response.data.machine);
        setForms(Array.isArray(response.data.forms) ? response.data.forms : []);
        setUiConfig(response.data.ui_config || null);
      } catch (err) {
        if (!mounted) return;

        if (err.response?.status === 404) {
          setError('Machine not found');
        } else {
          setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load machine');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [machineCode]);

  const selectedForm = useMemo(
    () => forms.find((form) => form.type === selectedFormType) || null,
    [forms, selectedFormType]
  );

  const selectedFields = Array.isArray(selectedForm?.fields) ? selectedForm.fields : [];

  function handleSelectForm(type) {
    setSelectedFormType(type);
    setFormData({});
    setFieldErrors({});
    setSuccessMessage('');
    setSubmittedMeta(null);
  }

  function handleFieldChange(name, value) {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function validateForm() {
    const errors = {};
    for (const field of selectedFields) {
      if (!field?.required) continue;
      const value = formData[field.name];
      if (value === undefined || value === null || value === '') {
        errors[field.name] = `${field.label || field.name} is required`;
      }
    }
    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedForm || !machine) return;

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      setSuccessMessage('');

      const response = await submitForm({
        machine_id: machine.id,
        form_type: selectedForm.type,
        data: formData,
      });

      setSuccessMessage(`Submitted successfully. ID: ${response.data.submissionId}`);
      setSubmittedMeta({
        formType: selectedForm.type,
        data: { ...formData },
        machineId: machine.id,
      });

      setFormData({});
      setFieldErrors({});
    } catch (err) {
      const apiError = err.response?.data?.error || 'Failed to submit form';
      setSuccessMessage('');
      setError(apiError);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <p className="text-slate-600 text-base">Loading machine...</p>
      </main>
    );
  }

  if (error && !machine) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl bg-white shadow-sm border border-slate-200 p-6 text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Unable to continue</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-md px-4 py-6">

        {/* Machine Info */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 mb-4">
          <h1 className="text-xl font-bold text-slate-900">
            {machine?.machineCode || machine?.machine_code || `Machine ${machineCode}`}
          </h1>
          {(machine?.location || machine?.area) && (
            <p className="text-slate-600 mt-1">
              {machine?.location}
              {machine?.location && machine?.area ? `, ${machine.area}` : machine?.area || ''}
            </p>
          )}
        </section>

        {/* UI Config: Banner */}
        {ui_config?.bannerMessage && (
          <section className="rounded-2xl bg-blue-50 border border-blue-200 shadow-sm p-4 mb-4">
            <p className="text-slate-900 font-medium">{ui_config.bannerMessage}</p>
          </section>
        )}

        {/* UI Config: Highlight */}
        {ui_config?.highlightText && (
          <section className="rounded-2xl bg-yellow-50 border border-yellow-200 shadow-sm p-4 mb-4">
            <p className="text-slate-900">{ui_config.highlightText}</p>
          </section>
        )}

        {/* UI Config: Image */}
        {ui_config?.imageUrl && (
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 mb-4">
            <img src={ui_config.imageUrl} alt="Machine display" className="w-full rounded-lg" />
          </section>
        )}

        {/* UI Config: Poll */}
        {ui_config?.pollActive && ui_config?.pollQuestion && Array.isArray(ui_config?.pollOptions) && ui_config.pollOptions.length > 0 && (
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 mb-4">
            <h3 className="text-base font-semibold text-slate-900 mb-3">{ui_config.pollQuestion}</h3>
            <div className="space-y-2">
              {ui_config.pollOptions.map((option, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={async () => {
                    setPollSelected(option);
                    try {
                      await fetch('/api/poll-response', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ machine_id: machine?.id, selected_option: option })
                      });
                      setTimeout(() => setPollSelected(null), 1000);
                    } catch (err) {
                      console.error('Poll error:', err);
                      setPollSelected(null);
                    }
                  }}
                  className={`w-full rounded-lg border px-4 py-2 text-left text-sm transition ${
                    pollSelected === option
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Form Selection */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 mb-4">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Choose form type</h2>

          <div className="grid grid-cols-1 gap-2">
            {forms.map((form) => (
              <button
                key={form.type}
                type="button"
                onClick={() => handleSelectForm(form.type)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-base font-medium transition ${
                  selectedFormType === form.type
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                {form.label || form.type}
              </button>
            ))}
          </div>
        </section>

        {/* Form Render */}
        {selectedForm && (
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {selectedForm.label || selectedForm.type}
            </h3>

            {!!error && !!machine && <p className="mb-3 text-sm text-red-600">{error}</p>}
            {!!successMessage && <p className="mb-3 text-sm text-green-600">{successMessage}</p>}

            {submittedMeta?.formType === 'refund' && (ui_config?.showWhatsapp !== false) && (
              <a
                href={buildRefundWhatsAppLink(submittedMeta)}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-3 block w-full rounded-xl bg-green-600 text-white text-center text-base font-semibold py-3"
              >
                Continue on WhatsApp
              </a>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {selectedFields.map((field) => (
                <DynamicField
                  key={field.name}
                  field={field}
                  value={formData[field.name]}
                  error={fieldErrors[field.name]}
                  onChange={(value) => handleFieldChange(field.name, value)}
                />
              ))}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-orange-600 text-white text-lg font-semibold py-4 disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}

function DynamicField({ field, value, error, onChange }) {
  const label = field.label || field.name;
  const baseInputClasses =
    'w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-300';

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {field.required ? <span className="text-red-500"> *</span> : null}
      </label>

      {(field.type === 'text' || field.type === 'number' || field.type === 'tel') && (
        <input
          type={field.type}
          className={baseInputClasses}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
        />
      )}

      {field.type === 'textarea' && (
        <textarea
          className={`${baseInputClasses} min-h-28`}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
        />
      )}

      {field.type === 'select' && (
        <select className={baseInputClasses} value={value || ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function buildRefundWhatsAppLink(meta) {
  const phone = '919515033232';
  const d = meta?.data || {};

  const msg =
    `Refund Request:\n` +
    `Machine: ${meta.machineId}\n` +
    `Name: ${d.name}\n` +
    `Phone: ${d.phone}\n` +
    `Amount: ${d.amount}\n` +
    `Issue: ${d.description}`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}