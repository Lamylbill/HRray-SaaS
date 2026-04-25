import React from 'react';
import { AlertTriangle, Clock, ShieldCheck, Users } from 'lucide-react';
import { useComplianceScore, useWorkPassExpiries, useProbationsDue, useForeignWorkerQuota } from './hooks/useCompliance';
import { format, parseISO } from 'date-fns';

export default function CompliancePage() {
  const { data: score, isLoading: scoreLoading } = useComplianceScore();
  const { data: expiries } = useWorkPassExpiries(90);
  const { data: probations } = useProbationsDue(30);
  const { data: quota } = useForeignWorkerQuota();

  const scoreColor = !score
    ? 'text-gray-400'
    : score >= 80
    ? 'text-green-600'
    : score >= 60
    ? 'text-yellow-600'
    : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Score + quota banner */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Compliance score</p>
            {scoreLoading ? (
              <div className="h-7 w-16 bg-gray-100 rounded animate-pulse mt-1" />
            ) : (
              <p className={`text-2xl font-bold ${scoreColor}`}>{score ?? 0}%</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Expiring passes</p>
            <p className="text-2xl font-bold text-gray-900">{expiries?.length ?? 0}</p>
            <p className="text-xs text-gray-400">within 90 days</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-yellow-50 flex items-center justify-center flex-shrink-0">
            <Clock size={20} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Probations due</p>
            <p className="text-2xl font-bold text-gray-900">{probations?.length ?? 0}</p>
            <p className="text-xs text-gray-400">within 30 days</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
            <Users size={20} className="text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">FW quota</p>
            {quota ? (
              <>
                <p className="text-2xl font-bold text-gray-900">{quota.current_foreign_workers ?? 0}</p>
                <p className="text-xs text-gray-400">of {quota.quota_limit ?? '?'} allowed</p>
              </>
            ) : (
              <p className="text-2xl font-bold text-gray-400">—</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Work pass expiries */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400" />
            Work pass expiries — next 90 days
          </h3>
          {!expiries?.length ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              No work passes expiring in the next 90 days
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                    <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pass type</th>
                    <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expiry</th>
                    <th className="text-right pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Days left</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {expiries.map(e => {
                    const daysLeft = Math.ceil(
                      (new Date(e.work_pass_expiry_date!).getTime() - Date.now()) / 86400000
                    );
                    return (
                      <tr key={e.id} className="hover:bg-gray-50/60">
                        <td className="py-2.5 font-medium text-gray-900">{e.full_name}</td>
                        <td className="py-2.5 text-gray-500">{e.work_pass_type ?? '—'}</td>
                        <td className="py-2.5 text-gray-500">
                          {format(parseISO(e.work_pass_expiry_date!), 'dd MMM yyyy')}
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                            daysLeft <= 30 ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'
                          }`}>
                            {daysLeft}d
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Probation reviews due */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-yellow-500" />
            Probation reviews — next 30 days
          </h3>
          {!probations?.length ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              No probation reviews due in the next 30 days
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                    <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                    <th className="text-right pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Probation ends</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {probations.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/60">
                      <td className="py-2.5 font-medium text-gray-900">{p.full_name}</td>
                      <td className="py-2.5 text-gray-500">{p.department ?? '—'}</td>
                      <td className="py-2.5 text-right text-gray-500">
                        {p.probation_end ? format(parseISO(p.probation_end), 'dd MMM yyyy') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
