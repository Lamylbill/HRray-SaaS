
import React, { useState, useEffect, useRef } from 'react';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import { LeaveRequest } from '../leave-calendar/interfaces';
import MonthView from '../leave-calendar/MonthView';
import WeekdayHeader from '../leave-calendar/WeekdayHeader';

const LeaveCalendarView: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate the range of months to display (12 months: 6 in the past, current month, and 5 in the future)
  const calculateMonthRange = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const months = [];
    // Generate 6 months before current month
    for (let i = -6; i <= 5; i++) {
      const monthOffset = currentMonth + i;
      const yearOffset = Math.floor(monthOffset / 12);
      const month = ((monthOffset % 12) + 12) % 12; // Ensure month is between 0-11
      const year = currentYear + yearOffset;
      
      months.push({ month, year });
    }
    
    return months;
  };

  const monthsToDisplay = calculateMonthRange();

  useEffect(() => {
    console.log('Fetching leave requests...');

    const fetchLeaveRequests = async () => {
      setLoading(true);
      try {
        const client = getAuthorizedClient();
        const allRequests: LeaveRequest[] = [];

        // Get min and max dates from monthsToDisplay
        const startMonth = monthsToDisplay[0];
        const endMonth = monthsToDisplay[monthsToDisplay.length - 1];
        
        const startDate = new Date(startMonth.year, startMonth.month, 1);
        const endDate = new Date(endMonth.year, endMonth.month + 1, 0);

        const startDateString = startDate.toISOString().split('T')[0];
        const endDateString = endDate.toISOString().split('T')[0];

        // Fetch all leave requests in the date range in a single query
        const { data, error } = await client
          .from('leave_requests')
          .select('id, employee_id, start_date, end_date, status, leave_type:leave_type_id(id, name, color), employee:employee_id(full_name)')
          .gte('end_date', startDateString)
          .lte('start_date', endDateString);

        if (error) {
          console.error('Error fetching leave requests:', error);
        }

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

        console.log('Leave requests fetched:', formattedData);
        setLeaveRequests(formattedData);
      } catch (error) {
        console.error('Error fetching leave requests:', error);
      } finally {
        setLoading(false);
      }
    };

    if (getAuthorizedClient()) {
      console.log('Authorized client found');
      fetchLeaveRequests();
    } else {
      console.log('No authorized client found');
      setLoading(false);
    }
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Sticky weekday header */}
      <WeekdayHeader />
      
      {/* Scrollable calendar container */}
      <div 
        ref={containerRef} 
        className="h-[calc(100vh-220px)] overflow-y-auto pb-10"
      >
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-center">Loading calendar data...</p>
          </div>
        ) : (
          <div className="relative">
            {monthsToDisplay.map(({ month, year }, index) => (
              <MonthView
                key={`${year}-${month}`}
                month={month}
                year={year}
                leaveRequests={leaveRequests}
                isFirst={index === 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveCalendarView;
