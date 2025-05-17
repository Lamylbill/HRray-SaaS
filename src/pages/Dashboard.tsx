import React, { useState, useEffect } from 'react';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { AnimatedSection } from '@/components/ui-custom/AnimatedSection';
import { LeaveType } from '@/components/leave/interfaces';
import LeaveRecordsView from '@/components/leave/LeaveRecordsView';

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

  return (
    <AnimatedSection className="h-full flex flex-col">
      <div className="min-h-screen bg-gray-50">
        <div className="pb-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-full">
            <h1 className="text-2xl font-bold">Dashboard</h1>

            {isLoading ? (
              <div className="text-center py-8">Loading dashboard data...</div>
            ) : error ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-md">
                Error loading dashboard: {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-sm font-medium text-gray-700">Total Employees</h3>
                  <p className="text-2xl font-bold mt-2">{employeeCount}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-sm font-medium text-gray-700">Active Employees</h3>
                  <p className="text-2xl font-bold mt-2">{activeEmployees}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-sm font-medium text-gray-700">On Leave</h3>
                  <p className="text-2xl font-bold mt-2">{employeeCount - activeEmployees}</p>
                </div>
              </div>
            )}

            <div className="mt-10">
              <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <p className="text-gray-600">No recent activity to display.</p>
              </div>
            </div>

            {availableLeaveTypes.length > 0 && (
              <div className="mt-10">
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
