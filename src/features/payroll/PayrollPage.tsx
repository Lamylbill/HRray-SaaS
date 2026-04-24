import React, { useState } from 'react';
import { Plus, ChevronRight, X, Play, CheckCircle } from 'lucide-react';
import { usePayrollPeriods, usePayrollItems, useCreatePayrollPeriod, useUpdatePeriodStatus } from './hooks/usePayroll';
import { format, parseISO } from 'date-fns';

const STATUS_STYLE: Record<string, string> = {
  Draft:     'bg-gray-100 text-gray-500',
  Running:   'bg-blue-50 text-blue-700',
  Completed: 'bg-green-50 text-green-700',
  Approved:  'bg-orange-50 text-orange-700',
};

export default function PayrollPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: periods, isLoading } = usePayrollPeriods();
  const { data: items } = usePayrollItems(selectedId);
  const updateStatus = useUpdatePeriodStatus();

  const selected = periods?.find(p => p.id === selectedId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-gray-700">
            {periods?.length ?? 0} payroll period{periods?.length !== 1 ? 's' : ''}
          </h2>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} /> New period
        </button>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Period list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !periods?.length ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              No payroll periods yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {periods.map(p => (
                <li key={p.id}>
                  <button
                    onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors ${
                      p.id === selectedId ? 'bg-orange-50/60' : ''
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(parseISO(p.start_date), 'dd MMM')} – {format(parseISO(p.end_date), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[p.status ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                        {p.status}
                      </span>
                      <ChevronRight size={14} className="text-gray-400" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Period detail */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="bg-white rounded-xl border border-gray-100 py-24 text-center text-gray-400 text-sm">
              Select a payroll period to view details
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selected.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {format(parseISO(selected.start_date), 'dd MMM')} – {format(parseISO(selected.end_date), 'dd MMM yyyy')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selected.status === 'Draft' && (
                    <button
                      onClick={() => updateStatus.mutate({ id: selected.id, status: 'Running' })}
                      disabled={updateStatus.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Play size={12} /> Run payroll
                    </button>
                  )}
                  {selected.status === 'Running' && (
                    <button
                      onClick={() => updateStatus.mutate({ id: selected.id, status: 'Completed' })}
                      disabled={updateStatus.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={12} /> Mark complete
                    </button>
                  )}
                </div>
              </div>

              {/* Summary stats */}
              {items && items.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Employees</p>
                    <p className="text-lg font-semibold text-gray-900">{items.length}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Gross total</p>
                    <p className="text-lg font-semibold text-gray-900">
                      SGD {items.reduce((sum, i) => sum + (i.gross_salary ?? 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Net total</p>
                    <p className="text-lg font-semibold text-gray-900">
                      SGD {items.reduce((sum, i) => sum + (i.net_salary ?? 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Items table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                      <th className="text-right pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Basic</th>
                      <th className="text-right pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">CPF (EE)</th>
                      <th className="text-right pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {!items?.length ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                          No payroll items for this period
                        </td>
                      </tr>
                    ) : items.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50/60">
                        <td className="py-2.5 text-gray-800 font-medium">{item.employee_id}</td>
                        <td className="py-2.5 text-right text-gray-600">{item.basic_salary?.toLocaleString() ?? '—'}</td>
                        <td className="py-2.5 text-right text-gray-600">{item.employee_cpf_contribution?.toLocaleString() ?? '—'}</td>
                        <td className="py-2.5 text-right font-medium text-gray-900">{item.net_salary?.toLocaleString() ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {creating && <NewPeriodModal onClose={() => setCreating(false)} />}
    </div>
  );
}

function NewPeriodModal({ onClose }: { onClose: () => void }) {
  const create = useCreatePayrollPeriod();
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({ ...form, status: 'Draft' } as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">New payroll period</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Period name *</label>
            <input
              required value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. May 2025"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
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
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors"
            >
              {create.isPending ? 'Creating…' : 'Create period'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
