import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import { format, startOfMonth, addMonths, getMonth, getYear, getDaysInMonth, isSameDay, isWithinInterval } from 'date-fns';
import WeekdayHeader from './WeekdayHeader';
import BackToTodayButton from './BackToTodayButton';
import { LeaveRequest } from './interfaces';
import LeaveItem from './LeaveItem';
import MonthView from './MonthView';

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
    const startMonth = startOfMonth(addMonths(today, -3)); // Start 3 months ago
    
    const initialMonths = [];
    for (let i = 0; i < 6; i++) {
      const monthDate = addMonths(startMonth, i);
      initialMonths.push({
        month: getMonth(monthDate),
        year: getYear(monthDate)
      });
    }
    
    // Sort months chronologically
    initialMonths.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    
    return initialMonths;
  }, []);

  // Generate months to add when scrolling up or down
  const generateMoreMonths = useCallback((direction: 'past' | 'future', count: number = 3) => {
    if (visibleMonths.length === 0) return [];
    
    const newMonths = [];
    if (direction === 'past') {
      const firstMonth = visibleMonths[0];
      const startDate = new Date(firstMonth.year, firstMonth.month, 1);
      
      for (let i = count; i > 0; i--) {
        const monthDate = addMonths(startDate, -i);
        newMonths.push({
          month: getMonth(monthDate),
          year: getYear(monthDate)
        });
      }
    } else {
      const lastMonth = visibleMonths[visibleMonths.length - 1];
      const startDate = new Date(lastMonth.year, lastMonth.month, 1);
      
      for (let i = 1; i <= count; i++) {
        const monthDate = addMonths(startDate, i);
        newMonths.push({
          month: getMonth(monthDate),
          year: getYear(monthDate)
        });
      }
    }
    
    // Sort months chronologically
    newMonths.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    
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
      setVisibleMonths(prev => {
        const combined = [...newMonths, ...prev];
        // Sort to ensure chronological order
        return combined.sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
        });
      });
    } else {
      setVisibleMonths(prev => {
        const combined = [...prev, ...newMonths];
        // Sort to ensure chronological order
        return combined.sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
        });
      });
    }
  }, [generateMoreMonths, isLoadingMore]);

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

export default MonthCalendarView;
