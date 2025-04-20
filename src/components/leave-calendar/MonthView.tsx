
import React, { useRef, useEffect } from 'react';
import { LeaveRequest } from './interfaces';
import LeaveItem from './LeaveItem';

interface MonthViewProps {
  month: number;
  year: number;
  leaveRequests: LeaveRequest[];
  isFirst?: boolean;
  isCurrent?: boolean;
}

const MonthView: React.FC<MonthViewProps> = ({ 
  month, 
  year, 
  leaveRequests,
  isFirst = false,
  isCurrent = false
}) => {
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const monthHeaderRef = useRef<HTMLDivElement>(null);
  
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

  // Set up Intersection Observer for sticky month header
  useEffect(() => {
    if (!monthHeaderRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.target.previousElementSibling) {
          // When this month header is at the top, make it sticky
          const isStuck = entry.intersectionRatio < 1;
          entry.target.classList.toggle('is-stuck', isStuck);
          
          // If there's a previous month header, hide it when this one becomes sticky
          if (isStuck && entry.boundingClientRect.top <= 40) {
            const prevMonthHeaders = document.querySelectorAll('.month-header.is-stuck');
            prevMonthHeaders.forEach(header => {
              if (header !== entry.target) {
                (header as HTMLElement).style.opacity = '0';
              }
            });
          } else {
            // Show all month headers when not sticky
            const prevMonthHeaders = document.querySelectorAll('.month-header');
            prevMonthHeaders.forEach(header => {
              (header as HTMLElement).style.opacity = '1';
            });
          }
        }
      },
      { 
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: '-40px 0px 0px 0px' // Account for the weekday header height
      }
    );

    observer.observe(monthHeaderRef.current);

    return () => {
      if (monthHeaderRef.current) {
        observer.unobserve(monthHeaderRef.current);
      }
    };
  }, []);

  return (
    <section 
      className="w-full"
      data-current={isCurrent}
    >
      {/* Month header - sticky within the scroll container */}
      <div 
        ref={monthHeaderRef}
        className={`month-header sticky top-10 z-20 bg-white bg-opacity-95 border-b border-gray-200 py-2 px-4 font-bold text-gray-800 transition-all duration-200 ${
          isCurrent ? 'bg-blue-50' : ''
        }`}
      >
        {monthName} {year} {isCurrent && <span className="text-blue-500 text-sm font-normal ml-2">(Current)</span>}
      </div>

      {/* Calendar grid - removed mb-1 and other spacing */}
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
              
              {/* Leave items with scrollable container for overflow */}
              <div className="space-y-1 overflow-y-auto max-h-[80%]">
                {dayLeaveRequests.length > 0 ? (
                  dayLeaveRequests.map((leaveRequest) => (
                    <LeaveItem 
                      key={`${leaveRequest.id}-${day}`} 
                      leaveRequest={leaveRequest} 
                    />
                  ))
                ) : (
                  <div className="text-xs text-gray-400 h-8"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MonthView;
