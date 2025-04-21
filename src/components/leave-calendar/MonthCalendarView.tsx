import React, { useRef, useState, useEffect, useCallback } from 'react';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import {
  startOfMonth,
  addMonths,
  getMonth,
  getYear,
} from 'date-fns';
import WeekdayHeader from './WeekdayHeader';
import BackToTodayButton from './BackToTodayButton';
import { LeaveRequest } from './interfaces';
import MonthView from './MonthView';

const MonthCalendarView: React.FC = () => {
  const [visibleMonths, setVisibleMonths] = useState<{ month: number; year: number }[]>([]);
  const [showBackToToday, setShowBackToToday] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadingPastMonths, setLoadingPastMonths] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [lastScrollTop, setLastScrollTop] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getCurrentMonthYear = useCallback(() => {
    const today = new Date();
    return { month: getMonth(today), year: getYear(today) };
  }, []);

  const generateInitialMonths = useCallback(() => {
    const today = new Date();
    const startMonth = startOfMonth(addMonths(today, -5));
    const initialMonths = [];
    for (let i = 0; i < 11; i++) {
      const monthDate = addMonths(startMonth, i);
      initialMonths.push({
        month: getMonth(monthDate),
        year: getYear(monthDate),
      });
    }
    return initialMonths.sort((a, b) => a.year - b.year || a.month - b.month);
  }, []);

  const generateMoreMonths = useCallback(
    (direction: 'past' | 'future', count: number = 3) => {
      if (visibleMonths.length === 0) return [];
      const referenceMonth = direction === 'past' ? visibleMonths[0] : visibleMonths[visibleMonths.length - 1];
      const startDate = new Date(referenceMonth.year, referenceMonth.month, 1);
      const delta = direction === 'past' ? -1 : 1;

      const newMonths = [];
      for (let i = 1; i <= count; i++) {
        const monthDate = addMonths(startDate, delta * i);
        newMonths.push({
          month: getMonth(monthDate),
          year: getYear(monthDate),
        });
      }

      return newMonths;
    },
    [visibleMonths]
  );

  const fetchLeaveRequests = useCallback(async () => {
    if (visibleMonths.length === 0) return;
    setLoading(true);
    try {
      const client = getAuthorizedClient();
      const firstMonth = visibleMonths[0];
      const lastMonth = visibleMonths[visibleMonths.length - 1];
      const startDate = new Date(firstMonth.year, firstMonth.month, 1);
      const endDate = new Date(lastMonth.year, lastMonth.month + 1, 0);

      const { data, error } = await client
        .from('leave_requests')
        .select('id, employee_id, start_date, end_date, status, leave_type:leave_type_id(id, name, color), employee:employee_id(full_name)')
        .gte('end_date', startDate.toISOString().split('T')[0])
        .lte('start_date', endDate.toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching leave requests:', error);
      } else {
        const formattedData: LeaveRequest[] = data.map((item) => ({
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
        }));
        setLeaveRequests(formattedData);
      }
    } catch (err) {
      console.error('Error fetching leave requests:', err);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [visibleMonths]);

  const loadMoreMonths = useCallback((direction: 'past' | 'future') => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    const newMonths = generateMoreMonths(direction);
    setVisibleMonths((prev) => {
      const combined = direction === 'past' ? [...newMonths, ...prev] : [...prev, ...newMonths];
      return combined.sort((a, b) => a.year - b.year || a.month - b.month);
    });
  }, [generateMoreMonths, isLoadingMore]);

  const loadPastMonths = useCallback(async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    const newMonths = generateMoreMonths('past');
    setVisibleMonths((prev) =>
      [...newMonths, ...prev].sort((a, b) => a.year - b.year || a.month - b.month)
    );
    setIsLoadingMore(false);
  }, [generateMoreMonths, isLoadingMore]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    setShowBackToToday(scrollTop > 100);
    setScrollDirection(scrollTop > lastScrollTop ? 'down' : 'up');
    setLastScrollTop(scrollTop);

    if (scrollTop + clientHeight >= scrollHeight - 50) {
      loadMoreMonths('future');
    }

    if (scrollTop < 50 && scrollDirection === 'up' && !loadingPastMonths) {
      setLoadingPastMonths(true);
      loadPastMonths().then(() => setLoadingPastMonths(false));
    }
  }, [lastScrollTop, scrollDirection, loadingPastMonths, loadPastMonths, loadMoreMonths]);

  useEffect(() => {
    setVisibleMonths(generateInitialMonths());
  }, [generateInitialMonths]);

  useEffect(() => {
    fetchLeaveRequests();
  }, [visibleMonths, fetchLeaveRequests]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);

  useEffect(() => {
    if (isFirstLoad && !loading && visibleMonths.length > 0) {
      const today = new Date();
      const currentMonthYear = { month: today.getMonth(), year: today.getFullYear() };
      const currentMonthElement = document.querySelector(
        `[data-month="${currentMonthYear.month}"][data-year="${currentMonthYear.year}"]`
      );
      if (currentMonthElement && scrollContainerRef.current) {
        currentMonthElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setIsFirstLoad(false);
      }
    }
  }, [visibleMonths, loading, isFirstLoad]);

  const scrollToCurrentMonth = useCallback(() => {
    const currentMonthYear = getCurrentMonthYear();

    const monthExists = visibleMonths.some(
      (m) => m.month === currentMonthYear.month && m.year === currentMonthYear.year
    );
    if (!monthExists) {
      setVisibleMonths((prev) =>
        [...prev, currentMonthYear].sort((a, b) => a.year - b.year || a.month - b.month)
      );
    }
    setTimeout(() => {
      const currentMonthElement = document.querySelector(
        `[data-month="${currentMonthYear.month}"][data-year="${currentMonthYear.year}"]`
      );
      if (currentMonthElement && scrollContainerRef.current) {
        currentMonthElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, [visibleMonths, getCurrentMonthYear]);

  const isCurrentMonth = (month: number, year: number): boolean => {
    const today = new Date();
    return today.getMonth() === month && today.getFullYear() === year;
  };

  return (
    <div className="w-full flex flex-col h-full">
      <WeekdayHeader />
      <div
        ref={scrollContainerRef}
        className="flex-grow overflow-y-auto border-t border-gray-200"
      >
        {loading && visibleMonths.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-center">Loading calendar data...</p>
          </div>
        ) : (
          <>
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
