import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import { LeaveRequest } from '../leave-calendar/interfaces';
import MonthView from '../leave-calendar/MonthView';
import WeekdayHeader from '../leave-calendar/WeekdayHeader';
import BackToTodayButton from '../leave-calendar/BackToTodayButton';
import { ScrollArea } from '@/components/ui/scroll-area';

const LeaveCalendarView: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleMonths, setVisibleMonths] = useState<{ month: number; year: number }[]>([]);
  const [renderedMonthRange, setRenderedMonthRange] = useState<{ start: number; end: number }>({ start: -12, end: 12 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const bottomTriggerRef = useRef<HTMLDivElement>(null);
  const topTriggerRef = useRef<HTMLDivElement>(null);
  const [showBackToToday, setShowBackToToday] = useState(false);

  const generateMonthsRange = useCallback((startOffset: number, endOffset: number) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const months = [];
    for (let i = startOffset; i <= endOffset; i++) {
      const monthOffset = currentMonth + i;
      const yearOffset = Math.floor(monthOffset / 12);
      const month = ((monthOffset % 12) + 12) % 12;
      const year = currentYear + yearOffset;
      
      months.push({ month, year });
    }
    
    return months;
  }, []);

  useEffect(() => {
    setVisibleMonths(generateMonthsRange(renderedMonthRange.start, renderedMonthRange.end));
  }, [generateMonthsRange, renderedMonthRange]);

  const loadMoreMonths = useCallback((direction: 'past' | 'future') => {
    setRenderedMonthRange(prev => {
      if (direction === 'past') {
        return { start: prev.start - 12, end: prev.end };
      } else {
        return { start: prev.start, end: prev.end + 12 };
      }
    });
  }, []);

  useEffect(() => {
    if (!bottomTriggerRef.current || !topTriggerRef.current) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

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

    bottomObserver.observe(bottomTriggerRef.current);
    topObserver.observe(topTriggerRef.current);

    return () => {
      bottomObserver.disconnect();
      topObserver.disconnect();
    };
  }, [loadMoreMonths]);

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      setLoading(true);
      try {
        const client = getAuthorizedClient();
        
        const startMonth = visibleMonths[0];
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
      }
    };

    if (getAuthorizedClient() && visibleMonths.length > 0) {
      fetchLeaveRequests();
    } else {
      setLoading(false);
    }
  }, [visibleMonths]);

  const scrollToCurrentMonth = useCallback(() => {
    if (!scrollRef.current) return;

    const currentMonthElement = scrollRef.current.querySelector('[data-current="true"]');
    if (currentMonthElement) {
      const headerHeight = 40;
      const offset = currentMonthElement.getBoundingClientRect().top + 
                    scrollRef.current.scrollTop - 
                    headerHeight - 80;
      
      scrollRef.current.scrollTo({
        top: offset,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    const currentMonthElement = target.querySelector('[data-current="true"]');
    
    if (currentMonthElement) {
      const rect = currentMonthElement.getBoundingClientRect();
      const isCurrentMonthVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
      setShowBackToToday(!isCurrentMonthVisible);
    }
  }, []);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const isCurrentMonth = (month: number, year: number) => {
    const now = new Date();
    return month === now.getMonth() && year === now.getFullYear();
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <WeekdayHeader />
      <div ref={topTriggerRef} className="h-4 w-full" />
      
      <div 
        ref={scrollRef} 
        className="h-[calc(100vh-220px)] overflow-y-auto pb-10 relative"
      >
        {loading && visibleMonths.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-center">Loading calendar data...</p>
          </div>
        ) : (
          <div className="relative">
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
          </div>
        )}
        
        <div ref={bottomTriggerRef} className="h-4 w-full" />
      </div>

      <BackToTodayButton 
        onClick={scrollToCurrentMonth}
        isVisible={showBackToToday}
      />
    </div>
  );
};

export default LeaveCalendarView;
