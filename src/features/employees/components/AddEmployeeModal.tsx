import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useCreateEmployee } from '../hooks/useEmployees';

const EMPLOYMENT_TYPES = ['Full-Time', 'Part-Time', 'Contract', 'Intern'];
const STATUSES = ['Active', 'Probation', 'Inactive', 'Terminated'];
const RESIDENCY = ['Singapore Citizen', 'Permanent Resident', 'Employment Pass', 'S Pass', 'Work Permit', 'Dependent Pass', 'Long Term Visit Pass'];
const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Operations', 'Finance', 'HR', 'Customer Service', 'Legal'];

interface Props { onClose: () => void }

export default function AddEmployeeModal({ onClose }: Props) {
  const create = useCreateEmployee();
  const [form, setForm] = useState({
    full_name: '', email: '', employee_code: '',
    department: '', job_title: '', employment_type: 'Full-Time',
    employment_status: 'Active', date_of_hire: '',
    basic_salary: '', phone_number: '', nric: '',
    nationality: 'Singaporean', residency_status: 'Singapore Citizen',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({
      ...form,
      basic_salary: form.basic_salary ? Number(form.basic_salary) : null,
    } as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Add employee</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
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

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors"
            >
              {create.isPending ? 'Adding…' : 'Add employee'}
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
