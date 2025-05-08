
import React, { useState, useEffect } from 'react';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Employee } from '@/types/employee';
import { standardizeEmployee } from '@/utils/employeeFieldUtils';
import LeaveRecordsView from '@/components/leave/LeaveRecordsView';
import { AnimatedSection } from '@/components/ui-custom/AnimatedSection';
import { LeaveType } from '@/components/leave/interfaces';

const Dashboard = () => {
  const [employeeCount, setEmployeeCount] = useState<number>(0);
  const [activeEmployees, setActiveEmployees] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedLeaveTypes, setSelectedLeaveTypes] = useState<string[]>([]);
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
        
        if (!authorizedClient) {
          console.error("Authorized client not available");
          setError("Authentication error. Please try logging in again.");
          setIsLoading(false);
          return;
        }
        
        const { count: totalCount, error: countError } = await authorizedClient
          .from('employees_with_documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (countError) throw countError;

        const { data: activeData, error: activeError } = await authorizedClient
          .from('employees_with_documents')
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

    fetchStats();

    const fetchLeaveTypes = async () => {
      try {
        const authorizedClient = getAuthorizedClient();
        const { data, error } = await authorizedClient
          .from('leave_types')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setAvailableLeaveTypes(data || []);
      } catch (err: any) {
        console.error('Error fetching leave types:', err);
      }
    };
    
    fetchLeaveTypes();
  }, [user, isAuthenticated, authLoading]);

  const handleLeaveTypeFilter = (types: string[]) => {
    setSelectedLeaveTypes(types);
  };

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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-sm font-medium text-gray-700 card-title">Total Employees</h3>
                  <p className="text-2xl font-bold mt-2 card-number">{employeeCount}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-sm font-medium text-gray-700 card-title">Active Employees</h3>
                  <p className="text-2xl font-bold mt-2 card-number">{activeEmployees}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-sm font-medium text-gray-700 card-title">On Leave</h3>
                  <p className="text-2xl font-bold mt-2 card-number">{employeeCount - activeEmployees}</p>
                </div>
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <p className="text-gray-600">No recent activity to display.</p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Leave Records</h2>
              <LeaveRecordsView
                selectedLeaveTypes={selectedLeaveTypes}
                onLeaveTypeFilter={handleLeaveTypeFilter}
                availableLeaveTypes={availableLeaveTypes}
              />
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default Dashboard;
