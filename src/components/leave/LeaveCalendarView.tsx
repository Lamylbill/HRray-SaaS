import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import { getWeek, startOfWeek, addDays, isThisWeek, getDay, format, isSameDay, isWithinInterval } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LeaveRequest } from '../leave-calendar/interfaces';
import WeekdayHeader from '../leave-calendar/WeekdayHeader';
import BackToTodayButton from '../leave-calendar/BackToTodayButton';
import LeaveItem from '../leave-calendar/LeaveItem';
import { uniq } from 'lodash';
import _ from 'lodash';

const LeaveCalendarView: React.FC = () => {
  const [visibleWeeks, setVisibleWeeks] = useState<{ year: number, month: number, week: number }[]>([]);
  const [showBackToToday, setShowBackToToday] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleMonths, setVisibleMonths] = useState<{ year: number, month: number }[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const generateWeeksRange = useCallback((numberOfWeeks: number) => {
    let visibleMonths: { year: number, month: number }[] = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentWeek = getWeek(today, { weekStartsOn: 1 });
  
    const weeks = [];
    for (let i = numberOfWeeks - 1; i >= 0; i--) {
      let week = currentWeek - i;
      let year = currentYear;
      let month = currentMonth;
      weeks.push({ year, month, week });
      visibleMonths.push({ year, month });
    }

    visibleMonths = uniq(visibleMonths.map(m => `${m.year}-${m.month}`)).map(m => {
        const [year, month] = m.split('-');
        return { year: parseInt(year), month: parseInt(month) };
    });
    setVisibleMonths(visibleMonths);
    return weeks;
  }, []);

  useEffect(() => {
    setVisibleWeeks(generateWeeksRange(25));
  }, [generateWeeksRange]);

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      setLoading(true);
      try {
        const client = getAuthorizedClient();
        const startMonth = visibleWeeks[0];
        const endMonth = visibleMonths[visibleMonths.length - 1];        

        const startDate = new Date(startMonth.year, startMonth.month, 1);
        const endDate = new Date(endMonth.year, endMonth.month + 1, 0);

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

        interface ApiLeaveRequest {
          id: string;
          employee_id: string;
          start_date: string;
          end_date: string;
          status: 'Approved' | 'Pending' | 'Rejected';
          employee: {
            full_name: string;
          };
          leave_type: {
            id: string;
            name: string;
            color: string;
          };
        }

        const formattedData: LeaveRequest[] = data
          ? data.map((item: ApiLeaveRequest) => ({
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
              status: item.status,
            }))
          : [];

        console.log(`Fetched ${formattedData.length} leave requests for date range:`, { startDateString, endDateString });
        setLeaveRequests(formattedData);
      } catch (error) {
        console.error('Error fetching leave requests:', error);
      } finally {
        setLoading(false);
      }
    };

    if (getAuthorizedClient() && visibleWeeks.length > 0) {
      fetchLeaveRequests();
    } else {
      setLoading(false);
    }
  }, [visibleWeeks]);

  const scrollToCurrentWeek = useCallback(() => {
    const currentWeekElement = document.querySelector<HTMLElement>('[data-current="true"]');
    if (currentWeekElement && scrollContainerRef?.current) {
      const headerHeight = 48;
      const offset = currentWeekElement.getBoundingClientRect().top +
                     scrollContainerRef.current.scrollTop -
                     headerHeight;
      scrollContainerRef.current.scrollTo({
        top: offset,
        behavior: 'smooth',
      });
    }
  }, [scrollContainerRef, visibleWeeks]);

  const loadMoreWeeks = useCallback((direction: 'past' | 'future') => {
    if (direction === 'past') {
        setVisibleWeeks(prev => {
            const newWeeks = generateWeeksRange(13).map(({ year, month, week }) => ({
                year, month, week
            }));
            return [...newWeeks, ...prev];
        });
    } else if (direction === 'future'){
      setVisibleWeeks(prev => {
        const lastWeekIndex = prev.length - 1;
        const lastWeek = prev[lastWeekIndex];
        const newWeeks = generateWeeksRange(13).map(({ year, month, week }) => ({
            year, month, week
          }));

        return [...prev, ...newWeeks];
      });
    }
  }, [generateWeeksRange]);

  const isCurrentWeek = (year: number, month: number, week: number): boolean => {
    const today = new Date();
    const todayWeek = getWeek(today, { weekStartsOn: 1 });
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    return todayWeek === week && todayYear === year && todayMonth === month;
  };

  useLayoutEffect(() => {
    if (isFirstLoad) {
      scrollToCurrentWeek();
      setIsFirstLoad(false);
    }
  }, [visibleWeeks, scrollToCurrentWeek, isFirstLoad]);

  useEffect(() => {
    const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMoreWeeks('future');
          }
        },
        { threshold: 0.1 }
    );
    const observerPast = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMoreWeeks('past');
          }
        },
        { threshold: 0.1 }
    );
    const target = document.querySelector('[data-is-last="true"]');
    const targetPast = document.querySelector('[data-is-first="true"]');

    if (target){
      observer.observe(target);
    }
    if (targetPast){
      observerPast.observe(targetPast);
    }

    return () => {
      if(target){
        observer.unobserve(target);
      } 
      if (targetPast){
        observerPast.unobserve(targetPast);
      }
    };
  }, [loadMoreWeeks]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollTop } = scrollContainerRef.current;
        setShowBackToToday(scrollTop > 100);
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <WeekdayHeader />

      <div ref={scrollContainerRef} className="h-[calc(100vh-220px)] overflow-y-auto pb-10 relative">
        {loading && visibleWeeks.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-center">Loading calendar data...</p>
          </div>
        ) : (
          <div className="relative">
            {visibleWeeks.map(({ year, month, week }, index) => (
              <WeekViewComponent
                key={`${year}-${month}-${week}`}
                year={year}
                month={month}
                week={week}
                leaveRequests={leaveRequests}
                isFirst={index === 0}
                isCurrent={isCurrentWeek(year, month, week)}
                data-is-last={index === visibleWeeks.length - 1}
                data-is-first={index === 0}
                data-current={isCurrentWeek(year, month, week)}
              />
            ))}
          </div>
        )}
      </div>
      <BackToTodayButton onClick={scrollToCurrentWeek} isVisible={showBackToToday} />
    </div>
  );
};

interface WeekViewProps {
  year: number;
  month: number;
  week: number;
  leaveRequests: LeaveRequest[];
  isFirst?: boolean;
  isCurrent?: boolean;
}

const WeekViewComponent: React.FC<WeekViewProps> = ({
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
      let monday = getWeek(firstDayOfYear, { weekStartsOn: 1 }) === 1 ? firstDayOfYear : startOfWeek(addDays(firstDayOfYear, daysToAdd), { weekStartsOn: 1 });

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
          isCurrent ? 'bg-indigo-50' : ''
        }`}
      >
        Week {weekNumber} - {monthName} {year}
        {isCurrent && <span className="text-indigo-600 text-sm font-normal ml-2">(Current)</span>}
      </div>

      <div className="grid grid-cols-7 gap-px border-b border-gray-200">
        {calendarDays.map((currentDate) => {
          const day = currentDate.getDate();
          const isToday = new Date().toDateString() === currentDate.toDateString();
          const isWeekend = getDayOfWeek(day, month, year) === 5 || getDayOfWeek(day, month, year) === 6;
          const dayLeaveRequests = leaveRequests.filter((request) => shouldRenderLeave(currentDate, request));
          
          return (
            <div
              key={currentDate.toDateString()}
              className={`min-h-[85px] p-2 relative border border-gray-100 ${
                isToday ? 'bg-indigo-50' : isWeekend ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <div className={`text-sm mb-1 ${
                isToday ? 'bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
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

export default LeaveCalendarView;
