import React from 'react';
import { X, Mail, Phone, Building2, Briefcase, Calendar, DollarSign } from 'lucide-react';
import { useEmployee } from '../hooks/useEmployees';
import { format, parseISO } from 'date-fns';

const STATUS_STYLE: Record<string, string> = {
  Active:     'bg-green-50 text-green-700',
  Inactive:   'bg-gray-100 text-gray-500',
  Terminated: 'bg-red-50 text-red-600',
  Probation:  'bg-yellow-50 text-yellow-700',
};

interface Props { id: string; onClose: () => void }

export default function EmployeeDrawer({ id, onClose }: Props) {
  const { data: emp, isLoading } = useEmployee(id);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Employee profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        {isLoading ? (
          <div className="flex-1 p-5 space-y-4 animate-pulse">
            <div className="h-16 bg-gray-100 rounded-xl" />
            <div className="h-4 bg-gray-100 rounded w-48" />
            <div className="h-4 bg-gray-100 rounded w-32" />
          </div>
        ) : emp ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Identity */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-bold flex-shrink-0">
                {emp.full_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{emp.full_name}</p>
                <p className="text-sm text-gray-500">{emp.job_title ?? 'No job title'}</p>
                {emp.employment_status && (
                  <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[emp.employment_status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {emp.employment_status}
                  </span>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <Detail icon={Mail} label="Email" value={emp.email} />
              <Detail icon={Phone} label="Phone" value={emp.phone_number ?? emp.mobile_no} />
              <Detail icon={Building2} label="Department" value={emp.department} />
              <Detail icon={Briefcase} label="Employment type" value={emp.employment_type} />
              <Detail icon={Calendar} label="Start date" value={emp.date_of_hire ? format(parseISO(emp.date_of_hire), 'dd MMM yyyy') : null} />
              <Detail icon={DollarSign} label="Basic salary" value={emp.basic_salary ? `SGD ${emp.basic_salary.toLocaleString()}` : null} />
            </div>

            {/* Compliance info */}
            <div className="bg-blue-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Compliance</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500">NRIC / Pass no.</p>
                  <p className="font-medium text-gray-800">{emp.nric ?? emp.work_pass_number ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Residency</p>
                  <p className="font-medium text-gray-800">{emp.residency_status ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Work pass type</p>
                  <p className="font-medium text-gray-800">{emp.work_pass_type ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pass expiry</p>
                  <p className="font-medium text-gray-800">
                    {emp.work_pass_expiry_date ? format(parseISO(emp.work_pass_expiry_date), 'dd MMM yyyy') : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">Employee not found</div>
        )}
      </div>
    </>
  );
}

function Detail({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3">
      <Icon size={15} className="text-gray-400 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 font-medium">{value}</p>
      </div>
    </div>
  );
}
