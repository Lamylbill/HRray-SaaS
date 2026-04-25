import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, DollarSign, AlertTriangle, Clock, ArrowRight, Sparkles } from 'lucide-react';
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

function SectionCard({ title, linkTo, linkLabel, children }: {
  title: string; linkTo: string; linkLabel: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        <Link
          to={linkTo}
          className="flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors"
        >
          {linkLabel} <ArrowRight size={11} />
        </Link>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-10 flex flex-col items-center gap-2 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-1">
        <Sparkles size={16} className="text-gray-300" />
      </div>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
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

  const firstName = user?.email?.split('@')[0] ?? '';

  return (
    <div className="space-y-6">
      {/* Welcome hero */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-[#0a1835] p-6 shadow-lg shadow-blue-900/20">
        {/* Decorative orbs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative">
          <p className="text-blue-300/70 text-sm font-medium mb-1 tracking-wide uppercase">
            {new Date().toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h2 className="text-2xl font-bold text-white mb-1">
            {greeting()}{firstName ? `, ${firstName}` : ''}.
          </h2>
          <p className="text-blue-300/60 text-sm">Here's what's happening with your team today.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employees"       value={stats?.totalEmployees ?? 0}       icon={Users}          accent="blue"   loading={statsLoading} />
        <StatCard label="Pending Leave"          value={stats?.pendingLeave ?? 0}          icon={Calendar}       accent="orange" loading={statsLoading} />
        <StatCard label="Payroll Running"        value={stats?.activePayroll ?? 0}         icon={DollarSign}     accent="green"  loading={statsLoading} />
        <StatCard label="Expiring Work Passes"   value={stats?.expiringWorkPasses ?? 0}    icon={AlertTriangle}  accent="red"    loading={statsLoading} />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Pending leave approvals */}
        <div className="lg:col-span-2">
          <SectionCard title="Pending leave approvals" linkTo="/leave" linkLabel="View all">
            {!pendingLeave?.length ? (
              <EmptyState message="No pending approvals — you're all caught up." />
            ) : (
              <div className="space-y-2">
                {pendingLeave.map((req: any) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                        {req.employees?.full_name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{req.employees?.full_name}</p>
                        <p className="text-xs text-gray-400">
                          {req.leave_types?.name} · {format(parseISO(req.start_date), 'dd MMM')} – {format(parseISO(req.end_date), 'dd MMM')}
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/leave"
                      className="px-3 py-1.5 bg-orange-50 text-orange-600 text-xs font-semibold rounded-lg hover:bg-orange-100 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Work pass expiries */}
        <SectionCard title="Work pass expiries" linkTo="/compliance" linkLabel="View all">
          {!expiries?.length ? (
            <EmptyState message="No expiries in the next 90 days." />
          ) : (
            <div className="space-y-3">
              {expiries.slice(0, 5).map((e: any) => {
                const daysLeft = Math.ceil((new Date(e.work_pass_expiry_date).getTime() - Date.now()) / 86400000);
                const urgent = daysLeft <= 30;
                return (
                  <div key={e.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{e.full_name}</p>
                      <p className="text-xs text-gray-400">{e.work_pass_type}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      urgent
                        ? 'bg-red-50 text-red-600 ring-1 ring-red-100'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {daysLeft}d
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-900 text-sm">Recent activity</h3>
        </div>
        <div className="p-5">
          {!activities?.length ? (
            <EmptyState message="No recent activity to show." />
          ) : (
            <div className="space-y-1">
              {activities.map((a: any, i: number) => (
                <div key={a.id} className="flex items-start gap-3 py-2">
                  <div className="relative flex-shrink-0">
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center mt-0.5">
                      <Clock size={12} className="text-blue-500" />
                    </div>
                    {i < activities.length - 1 && (
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-4 bg-gray-100" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm text-gray-700 leading-snug">{a.message}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 pt-1">{timeAgo(a.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
