
import React, { useState, useEffect } from 'react';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import { LeaveRequest } from './interfaces';
import MonthView from './MonthView';
import WeekdayHeader from './WeekdayHeader';

const LeaveCalendar: React.FC = () => {
  console.log('LeaveCalendar component rendered');

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const getCurrentMonthYear = (): { month: number; year: number } => {
    const today = new Date();
    return { month: today.getMonth(), year: today.getFullYear() };
  };

  const { month, year } = getCurrentMonthYear();

  useEffect(() => {
    console.log('Fetching leave requests...');

    const fetchLeaveRequests = async () => {
      setLoading(true);
      try {
        const client = getAuthorizedClient();
        const allRequests: LeaveRequest[] = [];
        // Fetch data for the previous, current, and next month
        for (let i = -1; i <= 1; i++) {
          const currentMonth = month + i;
          const currentYear = year + Math.floor((month + i) / 12);
          const monthIndex = currentMonth % 12;

          const startDate = new Date(currentYear, monthIndex, 1);
          const endDate = new Date(currentYear, monthIndex + 1, 0);

          const startDateString = startDate.toISOString().split('T')[0];
          const endDateString = endDate.toISOString().split('T')[0];

          const { data, error } = await client
            .from('leave_requests')
            .select('id, employee_id, start_date, end_date, status, leave_type:leave_type_id(id, name, color), employee:employee_id(full_name)')
            .gte('end_date', startDateString)
            .lte('start_date', endDateString);

          if (error) {
            console.error('Error fetching leave requests:', error);
          }
          // Format the data to match the LeaveRequest interface
          const formattedData: LeaveRequest[] = data
            ? data.map((item) => ({
                id: item.id,
                employee: {
                  id: item.employee_id,
                  full_name: item.employee.full_name,
                },
                leave_type: {
                  id: item.leave_type.id,
                  name: item.leave_type.name,
                  color: item.leave_type.color,
                },
                start_date: item.start_date,
                end_date: item.end_date,
                status: item.status as 'Approved' | 'Pending' | 'Rejected',
              }))
            : [];
          allRequests.push(...formattedData);
        }
        console.log('Leave requests fetched:', allRequests);
        setLeaveRequests(allRequests);
        console.log('Leave requests state updated:', allRequests);
      } catch (error) {
        console.error('Error fetching leave requests:', error);
      } finally {
        setLoading(false); // Ensure loading is set to false after all requests are fetched
        console.log('Loading state set to false');
      }
    };

    if (getAuthorizedClient()) {
      console.log('Authorized client found');
    } else console.log('No authorized client found');
    console.log('useEffect hook triggered');

    fetchLeaveRequests();
  }, []);

  return (
    <div className="container mx-auto py-10 flex flex-col items-center w-full">
      <div className="relative">
        <WeekdayHeader />
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : (
          <>
            {[-1, 0, 1].map((i) => {
              const displayMonth = month + i;
              const displayYear = year + Math.floor(displayMonth / 12);
              const monthIndex = displayMonth % 12; // Ensure monthIndex is within 0-11
              return (
                <MonthView
                  key={i}
                  month={monthIndex}
                  year={displayYear}
                  leaveRequests={leaveRequests}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default LeaveCalendar;
