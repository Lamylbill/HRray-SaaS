import React, { useRef, useEffect } from 'react';
import { LeaveRequest } from './interfaces';
import LeaveItem from './LeaveItem';
import { format, isSameDay, isWithinInterval } from 'date-fns';

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
  
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getDayOfWeek = (day: number) => {
    return new Date(year, month, day).getDay();
  };

  const isLeaveStartDate = (date: Date, leaveRequest: LeaveRequest) => {
    return isSameDay(date, new Date(leaveRequest.start_date));
  };

  const isLeaveEndDate = (date: Date, leaveRequest: LeaveRequest) => {
    return isSameDay(date, new Date(leaveRequest.end_date));
  };

  const shouldRenderLeave = (date: Date, leaveRequest: LeaveRequest) => {
    const leaveInterval = {
      start: new Date(leaveRequest.start_date),
      end: new Date(leaveRequest.end_date)
    };
    return isWithinInterval(date, leaveInterval);
  };

  useEffect(() => {
    if (!monthHeaderRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.target.previousElementSibling) {
          const isStuck = entry.intersectionRatio < 1;
          entry.target.classList.toggle('is-stuck', isStuck);
          
          if (isStuck && entry.boundingClientRect.top <= 40) {
            const prevMonthHeaders = document.querySelectorAll('.month-header.is-stuck');
            prevMonthHeaders.forEach(header => {
              if (header !== entry.target) {
                (header as HTMLElement).style.opacity = '0';
              }
            });
          } else {
            const prevMonthHeaders = document.querySelectorAll('.month-header');
            prevMonthHeaders.forEach(header => {
              (header as HTMLElement).style.opacity = '1';
            });
          }
        }
      },
      { 
        threshold: [0, 0.25, 0.5, 0.75, 1],
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
      data-month={month}
      data-year={year}
      className="w-full"
      data-current={isCurrent}
    >
      <div 
        ref={monthHeaderRef}
        className={`month-header sticky top-10 z-20 bg-white bg-opacity-95 border-b border-gray-200 py-2 px-4 font-bold text-gray-800 transition-all duration-200 ${
          isCurrent ? 'bg-blue-50' : ''
        }`}
      >
        {monthName} {year}
        {isCurrent && <span className="text-blue-500 text-sm font-normal ml-2">(Current)</span>}
      </div>

      <div className="grid grid-cols-7 gap-px border-b border-gray-200">
        {emptyCells.map((_, index) => ( 
          <div key={`empty-${index}`} className="bg-gray-50 min-h-[85px] border border-gray-100" />
        ))}
        
        {calendarDays.map((day) => {
          const currentDate = new Date(year, month, day);
          const isToday = new Date().toDateString() === currentDate.toDateString();
          const isWeekend = getDayOfWeek(day) === 0 || getDayOfWeek(day) === 6;
          
          const dayLeaveRequests = leaveRequests.filter(request => 
            shouldRenderLeave(currentDate, request)
          );

          return (
            <div
              key={day} 
              className={`min-h-[100px] p-2 relative border border-gray-100 ${
                isToday ? 'bg-blue-50' : isWeekend ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <div className={`text-sm mb-1 ${
                isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
              }`}>
                {day}
              </div>
              
              <div className="space-y-1 overflow-y-auto max-h-[80%]">
                {dayLeaveRequests.map((leaveRequest) => (
                  <LeaveItem 
                    key={`${leaveRequest.id}-${day}`}
                    leaveRequest={leaveRequest}
                    isStart={isLeaveStartDate(currentDate, leaveRequest)}
                    isEnd={isLeaveEndDate(currentDate, leaveRequest)}
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
