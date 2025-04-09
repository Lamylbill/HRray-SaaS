
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  addMonths, subMonths, format, differenceInDays, isWithinInterval, 
  startOfWeek, addDays, startOfMonth, getMonth, getYear, endOfMonth,
  isSameDay, set, parseISO
} from 'date-fns';
import { Info, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LeaveEvent, PublicHoliday, EventStyleProps, LeaveType } from './interfaces';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AddLeaveForm } from './AddLeaveForm';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check } from 'lucide-react';

const safeFormat = (date: Date | null | undefined, fmt: string): string =>
  date instanceof Date && !isNaN(date.getTime()) ? format(date, fmt) : '';

export const LeaveCalendarView = () => {
  const [visibleMonths, setVisibleMonths] = useState<Date[]>([]);
  const [leaveEvents, setLeaveEvents] = useState<LeaveEvent[]>([]);
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<LeaveEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addLeaveDialogOpen, setAddLeaveDialogOpen] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState<string | null>(null);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const { toast } = useToast();
  
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const weekdayHeaderRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isInitialLoad = useRef(true);
  
  // Initialize visible months on component mount
  useEffect(() => {
    const today = new Date();
    const months: Date[] = [];
    
    // Generate months for 5 years before and after current date
    for (let i = -60; i <= 60; i++) {
      months.push(addMonths(today, i));
    }
    
    setVisibleMonths(months);
    isInitialLoad.current = false;
  }, []);

  // Scroll to current month when component mounts
  useEffect(() => {
    if (isInitialLoad.current && calendarContainerRef.current && visibleMonths.length) {
      setTimeout(() => {
        const currentMonthElement = document.getElementById(`month-${getYear(new Date())}-${getMonth(new Date())}`);
        if (currentMonthElement) {
          currentMonthElement.scrollIntoView({ block: 'start', behavior: 'auto' });
        }
      }, 100);
    }
  }, [visibleMonths]);
  
  // Load calendar data when the component mounts
  useEffect(() => {
    loadCalendarData();
    fetchPublicHolidays();
    fetchLeaveTypes();
  }, []);

  // Update pending requests when leave events change
  useEffect(() => {
    setPendingRequests(leaveEvents.filter(e => e.status === 'Pending'));
  }, [leaveEvents]);
  
  // Fetch leave types for filtering
  const fetchLeaveTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_types')
        .select('id, name, color')
        .order('name');
        
      if (error) throw error;
      setLeaveTypes(data || []);
    } catch (err: any) {
      console.error('Error fetching leave types:', err);
      toast({
        title: 'Error',
        description: 'Failed to load leave types',
        variant: 'destructive',
      });
    }
  };
  
  // Setup infinite scroll with Intersection Observer
  const setupInfiniteScroll = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    const options = {
      root: calendarContainerRef.current,
      rootMargin: '1000px 0px',
      threshold: 0.1
    };
    
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const monthId = entry.target.id;
          const [_, yearStr, monthStr] = monthId.split('-');
          const year = parseInt(yearStr, 10);
          const month = parseInt(monthStr, 10);
          const monthDate = new Date(year, month);
          
          // Load more months if we're near the edges of our date range
          if (month === getMonth(visibleMonths[0]) && year === getYear(visibleMonths[0])) {
            loadMoreMonths('before');
          } else if (month === getMonth(visibleMonths[visibleMonths.length - 1]) && 
                    year === getYear(visibleMonths[visibleMonths.length - 1])) {
            loadMoreMonths('after');
          }
        }
      });
    }, options);
    
    // Observe all month containers
    document.querySelectorAll('.month-container').forEach(monthElement => {
      observerRef.current?.observe(monthElement);
    });
  }, [visibleMonths]);
  
  // Setup intersection observers when visible months change
  useEffect(() => {
    if (visibleMonths.length > 0) {
      setupInfiniteScroll();
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [visibleMonths, setupInfiniteScroll]);
  
  // Load more months in the specified direction
  const loadMoreMonths = (direction: 'before' | 'after') => {
    if (loadingMore) return;
    
    setLoadingMore(true);
    
    setVisibleMonths(prevMonths => {
      if (direction === 'before') {
        const firstMonth = prevMonths[0];
        const newMonths = [];
        for (let i = 1; i <= 24; i++) {
          newMonths.push(subMonths(firstMonth, i));
        }
        return [...newMonths.reverse(), ...prevMonths];
      } else {
        const lastMonth = prevMonths[prevMonths.length - 1];
        const newMonths = [];
        for (let i = 1; i <= 24; i++) {
          newMonths.push(addMonths(lastMonth, i));
        }
        return [...prevMonths, ...newMonths];
      }
    });
    
    setTimeout(() => setLoadingMore(false), 300);
  };

  const fetchPublicHolidays = async () => {
    try {
      const year = new Date().getFullYear();
      const { data: existingHolidays, error } = await supabase
        .from('public_holidays')
        .select('*')
        .eq('country', 'SG')
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`);

      if (error) {
        console.error('Error checking for holidays:', error);
        return;
      }
      
      if (existingHolidays?.length) {
        setPublicHolidays(existingHolidays.map(h => ({ ...h, date: new Date(h.date) })));
        return;
      }

      try {
        const { data, error: funcError } = await supabase.functions.invoke('fetch-public-holidays', {
          body: { year, country: 'SG' }
        });
        
        if (funcError) {
          console.error('Error fetching holidays:', funcError);
          return;
        }
        
        if (data?.data) {
          setPublicHolidays(data.data.map((h: any) => ({ ...h, date: new Date(h.date) })));
        }
      } catch (error) {
        console.error('Error fetching public holidays:', error);
      }
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
          employees:employee_id (id, full_name),
          leave_types:leave_type_id (id, name, color)
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

  // Filter leaves by leave type
  const filterByLeaveType = async (typeId: string | null) => {
    setIsFilterLoading(true);
    setSelectedLeaveType(typeId);
    
    try {
      let query = supabase
        .from('leave_requests')
        .select(`
          id, start_date, end_date, status, half_day, half_day_type,
          employees:employee_id (id, full_name),
          leave_types:leave_type_id (id, name, color)
        `);
        
      // Apply filter if a specific leave type is selected
      if (typeId) {
        query = query.eq('leave_type_id', typeId);
      }
      
      const { data, error } = await query;
      
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
      
      toast({
        title: typeId ? 'Filter Applied' : 'Filter Cleared',
        description: typeId 
          ? `Showing leaves of type: ${leaveTypes.find(t => t.id === typeId)?.name}`
          : 'Showing all leave types',
      });
      
    } catch (err) {
      console.error('Error filtering leave data:', err);
      toast({ 
        title: 'Filter Error', 
        description: 'Failed to apply leave type filter', 
        variant: 'destructive' 
      });
    } finally {
      setIsFilterLoading(false);
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

  const getHolidayForDate = (date: Date) => publicHolidays.find(h => 
    isSameDay(new Date(h.date), date)
  );

  const renderCalendarDayCell = (date: Date) => {
    if (!date || isNaN(date.getTime())) return <div className="p-2 text-xs text-gray-400">Invalid date</div>;
    const holiday = getHolidayForDate(date);
    const isToday = isSameDay(date, new Date());

    return (
      <div className={`relative h-32 overflow-y-auto ${isToday ? 'bg-blue-50/30' : ''}`}>
        <div className={`absolute top-1 right-1 text-sm ${isToday ? 'font-bold text-blue-600' : ''}`}>
          {safeFormat(date, 'd')}
        </div>
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
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    // Get start of first week and end of last week
    const startDate = startOfWeek(monthStart);
    const endDate = startOfWeek(monthEnd);
    endDate.setDate(endDate.getDate() + 6);
    
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

    const idStr = `month-${month.getFullYear()}-${month.getMonth()}`;
    
    return (
      <div key={idStr} className="month-container mb-8" id={idStr}>
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

  const handleLeaveAdded = () => {
    loadCalendarData();
    setAddLeaveDialogOpen(false);
    toast({
      title: "Leave Added",
      description: "Leave request has been successfully created",
      duration: 3000,
    });
  };

  const handleApproveReject = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: `Leave ${status}`,
        description: `Leave request has been ${status.toLowerCase()}`,
        duration: 3000,
      });
      
      // Refresh data
      loadCalendarData();
      setSidebarOpen(false);
    } catch (err) {
      console.error(`Error ${status.toLowerCase()}ing leave:`, err);
      toast({
        title: "Error",
        description: `Failed to ${status.toLowerCase()} leave request`,
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="primary" size="sm" onClick={() => setAddLeaveDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Leave
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={isFilterLoading}
                className={selectedLeaveType ? "border-blue-400 text-blue-600" : ""}
              >
                <Filter className="mr-2 h-4 w-4" /> 
                {isFilterLoading ? "Loading..." : selectedLeaveType 
                  ? `Type: ${leaveTypes.find(t => t.id === selectedLeaveType)?.name}` 
                  : "Filter Types"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Leave Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => filterByLeaveType(null)}>
                All Types
                {!selectedLeaveType && <Check className="ml-2 h-4 w-4" />}
              </DropdownMenuItem>
              {leaveTypes.map((type) => (
                <DropdownMenuItem key={type.id} onClick={() => filterByLeaveType(type.id)}>
                  <span className="flex items-center">
                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: type.color }} />
                    {type.name}
                  </span>
                  {selectedLeaveType === type.id && <Check className="ml-2 h-4 w-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center space-x-2">
          {pendingRequests.length > 0 && (
            <Button variant="outline" size="sm" className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" onClick={() => setSidebarOpen(true)}>
              {pendingRequests.length} Pending
            </Button>
          )}
        </div>
      </div>
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

      <Dialog open={addLeaveDialogOpen} onOpenChange={setAddLeaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Leave Request</DialogTitle>
            <DialogDescription>Create a new leave request for an employee</DialogDescription>
          </DialogHeader>
          <AddLeaveForm onSuccess={handleLeaveAdded} onCancel={() => setAddLeaveDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};
