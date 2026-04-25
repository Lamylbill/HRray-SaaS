
import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserMinus, TrendingUp } from 'lucide-react';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { AnimatedSection } from '@/components/ui-custom/AnimatedSection';
import { LeaveType } from '@/components/leave/interfaces';
import LeaveRecordsView from '@/components/leave/LeaveRecordsView';
import ActivityFeed from '@/components/dashboard/ActivityFeed';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, iconBg, trend }) => (
  <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex items-center gap-4 hover:shadow-lg transition-shadow duration-200">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      {trend && <p className="text-xs text-emerald-600 font-medium mt-0.5">{trend}</p>}
    </div>
  </div>
);

const Dashboard = () => {
  const [employeeCount, setEmployeeCount] = useState<number>(0);
  const [activeEmployees, setActiveEmployees] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState<LeaveType[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      if (authLoading || !isAuthenticated || !user) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const authorizedClient = getAuthorizedClient();

        const { count: totalCount, error: countError } = await authorizedClient
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (countError) throw countError;

        const { data: activeData, error: activeError } = await authorizedClient
          .from('employees')
          .select('id')
          .eq('user_id', user.id)
          .eq('employment_status', 'Active');
        if (activeError) throw activeError;

        setEmployeeCount(totalCount || 0);
        setActiveEmployees(activeData?.length || 0);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchLeaveTypes = async () => {
      try {
        const authorizedClient = getAuthorizedClient();
        const { data, error } = await authorizedClient
          .from('leave_types')
          .select('*')
          .order('name');
        if (error) throw error;
        setAvailableLeaveTypes(data || []);
      } catch (err) {
        console.error('Error fetching leave types:', err);
      }
    };

    fetchStats();
    fetchLeaveTypes();
  }, [user, isAuthenticated, authLoading]);

  const onLeave = employeeCount - activeEmployees;

  return (
    <AnimatedSection className="h-full flex flex-col">
      <div className="min-h-screen bg-gray-50">
        <div className="pb-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-full pt-6">

            {/* Page header */}
            <div className="rounded-xl bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-5 mb-6">
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="mt-1 text-blue-200 text-sm">Your HR overview at a glance</p>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading dashboard data...</div>
            ) : error ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                Error loading dashboard: {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                <StatCard
                  label="Total Employees"
                  value={employeeCount}
                  icon={<Users className="h-6 w-6 text-blue-700" />}
                  iconBg="bg-blue-100"
                />
                <StatCard
                  label="Active Employees"
                  value={activeEmployees}
                  icon={<UserCheck className="h-6 w-6 text-emerald-700" />}
                  iconBg="bg-emerald-100"
                />
                <StatCard
                  label="Currently on Leave"
                  value={onLeave}
                  icon={<UserMinus className="h-6 w-6 text-amber-700" />}
                  iconBg="bg-amber-100"
                />
              </div>
            )}

            <div className="mb-10">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <ActivityFeed initialPageSize={5} />
            </div>

            {availableLeaveTypes.length > 0 && (
              <div>
                <LeaveRecordsView
                  availableLeaveTypes={availableLeaveTypes}
                  onlyPending
                  title="Pending Leave Requests"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default Dashboard;
