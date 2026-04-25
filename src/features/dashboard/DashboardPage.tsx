import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, DollarSign, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import { useDashboardStats, useRecentActivities, useWorkPassExpiries, usePendingLeave } from './hooks/useDashboard';
import { useAuth } from '@/context/AuthContext';
import { format, parseISO } from 'date-fns';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activities } = useRecentActivities();
  const { data: expiries } = useWorkPassExpiries();
  const { data: pendingLeave } = usePendingLeave();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {greeting()}{user?.email ? ` 👋` : ''}
        </h2>
        <p className="text-gray-500 text-sm mt-0.5">Here's what's happening today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Employees" value={stats?.totalEmployees ?? 0} icon={Users} accent="blue" loading={statsLoading} />
        <StatCard label="Pending Leave" value={stats?.pendingLeave ?? 0} icon={Calendar} accent="orange" loading={statsLoading} />
        <StatCard label="Payroll Running" value={stats?.activePayroll ?? 0} icon={DollarSign} accent="green" loading={statsLoading} />
        <StatCard label="Expiring Work Passes" value={stats?.expiringWorkPasses ?? 0} icon={AlertTriangle} accent="red" loading={statsLoading} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending Leave Approvals */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Pending leave approvals</h3>
            <Link to="/leave" className="text-xs text-orange-500 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {!pendingLeave?.length ? (
            <div className="py-8 text-center text-gray-400 text-sm">No pending approvals</div>
          ) : (
            <div className="space-y-3">
              {pendingLeave.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{req.employees?.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {req.leave_types?.name} · {format(parseISO(req.start_date), 'dd MMM')} – {format(parseISO(req.end_date), 'dd MMM')}
                    </p>
                  </div>
                  <Link to="/leave" className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded-lg hover:bg-orange-100 transition-colors">
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Work Pass Expiries */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Work pass expiries</h3>
            <Link to="/compliance" className="text-xs text-orange-500 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {!expiries?.length ? (
            <div className="py-8 text-center text-gray-400 text-sm">No expiries in 90 days</div>
          ) : (
            <div className="space-y-3">
              {expiries.slice(0, 5).map((e: any) => {
                const daysLeft = Math.ceil((new Date(e.work_pass_expiry_date).getTime() - Date.now()) / 86400000);
                return (
                  <div key={e.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{e.full_name}</p>
                      <p className="text-xs text-gray-400">{e.work_pass_type}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${daysLeft <= 30 ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'}`}>
                      {daysLeft}d
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Recent activity</h3>
        {!activities?.length ? (
          <div className="py-8 text-center text-gray-400 text-sm">No recent activity</div>
        ) : (
          <div className="space-y-3">
            {activities.map((a: any) => (
              <div key={a.id} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock size={13} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{a.message}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(a.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
