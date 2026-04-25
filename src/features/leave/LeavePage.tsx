import React, { useState } from 'react';
import { Plus, Check, X, Calendar } from 'lucide-react';
import { useLeaveRequests, useLeaveTypes, useCreateLeaveRequest, useUpdateLeaveStatus } from './hooks/useLeave';
import { useEmployees } from '@/features/employees/hooks/useEmployees';
import { format, parseISO } from 'date-fns';

const STATUS_STYLE: Record<string, string> = {
  Pending:  'bg-yellow-50 text-yellow-700',
  Approved: 'bg-green-50 text-green-700',
  Rejected: 'bg-red-50 text-red-600',
};

const TABS = ['All', 'Pending', 'Approved', 'Rejected'];

export default function LeavePage() {
  const [tab, setTab] = useState('All');
  const [applying, setApplying] = useState(false);

  const filters = tab === 'All' ? {} : { status: tab };
  const { data: requests, isLoading } = useLeaveRequests(filters);
  const { data: employees } = useEmployees();
  const { data: leaveTypes } = useLeaveTypes();
  const updateStatus = useUpdateLeaveStatus();

  const employeeMap = Object.fromEntries((employees ?? []).map(e => [e.id, e.full_name]));
  const leaveTypeMap = Object.fromEntries((leaveTypes ?? []).map(t => [t.id, t.name]));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={() => setApplying(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} /> Apply leave
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Leave type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dates</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Days</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                    </td>
                  ))}
                </tr>
              ))}
              {!isLoading && !requests?.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-gray-400">
                    {tab === 'All' ? 'No leave requests yet.' : `No ${tab.toLowerCase()} requests.`}
                  </td>
                </tr>
              )}
              {requests?.map(req => (
                <tr key={req.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {employeeMap[req.employee_id] ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {leaveTypeMap[req.leave_type_id] ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-gray-400" />
                      {format(parseISO(req.start_date), 'dd MMM')} – {format(parseISO(req.end_date), 'dd MMM yyyy')}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{req.working_days ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[req.status ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {req.status === 'Pending' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateStatus.mutate({ id: req.id, status: 'Approved' })}
                          disabled={updateStatus.isPending}
                          className="flex items-center gap-1 px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Check size={12} /> Approve
                        </button>
                        <button
                          onClick={() => updateStatus.mutate({ id: req.id, status: 'Rejected' })}
                          disabled={updateStatus.isPending}
                          className="flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          <X size={12} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {req.reviewed_at ? format(parseISO(req.reviewed_at), 'dd MMM yyyy') : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(requests?.length ?? 0) > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {requests!.length} request{requests!.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {applying && (
        <ApplyLeaveModal
          employees={employees ?? []}
          leaveTypes={leaveTypes ?? []}
          onClose={() => setApplying(false)}
        />
      )}
    </div>
  );
}

function ApplyLeaveModal({
  employees,
  leaveTypes,
  onClose,
}: {
  employees: Array<{ id: string; full_name: string }>;
  leaveTypes: Array<{ id: string; name: string }>;
  onClose: () => void;
}) {
  const create = useCreateLeaveRequest();
  const [form, setForm] = useState({
    employee_id: '',
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync(form as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Apply for leave</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Employee *</label>
            <select
              required value={form.employee_id} onChange={e => set('employee_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
            >
              <option value="">Select employee…</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Leave type *</label>
            <select
              required value={form.leave_type_id} onChange={e => set('leave_type_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
            >
              <option value="">Select type…</option>
              {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start date *</label>
              <input
                type="date" required value={form.start_date} onChange={e => set('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End date *</label>
              <input
                type="date" required value={form.end_date} onChange={e => set('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
            <textarea
              rows={3} value={form.reason} onChange={e => set('reason', e.target.value)}
              placeholder="Optional reason…"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors"
            >
              {create.isPending ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
