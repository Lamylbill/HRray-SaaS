import React, { useState, useRef } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';
import { useCreateEmployee, useUpdateEmployee } from '../hooks/useEmployees';
import { supabase } from '@/integrations/supabase/client';

const EMPLOYMENT_TYPES = ['Full-Time', 'Part-Time', 'Contract', 'Intern'];
const STATUSES = ['Active', 'Probation', 'Inactive', 'Terminated'];
const RESIDENCY = ['Singapore Citizen', 'Permanent Resident', 'Employment Pass', 'S Pass', 'Work Permit', 'Dependent Pass', 'Long Term Visit Pass'];
const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Operations', 'Finance', 'HR', 'Customer Service', 'Legal'];

interface Props {
  onClose: () => void;
  employee?: any | null;
}

export default function AddEmployeeModal({ onClose, employee }: Props) {
  const isEditing = !!employee;
  const create = useCreateEmployee();
  const update = useUpdateEmployee();

  const [form, setForm] = useState({
    full_name:         employee?.full_name        ?? '',
    email:             employee?.email            ?? '',
    employee_code:     employee?.employee_code    ?? '',
    department:        employee?.department       ?? '',
    job_title:         employee?.job_title        ?? '',
    employment_type:   employee?.employment_type  ?? 'Full-Time',
    employment_status: employee?.employment_status ?? 'Active',
    date_of_hire:      employee?.date_of_hire     ?? '',
    basic_salary:      employee?.basic_salary != null ? String(employee.basic_salary) : '',
    phone_number:      employee?.phone_number     ?? employee?.contact_number ?? '',
    nric:              employee?.nric             ?? '',
    nationality:       employee?.nationality      ?? 'Singaporean',
    residency_status:  employee?.residency_status ?? 'Singapore Citizen',
    profile_photo:     employee?.profile_photo    ?? '',
    notes:             employee?.personal_info_open_1 ?? '',
  });

  const [photoPreview, setPhotoPreview] = useState<string>(employee?.profile_photo ?? '');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    setUploading(true);

    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('employee-photos').upload(path, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from('employee-photos').getPublicUrl(path);
        set('profile_photo', data.publicUrl);
      }
    } catch {
      // Upload failed silently — photo preview still shows but won't persist
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      basic_salary: form.basic_salary ? Number(form.basic_salary) : null,
      personal_info_open_1: form.notes,
    } as any;

    if (isEditing) {
      await update.mutateAsync({ id: employee.id, data: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  const isPending = create.isPending || update.isPending;

  const initials = form.full_name
    ? form.full_name.split(' ').map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{isEditing ? 'Edit employee' : 'Add employee'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Photo upload */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden cursor-pointer ring-4 ring-white shadow-md"
                onClick={() => fileRef.current?.click()}
              >
                {photoPreview
                  ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                  : initials}
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                    <Loader2 size={18} className="text-white animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-6 h-6 bg-blue-900 rounded-full flex items-center justify-center shadow"
              >
                <Camera size={11} className="text-white" />
              </button>
            </div>
            <span className="text-xs text-gray-400">Click to upload photo</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Core fields */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full name *" required value={form.full_name} onChange={v => set('full_name', v)} />
            <Field label="Work email *" type="email" required value={form.email} onChange={v => set('email', v)} />
            <Field label="Employee code" value={form.employee_code} onChange={v => set('employee_code', v)} />
            <Field label="Phone number" value={form.phone_number} onChange={v => set('phone_number', v)} />
            <Field label="NRIC / Work pass no." value={form.nric} onChange={v => set('nric', v)} />
            <Field label="Nationality" value={form.nationality} onChange={v => set('nationality', v)} />
          </div>

          <Select label="Residency status" value={form.residency_status} options={RESIDENCY} onChange={v => set('residency_status', v)} />

          <div className="grid grid-cols-2 gap-4">
            <Select label="Department" value={form.department} options={DEPARTMENTS} onChange={v => set('department', v)} allowEmpty />
            <Field label="Job title" value={form.job_title} onChange={v => set('job_title', v)} />
            <Select label="Employment type" value={form.employment_type} options={EMPLOYMENT_TYPES} onChange={v => set('employment_type', v)} />
            <Select label="Status" value={form.employment_status} options={STATUSES} onChange={v => set('employment_status', v)} />
            <Field label="Start date" type="date" value={form.date_of_hire} onChange={v => set('date_of_hire', v)} />
            <Field label="Basic salary (SGD)" type="number" value={form.basic_salary} onChange={v => set('basic_salary', v)} />
          </div>

          {/* Notes / custom field */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Additional info</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Any additional notes about this employee…"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || uploading}
              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors"
            >
              {isPending ? (isEditing ? 'Saving…' : 'Adding…') : (isEditing ? 'Save changes' : 'Add employee')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type} required={required} value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
      />
    </div>
  );
}

function Select({ label, value, options, onChange, allowEmpty = false }: {
  label: string; value: string; options: string[];
  onChange: (v: string) => void; allowEmpty?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
      >
        {allowEmpty && <option value="">Select…</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
