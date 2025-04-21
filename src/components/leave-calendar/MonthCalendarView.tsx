
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import { format, startOfMonth, addMonths, getMonth, getYear, getDaysInMonth, isSameDay, isWithinInterval } from 'date-fns';
import WeekdayHeader from './WeekdayHeader';
import BackToTodayButton from './BackToTodayButton';
import { LeaveRequest } from './interfaces';
import LeaveItem from './LeaveItem';

const MonthCalendarView: React.FC = () => {
  const [visibleMonths, setVisibleMonths] = useState<{ month: number, year: number }[]>([]);
  const [showBackToToday, setShowBackToToday] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomObserverRef = useRef<HTMLDivElement>(null);
  const topObserverRef = useRef<HTMLDivElement>(null);
  
  // Generate initial 6 months starting from 3 months ago 
  const generateInitialMonths = useCallback(() => {
    const today = new Date();
    const startMonth = new Date(today.getFullYear(), today.getMonth() - 3, 1); // Start 3 months ago
    
    const initialMonths = [];
    for (let i = 0; i < 6; i++) {
      const monthDate = addMonths(startMonth, i);
      initialMonths.push({
        month: getMonth(monthDate),
        year: getYear(monthDate)
      });
    }
    return initialMonths;
  }, []);

  // Generate months to add when scrolling up or down
  const generateMoreMonths = useCallback((direction: 'past' | 'future', count: number = 3) => {
    if (visibleMonths.length === 0) return [];
    
    const newMonths = [];
    if (direction === 'past') {
      const firstMonth = visibleMonths[0];
      const startDate = new Date(firstMonth.year, firstMonth.month - count, 1);
      
      for (let i = count - 1; i >= 0; i--) {
        const monthDate = addMonths(startDate, i);
        newMonths.push({
          month: getMonth(monthDate),
          year: getYear(monthDate)
        });
      }
    } else {
      const lastMonth = visibleMonths[visibleMonths.length - 1];
      const startDate = new Date(lastMonth.year, lastMonth.month + 1, 1);
      
      for (let i = 0; i < count; i++) {
        const monthDate = addMonths(startDate, i);
        newMonths.push({
          month: getMonth(monthDate),
          year: getYear(monthDate)
        });
      }
    }
    
    return newMonths;
  }, [visibleMonths]);

  useEffect(() => {
    setVisibleMonths(generateInitialMonths());
  }, [generateInitialMonths]);

  useEffect(() => {
    if (visibleMonths.length === 0) return;
    
    const fetchLeaveRequests = async () => {
      setLoading(true);
      try {
        const client = getAuthorizedClient();
        
        // Determine date range from all visible months
        const firstMonth = visibleMonths[0];
        const lastMonth = visibleMonths[visibleMonths.length - 1];
        
        const startDate = new Date(firstMonth.year, firstMonth.month, 1);
        const endDate = new Date(lastMonth.year, lastMonth.month + 1, 0); // Last day of the last month
        
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
        
        console.log(`Fetched ${formattedData.length} leave requests for date range:`, { startDateString, endDateString });
        setLeaveRequests(formattedData);
      } catch (error) {
        console.error('Error fetching leave requests:', error);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    };
    
    if (getAuthorizedClient()) {
      fetchLeaveRequests();
    } else {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [visibleMonths]);

  const loadMoreMonths = useCallback((direction: 'past' | 'future') => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    const newMonths = generateMoreMonths(direction);
    
    if (direction === 'past') {
      setVisibleMonths(prev => [...newMonths, ...prev]);
    } else {
      setVisibleMonths(prev => [...prev, ...newMonths]);
    }
  }, [generateMoreMonths, isLoadingMore]);

  // Set up intersection observers for infinite scroll
  useEffect(() => {
    const bottomObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreMonths('future');
        }
      },
      { threshold: 0.1 }
    );
    
    const topObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreMonths('past');
        }
      },
      { threshold: 0.1 }
    );
    
    if (bottomObserverRef.current) {
      bottomObserver.observe(bottomObserverRef.current);
    }
    
    if (topObserverRef.current) {
      topObserver.observe(topObserverRef.current);
    }
    
    return () => {
      if (bottomObserverRef.current) {
        bottomObserver.unobserve(bottomObserverRef.current);
      }
      if (topObserverRef.current) {
        topObserver.unobserve(topObserverRef.current);
      }
    };
  }, [loadMoreMonths]);

  // Scroll to current month on first load
  useEffect(() => {
    if (isFirstLoad && !loading && visibleMonths.length > 0) {
      const today = new Date();
      const currentMonthYear = { month: today.getMonth(), year: today.getFullYear() };
      
      const currentMonthElement = document.querySelector(`[data-month="${currentMonthYear.month}"][data-year="${currentMonthYear.year}"]`);
      
      if (currentMonthElement && scrollContainerRef?.current) {
        currentMonthElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setIsFirstLoad(false);
      }
    }
  }, [visibleMonths, loading, isFirstLoad]);

  // Monitor scroll to show/hide back to today button
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

  const scrollToCurrentMonth = useCallback(() => {
    const today = new Date();
    const currentMonthYear = { month: today.getMonth(), year: today.getFullYear() };
    
    // Check if current month is in visible months
    const monthExists = visibleMonths.some(
      m => m.month === currentMonthYear.month && m.year === currentMonthYear.year
    );
    
    // If not, add current month to visible months
    if (!monthExists) {
      setVisibleMonths(prev => {
        const newMonths = [...prev, currentMonthYear];
        newMonths.sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
        });
        return newMonths;
      });
    }
    
    // Wait a bit to ensure the DOM has updated
    setTimeout(() => {
      const currentMonthElement = document.querySelector(
        `[data-month="${currentMonthYear.month}"][data-year="${currentMonthYear.year}"]`
      );
      
      if (currentMonthElement && scrollContainerRef?.current) {
        currentMonthElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, [visibleMonths]);

  const isCurrentMonth = (month: number, year: number): boolean => {
    const today = new Date();
    return today.getMonth() === month && today.getFullYear() === year;
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <WeekdayHeader />
      
      <div ref={scrollContainerRef} className="h-[calc(100vh-220px)] overflow-y-auto pb-10 relative">
        {loading && visibleMonths.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-center">Loading calendar data...</p>
          </div>
        ) : (
          <>
            <div ref={topObserverRef} className="h-1" />
            
            {visibleMonths.map(({ month, year }, index) => (
              <MonthView
                key={`${year}-${month}`}
                month={month}
                year={year}
                leaveRequests={leaveRequests}
                isFirst={index === 0}
                isCurrent={isCurrentMonth(month, year)}
              />
            ))}
            
            <div ref={bottomObserverRef} className="h-1" />
            
            {isLoadingMore && (
              <div className="py-4 flex justify-center">
                <p className="text-gray-500">Loading more months...</p>
              </div>
            )}
          </>
        )}
      </div>
      
      <BackToTodayButton onClick={scrollToCurrentMonth} isVisible={showBackToToday} />
    </div>
  );
};

// Month View Component
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
  const monthHeaderRef = useRef<HTMLDivElement>(null);
  
  const monthName = format(new Date(year, month), 'MMMM yyyy');
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  // Create array for all days in month
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  // Create array for empty cells before first day of month
  const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isWeekend = (day: number): boolean => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
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

  // Sticky month header effect
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
      className="w-full"
      data-month={month}
      data-year={year}
      data-current={isCurrent}
    >
      <div 
        ref={monthHeaderRef}
        className={`month-header sticky top-10 z-20 bg-white bg-opacity-95 border-b border-gray-200 py-2 px-4 font-bold text-gray-800 transition-all duration-200 ${
          isCurrent ? 'bg-indigo-50' : ''
        }`}
      >
        {monthName}
        {isCurrent && <span className="text-indigo-600 text-sm font-normal ml-2">(Current)</span>}
      </div>

      <div className="grid grid-cols-7 gap-px border-b border-gray-200">
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="bg-gray-50 min-h-[85px] border border-gray-100" />
        ))}
        
        {calendarDays.map((day) => {
          const currentDate = new Date(year, month, day);
          const dayLeaveRequests = leaveRequests.filter(request => 
            shouldRenderLeave(currentDate, request)
          );

          return (
            <div 
              key={day} 
              className={`min-h-[85px] p-2 relative border border-gray-100 ${
                isToday(day) ? 'bg-indigo-50' : isWeekend(day) ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <div className={`text-sm mb-1 ${
                isToday(day) ? 'bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
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

export default MonthCalendarView;
