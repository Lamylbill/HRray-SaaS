import React, { useRef, useEffect } from 'react';
import { LeaveRequest } from './interfaces';
import LeaveItem from './LeaveItem';
import { format, isSameDay, isWithinInterval, startOfWeek, addDays, getWeek, isThisWeek, getDay } from 'date-fns';

interface WeekViewProps {
  year: number;
  month: number;
  week: number;
  leaveRequests: LeaveRequest[];
  isFirst?: boolean;
  isCurrent?: boolean;
}

const WeekView: React.FC<WeekViewProps> = ({
  year,
  month,
  week,
  leaveRequests,
  isFirst = false,
  isCurrent = false,
}) => {
    const weekHeaderRef = useRef<HTMLDivElement>(null);

  const getMondayOfWeek = (year: number, month: number, week: number): Date => {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToAdd = (week - 1) * 7;
    let monday = startOfWeek(addDays(firstDayOfYear, daysToAdd), { weekStartsOn: 1 });

    if (month !== monday.getMonth()) {
      const firstDayOfMonth = new Date(year, month, 1);
      monday = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
    }

    return monday;
  };

  const getCalendarDays = (monday: Date): Date[] => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(monday, i));
    }
    return days;
  };

    const getDayOfWeek = (day: number, month: number, year: number): number => {
        return (getDay(new Date(year, month, day)) + 6) % 7;
    };

    const isCurrentWeek = (year: number, month: number, week: number): boolean => {
        const monday = getMondayOfWeek(year, month, week);
        return isThisWeek(monday, { weekStartsOn: 1 });
    };


    const monday = getMondayOfWeek(year, month, week);
    const calendarDays = getCalendarDays(monday);

    const weekNumber = getWeek(monday, { weekStartsOn: 1 });
    const monthName = monday.toLocaleString('default', { month: 'long' });

  const isLeaveStartDate = (date: Date, leaveRequest: LeaveRequest) => {
    return isSameDay(date, new Date(leaveRequest.start_date));
  };

  const isLeaveEndDate = (date: Date, leaveRequest: LeaveRequest) => {
    return isSameDay(date, new Date(leaveRequest.end_date));
  };

  const shouldRenderLeave = (date: Date, leaveRequest: LeaveRequest) => {
    const leaveInterval = {
      start: new Date(leaveRequest.start_date),
      end: new Date(leaveRequest.end_date),
    };
    return isWithinInterval(date, leaveInterval);
  };
    useEffect(() => {
        if (!weekHeaderRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.target.previousElementSibling) {
                    const isStuck = entry.intersectionRatio < 1;
                    entry.target.classList.toggle('is-stuck', isStuck);

                    if (isStuck && entry.boundingClientRect.top <= 40) {
                        const prevMonthHeaders = document.querySelectorAll('.week-header.is-stuck');
                        prevMonthHeaders.forEach(header => {
                            if (header !== entry.target) {
                                (header as HTMLElement).style.opacity = '0';
                            }
                        });
                    } else {
                        const prevMonthHeaders = document.querySelectorAll('.week-header');
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

        observer.observe(weekHeaderRef.current);

        return () => {
            if (weekHeaderRef.current) {
                observer.unobserve(weekHeaderRef.current);
            }
        };
    }, []);

  return (
    <section className="w-full" data-current={isCurrent}>
          <div
              ref={weekHeaderRef}
        className={`week-header sticky top-40 z-20 bg-white bg-opacity-95 border-b border-gray-200 py-2 px-4 font-bold text-gray-800 transition-all duration-200 ${
          isCurrent ? 'bg-blue-50' : ''
        }`}
      >
        Week {weekNumber} - {monthName} {year}
          {isCurrent && <span className="text-blue-500 text-sm font-normal ml-2">(Current)</span>}
      </div>
      <div className="grid grid-cols-7 gap-px border-b border-gray-200">
        {calendarDays.map((currentDate) => {
          const day = currentDate.getDate();
          const isToday = new Date().toDateString() === currentDate.toDateString();
          const isWeekend = getDayOfWeek(day, month, year) === 5 || getDayOfWeek(day, month, year) === 6;
          const dayLeaveRequests = leaveRequests.filter((request) =>
            shouldRenderLeave(currentDate, request)
          );

          return (
            <div
              key={currentDate.toDateString()}
              className={`min-h-[85px] p-2 relative border border-gray-100 ${
                isToday ? 'bg-blue-50' : isWeekend ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <div
                className={`text-sm mb-1 ${
                  isToday
                    ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center'
                    : ''
                }`}
              >
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

export default WeekView;
