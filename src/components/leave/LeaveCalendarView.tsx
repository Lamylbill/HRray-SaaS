
import React, { useState, useEffect, useRef } from 'react';
import { addMonths, format, differenceInDays, isWithinInterval, startOfWeek, addDays, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LeaveEvent, PublicHoliday, EventStyleProps } from './interfaces';

const safeFormat = (date: Date | null | undefined, fmt: string): string =>
  date instanceof Date && !isNaN(date.getTime()) ? format(date, fmt) : '';

export const LeaveCalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visibleMonths, setVisibleMonths] = useState<Date[]>([]);
  const [leaveEvents, setLeaveEvents] = useState<LeaveEvent[]>([]);
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<LeaveEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const weekdayHeaderRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generate range of months to display
  const generateVisibleMonths = (centerDate: Date, count: number = 5) => {
    const months: Date[] = [];
    const halfCount = Math.floor(count / 2);
    
    for (let i = -halfCount; i <= halfCount; i++) {
      months.push(i === 0 ? centerDate : addMonths(centerDate, i));
    }
    
    return months;
  };

  // Initialize visible months on component mount
  useEffect(() => {
    setVisibleMonths(generateVisibleMonths(currentDate));
  }, []);

  const navigateToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setVisibleMonths(generateVisibleMonths(today));
    
    // Scroll to today's month (middle of the view)
    if (calendarContainerRef.current) {
      const monthElements = calendarContainerRef.current.querySelectorAll('.month-container');
      if (monthElements.length > 0) {
        const middleIndex = Math.floor(monthElements.length / 2);
        monthElements[middleIndex].scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const navigatePrevious = () => {
    const prevMonth = subMonths(currentDate, 1);
    setCurrentDate(prevMonth);
    setVisibleMonths(generateVisibleMonths(prevMonth));
  };

  const navigateNext = () => {
    const nextMonth = addMonths(currentDate, 1);
    setCurrentDate(nextMonth);
    setVisibleMonths(generateVisibleMonths(nextMonth));
  };

  // Handle infinite scroll loading
  const handleScroll = () => {
    if (!calendarContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = calendarContainerRef.current;
    const scrollThreshold = 300; // px from top/bottom to trigger loading more months
    
    // Load more months when scrolling near the top
    if (scrollTop < scrollThreshold) {
      // Add months to the top (earlier months)
      const earliestMonth = visibleMonths[0];
      const newMonths = [subMonths(earliestMonth, 2), subMonths(earliestMonth, 1), ...visibleMonths];
      setVisibleMonths(newMonths);
      
      // Maintain scroll position after adding content
      if (calendarContainerRef.current) {
        calendarContainerRef.current.scrollTop = scrollTop + 400; // Approximate height of added content
      }
    }
    
    // Load more months when scrolling near the bottom
    if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
      // Add months to the bottom (later months)
      const latestMonth = visibleMonths[visibleMonths.length - 1];
      const newMonths = [...visibleMonths, addMonths(latestMonth, 1), addMonths(latestMonth, 2)];
      setVisibleMonths(newMonths);
    }
  };

  // Set up scrolling event handler
  useEffect(() => {
    const container = calendarContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [visibleMonths]);

  useEffect(() => {
    loadCalendarData();
    fetchPublicHolidays();
  }, [currentDate]);

  useEffect(() => {
    setPendingRequests(leaveEvents.filter(e => e.status === 'Pending'));
  }, [leaveEvents]);

  const fetchPublicHolidays = async () => {
    try {
      const year = currentDate.getFullYear();
      const { data: existingHolidays, error } = await supabase
        .from('public_holidays')
        .select('*')
        .eq('country', 'SG')
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`);

      if (error) return console.error('Error checking for holidays:', error);
      if (existingHolidays?.length) {
        setPublicHolidays(existingHolidays.map(h => ({ ...h, date: new Date(h.date) })));
        return;
      }

      const { data, error: funcError } = await supabase.functions.invoke('fetch-public-holidays', {
        body: { year, country: 'SG' }
      });
      if (funcError) return console.error('Error fetching holidays:', funcError);
      if (data?.data) setPublicHolidays(data.data.map(h => ({ ...h, date: new Date(h.date) })));
    } catch (error) {
      console.error('Error fetching public holidays:', error);
    }
  };

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          id, start_date, end_date, status, half_day, half_day_type,
          employees(id, full_name),
          leave_types(id, name, color)
        `);

      if (error) throw error;

      const formatted = (data || []).map(leave => {
        const start = new Date(leave.start_date);
        const end = new Date(leave.end_date);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
        return {
          id: leave.id,
          title: leave.leave_types?.name || 'Leave',
          start,
          end,
          type: leave.leave_types?.name || 'Unknown',
          employee: leave.employees?.full_name || 'Unknown Employee',
          status: leave.status,
          color: leave.leave_types?.color || '#999'
        };
      }).filter(Boolean) as LeaveEvent[];

      setLeaveEvents(formatted);
    } catch (err) {
      console.error('Error loading calendar data:', err);
      toast({ title: 'Error', description: 'Failed to load calendar data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderLeaveEvents = (date: Date) => {
    const dateStr = safeFormat(date, 'yyyy-MM-dd');
    const events = leaveEvents.filter(event =>
      isWithinInterval(date, { start: event.start, end: event.end })
    );
    events.sort((a, b) => ({ Approved: 0, Pending: 1, Rejected: 2 }[a.status] - { Approved: 0, Pending: 1, Rejected: 2 }[b.status]));

    return events.map((event, index) => {
      const isFirst = safeFormat(event.start, 'yyyy-MM-dd') === dateStr;
      const isLast = safeFormat(event.end, 'yyyy-MM-dd') === dateStr;
      const totalDays = differenceInDays(event.end, event.start) + 1;
      const isMulti = totalDays > 1;

      let style: EventStyleProps = {
        backgroundColor: event.status === 'Approved' ? event.color : 'transparent',
        color: event.status === 'Approved' ? 'white' : event.color,
        borderRadius: '2px',
        padding: '1px 4px',
        fontSize: '0.7rem',
        border: event.status === 'Approved' ? 'none' : `1px dashed ${event.color}`,
        display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        marginBottom: '2px', marginTop: index === 0 ? '2px' : '0'
      };

      if (isMulti) {
        if (isFirst) Object.assign(style, { borderTopRightRadius: '0', borderBottomRightRadius: '0', borderRight: 'none', paddingLeft: '6px' });
        else if (isLast) Object.assign(style, { borderTopLeftRadius: '0', borderBottomLeftRadius: '0', borderLeft: 'none', paddingRight: '6px' });
        else Object.assign(style, { borderRadius: '0', borderLeft: 'none', borderRight: 'none' });
      }

      if (event.status === 'Rejected') Object.assign(style, { textDecoration: 'line-through', opacity: 0.7 });

      return (
        <TooltipProvider key={`${event.id}-${dateStr}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div style={style}>
                {(isFirst || !isMulti) && <span>{event.employee.split(' ')[0]} - {event.type}{isMulti && ` (${totalDays}d)`}</span>}
                {!isFirst && isMulti && <span>⬤</span>}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <div className="font-bold">{event.type}</div>
                <div>Employee: {event.employee}</div>
                <div>Status: {event.status}</div>
                <div>{safeFormat(event.start, 'MMM d')} – {safeFormat(event.end, 'MMM d, yyyy')} ({totalDays} day{totalDays > 1 ? 's' : ''})</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    });
  };

  const getHolidayForDate = (date: Date) => publicHolidays.find(h => format(h.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));

  const renderCalendarDayCell = (date: Date) => {
    if (!date || isNaN(date.getTime())) return <div className="p-2 text-xs text-gray-400">Invalid date</div>;
    const holiday = getHolidayForDate(date);

    return (
      <div className="relative h-32 overflow-y-auto">
        <div className="absolute top-1 right-1 text-sm">{safeFormat(date, 'd')}</div>
        {holiday && <div className="mt-5 mb-1 text-xs font-medium text-red-700 bg-red-100 rounded px-1 py-0.5 text-center">{holiday.name}</div>}
        <div className="mt-6 space-y-1 overflow-y-auto max-h-24">{renderLeaveEvents(date)}</div>
      </div>
    );
  };

  // Create weekday header
  const WeekdayHeader = () => {
    const weekStart = startOfWeek(new Date());
    const weekdays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    
    return (
      <div ref={weekdayHeaderRef} className="grid grid-cols-7 w-full border-b pb-2 mb-2 sticky top-0 bg-white z-10 h-10">
        {weekdays.map((day, i) => (
          <div key={i} className="text-center font-medium text-gray-700">
            {format(day, 'EEE')}
          </div>
        ))}
      </div>
    );
  };

  const renderMonth = (month: Date, index: number) => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    // Get start of first week and end of last week
    const startDate = startOfWeek(firstDay);
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    // Create days array
    const days: Date[] = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Group days into weeks
    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div key={`${month.getFullYear()}-${month.getMonth()}`} className="month-container mb-8" id={`month-${month.getFullYear()}-${month.getMonth()}`}>
        <h3 className="text-lg font-semibold mb-4 px-2">{format(month, 'MMMM yyyy')}</h3>
        <div className="grid grid-cols-7 gap-1">
          {weeks.map((week, weekIndex) => (
            week.map((day, dayIndex) => (
              <div 
                key={`${weekIndex}-${dayIndex}`} 
                className={`border p-1 ${
                  day.getMonth() !== month.getMonth() ? 'bg-gray-50 text-gray-400' : 'bg-white'
                } ${
                  safeFormat(day, 'yyyy-MM-dd') === safeFormat(new Date(), 'yyyy-MM-dd') ? 'ring-2 ring-hrflow-blue ring-opacity-50' : ''
                }`}
              >
                {renderCalendarDayCell(day)}
              </div>
            ))
          ))}
        </div>
      </div>
    );
  };

  const CalendarHeader = () => (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={navigateToday}>Today</Button>
        <Button variant="outline" size="icon" onClick={navigatePrevious}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" onClick={navigateNext}><ChevronRight className="h-4 w-4" /></Button>
        <h3 className="text-lg font-semibold">{format(currentDate, 'MMMM yyyy')}</h3>
      </div>
      <div className="flex items-center space-x-2">
        {pendingRequests.length > 0 && (
          <Button variant="outline" size="sm" className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" onClick={() => setSidebarOpen(true)}>
            {pendingRequests.length} Pending
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <CalendarHeader />
      <div 
        className="w-full flex-1 flex flex-col" 
        style={{ height: 'calc(100vh - 280px)', minHeight: '700px' }}
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="calendar-container w-full flex-1 overflow-hidden flex flex-col">
            <WeekdayHeader />
            <div 
              className="calendar-view h-full overflow-auto" 
              ref={calendarContainerRef}
            >
              <div className="flex flex-col">
                {visibleMonths.map(renderMonth)}
              </div>
            </div>
          </div>
        )}
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Pending Leave Requests</SheetTitle>
            <SheetDescription>{pendingRequests.length} leave requests pending your approval</SheetDescription>
          </SheetHeader>
          <div className="mt-8 space-y-4">
            {pendingRequests.map(request => (
              <div key={request.id} className="border rounded-md p-4 bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{request.employee}</h4>
                    <div className="text-sm text-gray-600">{request.type}</div>
                    <div className="text-sm mt-1">
                      {safeFormat(request.start, 'MMM d')} - {safeFormat(request.end, 'MMM d, yyyy')}
                      <Badge className="ml-2" variant="outline" style={{ color: request.color, borderColor: request.color }}>
                        {differenceInDays(request.end, request.start) + 1} days
                      </Badge>
                    </div>
                  </div>
                  <Badge>Pending</Badge>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleApproveReject(request.id, 'Rejected')}>Reject</Button>
                  <Button variant="default" size="sm" onClick={() => handleApproveReject(request.id, 'Approved')}>Approve</Button>
                </div>
              </div>
            ))}
            {pendingRequests.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Info className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 font-medium">No Pending Requests</h3>
                <p className="text-sm">All leave requests have been processed</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

function handleApproveReject(id: string, status: 'Approved' | 'Rejected') {
  // Implementation would go here - this is a stub to fix the build error
  console.log(`Setting request ${id} to ${status}`);
}
