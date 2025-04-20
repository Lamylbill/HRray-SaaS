
import React from 'react';
import { LeaveRequest } from './interfaces';
import LeaveItem from './LeaveItem';

interface MonthViewProps {
  month: number;
  year: number;
  leaveRequests: LeaveRequest[];
  isFirst?: boolean;
}

const MonthView: React.FC<MonthViewProps> = ({ month, year, leaveRequests, isFirst = false }) => {
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  // Generate array for days in the month
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Calculate number of empty cells before the first day
  const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // Helper function to get the day of week for a specific date
  const getDayOfWeek = (day: number) => {
    return new Date(year, month, day).getDay();
  };

  // Filter leave requests for this month
  const monthLeaveRequests = leaveRequests.filter(request => {
    const startDate = new Date(request.start_date);
    const endDate = new Date(request.end_date);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    return (
      (startDate <= monthEnd && endDate >= monthStart) // Date ranges overlap
    );
  });

  return (
    <section className="w-full">
      {/* Month header - sticky within the scroll container */}
      <div className="sticky top-0 z-20 bg-white bg-opacity-95 border-b border-gray-200 py-2 px-4 font-bold text-gray-800 mb-1">
        {monthName} {year}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px border-b border-gray-200">
        {/* Empty cells for days before the 1st of the month */}
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="bg-gray-50 min-h-[85px] border border-gray-100"></div>
        ))}
        
        {/* Actual calendar days */}
        {calendarDays.map((day) => {
          const currentDate = new Date(year, month, day);
          const isToday = new Date().toDateString() === currentDate.toDateString();
          const isWeekend = getDayOfWeek(day) === 0 || getDayOfWeek(day) === 6;
          
          // Get leave requests for this specific day
          const dayLeaveRequests = monthLeaveRequests.filter(request => {
            const leaveStart = new Date(request.start_date);
            const leaveEnd = new Date(request.end_date);
            return currentDate >= leaveStart && currentDate <= leaveEnd;
          });

          return (
            <div 
              key={day} 
              className={`min-h-[85px] p-2 relative border border-gray-100 ${
                isToday ? 'bg-blue-50' : isWeekend ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <div className={`text-sm mb-1 ${
                isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
              }`}>
                {day}
              </div>
              
              {/* Leave items */}
              <div className="space-y-1 overflow-y-auto max-h-[80%]">
                {dayLeaveRequests.map((leaveRequest) => (
                  <LeaveItem 
                    key={`${leaveRequest.id}-${day}`} 
                    leaveRequest={leaveRequest} 
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MonthView;
