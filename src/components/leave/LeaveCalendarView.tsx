
import React, { useState, useEffect, useRef } from 'react';
import {
  format, isToday, isSameMonth, 
  startOfWeek, addDays, startOfMonth, getMonth, getYear, endOfMonth,
  isSameDay, set, parseISO
} from 'date-fns';
import { Info, Plus, Filter, Check } from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AddLeaveForm } from './AddLeaveForm';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { LeaveEvent, PublicHoliday } from './interfaces';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const safeFormat = (date: Date | null | undefined, fmt: string): string =>
  date instanceof Date && !isNaN(date.getTime()) ? format(date, fmt) : '';

interface CalendarProps {
  selectedLeaveTypes: string[];
  onLeaveTypeFilter: (types: string[]) => void;
}

export const LeaveCalendarView: React.FC<CalendarProps> = ({ selectedLeaveTypes, onLeaveTypeFilter }) => {
  const [isAddLeaveOpen, setIsAddLeaveOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<LeaveEvent | null>(null);
  const [visibleMonths, setVisibleMonths] = useState<Date[]>([]);
  const [events, setEvents] = useState<LeaveEvent[]>([]);
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isInitialLoad = useRef(true);
  const [leaveTypes, setLeaveTypes] = useState<{id: string, name: string}[]>([]);
  const [isFilteringTypes, setIsFilteringTypes] = useState(false);
  const { toast } = useToast();

  // Initialize calendar with current month and surrounding months
  useEffect(() => {
    const today = new Date();
    const initialMonths = [];
    
    // Add previous, current, and next months
    for (let i = -12; i <= 12; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() + i, 1);
      initialMonths.push(month);
    }
    
    setVisibleMonths(initialMonths);
  }, []);

  // Scroll to current month when component mounts
  useEffect(() => {
    if (isInitialLoad.current && calendarContainerRef.current && visibleMonths.length > 0) {
      setTimeout(() => {
        const currentMonthElement = document.getElementById(`month-${getYear(new Date())}-${getMonth(new Date())}`);
        if (currentMonthElement) {
          currentMonthElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          isInitialLoad.current = false;
        }
      }, 500);
    }
  }, [visibleMonths]);

  // Fetch leave types when component mounts
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('leave_types')
          .select('id, name');
        
        if (error) throw error;
        
        if (data) {
          setLeaveTypes(data);
        }
      } catch (error) {
        console.error('Error fetching leave types:', error);
      }
    };
    
    fetchLeaveTypes();
  }, []);

  // Initialize the intersection observer for infinite scrolling
  useEffect(() => {
    if (!observerRef.current && visibleMonths.length > 0) {
      observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const monthId = entry.target.id;
            if (!monthId) return;
            
            const [_, yearStr, monthStr] = monthId.split('-');
            if (!yearStr || !monthStr) return;
            
            const year = parseInt(yearStr, 10);
            const month = parseInt(monthStr, 10);
            
            if (isNaN(year) || isNaN(month)) return;
            
            const monthDate = new Date(year, month);
            
            // Load more months if we're near the edges of our date range
            if (visibleMonths.length > 0) {
              if (month === getMonth(visibleMonths[0]) && year === getYear(visibleMonths[0])) {
                loadMoreMonths('before');
              } else if (visibleMonths.length > 1 && 
                        month === getMonth(visibleMonths[visibleMonths.length - 1]) && 
                        year === getYear(visibleMonths[visibleMonths.length - 1])) {
                loadMoreMonths('after');
              }
            }
          }
        });
      }, { threshold: 0.1 });
    
      // Observe all month containers
      document.querySelectorAll('.month-container').forEach(monthElement => {
        if (monthElement) {
          observerRef.current?.observe(monthElement);
        }
      });
    }
  }, [visibleMonths]);
  
  // Re-observe month containers when visible months change
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      
      document.querySelectorAll('.month-container').forEach(monthElement => {
        observerRef.current?.observe(monthElement);
      });
    }
  }, [visibleMonths]);
  
  const loadMoreMonths = (direction: 'before' | 'after') => {
    if (loadingMore) return;
    
    setLoadingMore(true);
    
    setVisibleMonths(prevMonths => {
      if (prevMonths.length === 0) {
        const today = new Date();
        return [today];
      }
      
      if (direction === 'before') {
        const firstMonth = prevMonths[0];
        const newMonths = [];
        
        for (let i = 1; i <= 3; i++) {
          newMonths.push(new Date(firstMonth.getFullYear(), firstMonth.getMonth() - i, 1));
        }
        
        return [...newMonths.reverse(), ...prevMonths];
      } else {
        const lastMonth = prevMonths[prevMonths.length - 1];
        const newMonths = [];
        
        for (let i = 1; i <= 3; i++) {
          newMonths.push(new Date(lastMonth.getFullYear(), lastMonth.getMonth() + i, 1));
        }
        
        return [...prevMonths, ...newMonths];
      }
    });
    
    setTimeout(() => {
      setLoadingMore(false);
    }, 500);
  };
  
  // Create day cells for a month
  const renderMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    
    // Generate an array of dates for each day in the month view
    const calendarDays = [];
    let day = startDate;
    
    // Generate 6 weeks to ensure all months fit
    for (let week = 0; week < 6; week++) {
      for (let i = 0; i < 7; i++) {
        calendarDays.push(day);
        day = addDays(day, 1);
      }
    }
    
    return (
      <div 
        id={`month-${getYear(monthDate)}-${getMonth(monthDate)}`} 
        className="month-container py-2 flex flex-col" 
        key={`${getYear(monthDate)}-${getMonth(monthDate)}`}
      >
        <div className="text-xl font-semibold px-2 mb-2 sticky top-0 bg-white py-2 z-10">
          {format(monthStart, 'MMMM yyyy')}
        </div>
        
        <div className="grid grid-cols-7 mb-2 sticky top-12 bg-white py-1 z-10">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <div 
              key={index} 
              className="text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-4">
          {calendarDays.map((day, dayIdx) => (
            <CalendarDay 
              key={dayIdx} 
              day={day} 
              monthDate={monthDate}
              events={events}
              holidays={publicHolidays}
              onEventClick={(event) => {
                setSelectedEvent(event);
                setIsDetailsOpen(true);
              }}
              onDateClick={(date) => {
                setSelectedDate(date);
                setIsAddLeaveOpen(true);
              }}
            />
          ))}
        </div>
      </div>
    );
  };
  
  // Fetch leave and holiday data from Supabase
  useEffect(() => {
    const fetchCalendarData = async () => {
      setIsLoading(true);
      try {
        // Fetch leave requests
        const { data: leaveData, error: leaveError } = await supabase
          .from('leave_requests')
          .select(`
            id,
            employee_id,
            employees:employee_id(id, full_name),
            start_date,
            end_date,
            leave_type_id,
            leave_types:leave_type_id(id, name, color),
            half_day,
            half_day_type,
            status
          `)
          .order('start_date', { ascending: true });
          
        if (leaveError) throw leaveError;
        
        // Fetch public holidays
        const { data: holidayData, error: holidayError } = await supabase
          .from('public_holidays')
          .select('*')
          .order('date', { ascending: true });
          
        if (holidayError) throw holidayError;
        
        // Transform leave data into calendar events
        const transformedLeaveData = leaveData?.map(leave => {
          if (!leave.start_date || !leave.end_date) return null;
          
          const start = parseISO(leave.start_date);
          const end = parseISO(leave.end_date);
          
          return {
            id: leave.id,
            title: `${leave.leave_types?.name || 'Leave'} - ${leave.employees?.full_name || 'Employee'}`,
            start,
            end,
            type: leave.leave_types?.name || 'Unknown',
            employee: leave.employees?.full_name || 'Unknown Employee',
            status: leave.status as 'Pending' | 'Approved' | 'Rejected',
            color: leave.leave_types?.color || '#999'
          };
        }).filter(Boolean) as LeaveEvent[];
        
        // Transform holiday data
        const transformedHolidayData = holidayData?.map(holiday => {
          if (!holiday.date) return null;
          
          return {
            id: holiday.id,
            name: holiday.name,
            date: parseISO(holiday.date),
            country: holiday.country
          };
        }).filter(Boolean) as PublicHoliday[];
        
        setEvents(transformedLeaveData || []);
        setPublicHolidays(transformedHolidayData || []);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
        toast({
          title: "Error",
          description: "Failed to load calendar data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCalendarData();
  }, []);

  // Filter events when selected leave types change
  useEffect(() => {
    const fetchFilteredLeaves = async () => {
      if (selectedLeaveTypes.length === 0) {
        // If no types selected, fetch all
        const { data: leaveData, error: leaveError } = await supabase
          .from('leave_requests')
          .select(`
            id,
            employee_id,
            employees:employee_id(id, full_name),
            start_date,
            end_date,
            leave_type_id,
            leave_types:leave_type_id(id, name, color),
            half_day,
            half_day_type,
            status
          `)
          .order('start_date', { ascending: true });
          
        if (leaveError) throw leaveError;
        
        const transformedLeaveData = leaveData?.map(leave => {
          if (!leave.start_date || !leave.end_date) return null;
          
          const start = parseISO(leave.start_date);
          const end = parseISO(leave.end_date);
          
          return {
            id: leave.id,
            title: `${leave.leave_types?.name || 'Leave'} - ${leave.employees?.full_name || 'Employee'}`,
            start,
            end,
            type: leave.leave_types?.name || 'Unknown',
            employee: leave.employees?.full_name || 'Unknown Employee',
            status: leave.status as 'Pending' | 'Approved' | 'Rejected',
            color: leave.leave_types?.color || '#999'
          };
        }).filter(Boolean) as LeaveEvent[];
        
        setEvents(transformedLeaveData || []);
        return;
      }

      setIsFilteringTypes(true);
      try {
        const { data: leaveData, error: leaveError } = await supabase
          .from('leave_requests')
          .select(`
            id,
            employee_id,
            employees:employee_id(id, full_name),
            start_date,
            end_date,
            leave_type_id,
            leave_types:leave_type_id(id, name, color),
            half_day,
            half_day_type,
            status
          `)
          .in('leave_type_id', selectedLeaveTypes)
          .order('start_date', { ascending: true });
          
        if (leaveError) throw leaveError;
        
        const transformedLeaveData = leaveData?.map(leave => {
          if (!leave.start_date || !leave.end_date) return null;
          
          const start = parseISO(leave.start_date);
          const end = parseISO(leave.end_date);
          
          return {
            id: leave.id,
            title: `${leave.leave_types?.name || 'Leave'} - ${leave.employees?.full_name || 'Employee'}`,
            start,
            end,
            type: leave.leave_types?.name || 'Unknown',
            employee: leave.employees?.full_name || 'Unknown Employee',
            status: leave.status as 'Pending' | 'Approved' | 'Rejected',
            color: leave.leave_types?.color || '#999'
          };
        }).filter(Boolean) as LeaveEvent[];
        
        setEvents(transformedLeaveData || []);
      } catch (error) {
        console.error('Error filtering leave types:', error);
        toast({
          title: "Error",
          description: "Failed to filter leave types",
          variant: "destructive",
        });
      } finally {
        setIsFilteringTypes(false);
      }
    };
    
    fetchFilteredLeaves();
  }, [selectedLeaveTypes]);

  const getLeaveTypeSelected = (typeId: string) => {
    return selectedLeaveTypes.includes(typeId);
  };

  const toggleLeaveType = (typeId: string) => {
    if (selectedLeaveTypes.includes(typeId)) {
      onLeaveTypeFilter(selectedLeaveTypes.filter(id => id !== typeId));
    } else {
      onLeaveTypeFilter([...selectedLeaveTypes, typeId]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-20 pb-2">
        <div>
          <h3 className="text-lg font-medium">Leave Calendar</h3>
        </div>
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={`${selectedLeaveTypes.length > 0 ? 'bg-blue-50 border-blue-200' : ''}`}
                disabled={isFilteringTypes}
              >
                <Filter className={`mr-2 h-4 w-4 ${isFilteringTypes ? 'animate-spin' : ''}`} />
                Filter Types {selectedLeaveTypes.length > 0 && `(${selectedLeaveTypes.length})`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Leave Types</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {leaveTypes.map(type => (
                <DropdownMenuCheckboxItem 
                  key={type.id}
                  checked={getLeaveTypeSelected(type.id)} 
                  onCheckedChange={() => toggleLeaveType(type.id)}
                >
                  {type.name}
                </DropdownMenuCheckboxItem>
              ))}
              {leaveTypes.length === 0 && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No leave types found
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            size="sm" 
            onClick={() => {
              setSelectedDate(new Date());
              setIsAddLeaveOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Leave
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-4 p-4">
          <Skeleton className="h-6 w-1/3 mb-2" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, dayIdx) => (
                <Skeleton key={dayIdx} className="h-24 w-full" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div 
          ref={calendarContainerRef} 
          className="flex-1 overflow-y-auto space-y-6 px-1 pb-4 relative"
          style={{ height: 'calc(100vh - 250px)' }}
        >
          {visibleMonths.map(month => renderMonth(month))}
          
          {loadingMore && (
            <div className="py-4 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"></div>
              <span className="ml-2">Loading more...</span>
            </div>
          )}
        </div>
      )}
      
      <Sheet open={isAddLeaveOpen} onOpenChange={setIsAddLeaveOpen}>
        <SheetContent size="lg">
          <SheetHeader>
            <SheetTitle>Request Leave</SheetTitle>
            <SheetDescription>
              Create a new leave request for {selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : 'selected date'}.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <AddLeaveForm 
              initialDate={selectedDate}
              onSuccess={() => {
                setIsAddLeaveOpen(false);
                toast({
                  title: "Leave Request Submitted",
                  description: "Your leave request has been submitted for approval.",
                });
                // Refresh calendar data
                // We would need to implement this
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
      
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent size="lg">
          <SheetHeader>
            <SheetTitle>Leave Details</SheetTitle>
          </SheetHeader>
          {selectedEvent && (
            <div className="py-4">
              <div className="mb-4">
                <div className="text-sm text-muted-foreground mb-1">Employee</div>
                <div className="font-medium">{selectedEvent.employee}</div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm text-muted-foreground mb-1">Leave Type</div>
                <Badge style={{ backgroundColor: selectedEvent.color }}>
                  {selectedEvent.type}
                </Badge>
              </div>
              
              <div className="mb-4">
                <div className="text-sm text-muted-foreground mb-1">Status</div>
                <Badge variant={
                  selectedEvent.status === 'Approved' ? 'success' : 
                  selectedEvent.status === 'Rejected' ? 'destructive' : 'outline'
                }>
                  {selectedEvent.status}
                </Badge>
              </div>
              
              <div className="mb-4">
                <div className="text-sm text-muted-foreground mb-1">Duration</div>
                <div className="font-medium">
                  {format(selectedEvent.start, 'MMM dd, yyyy')} - {format(selectedEvent.end, 'MMM dd, yyyy')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.ceil((selectedEvent.end.getTime() - selectedEvent.start.getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                </div>
              </div>
              
              <div className="mt-6">
                <div className="text-sm text-muted-foreground mb-2">Actions</div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

interface CalendarDayProps {
  day: Date;
  monthDate: Date;
  events: LeaveEvent[];
  holidays: PublicHoliday[];
  onEventClick: (event: LeaveEvent) => void;
  onDateClick: (date: Date) => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ 
  day, monthDate, events, holidays, onEventClick, onDateClick 
}) => {
  const isDayToday = isToday(day);
  const isCurrentMonth = isSameMonth(day, monthDate);
  
  // Filter events for this day
  const dayEvents = events.filter(event => 
    isSameDay(day, event.start) || 
    isSameDay(day, event.end) || 
    (day > event.start && day < event.end)
  );
  
  // Check if day is a holiday
  const holiday = holidays.find(h => isSameDay(day, h.date));
  
  return (
    <div 
      className={`
        min-h-[100px] p-1 border rounded-md relative flex flex-col
        ${isDayToday ? 'bg-blue-50 border-blue-200' : ''}
        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
        hover:bg-gray-50 transition-colors
      `}
      onClick={() => onDateClick(day)}
    >
      <div 
        className={`
          text-right text-sm font-medium mb-1 sticky top-0
          ${isDayToday ? 'text-blue-600' : ''}
        `}
      >
        {format(day, 'd')}
      </div>
      
      {holiday && (
        <div className="mb-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs truncate w-full justify-start bg-red-50 text-red-600 border-red-200">
                  <Info className="h-3 w-3 mr-1" />
                  {holiday.name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{holiday.name}</p>
                <p className="text-xs text-muted-foreground">Public Holiday</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      
      <div className="space-y-1 flex-1 overflow-y-auto max-h-[70px]">
        {dayEvents.map((event, index) => (
          <div 
            key={`${event.id}-${index}`}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick(event);
            }}
            className={`
              text-xs p-1 rounded cursor-pointer truncate
              ${event.status === 'Approved' ? 'opacity-100' : 'opacity-70'}
            `}
            style={{ backgroundColor: event.color, color: '#fff' }}
          >
            {event.employee}: {event.type}
          </div>
        ))}
      </div>
      
      {dayEvents.length > 2 && (
        <div className="mt-1">
          <Progress 
            value={100} 
            indicatorColor={dayEvents.some(e => e.status === 'Approved') ? 'bg-blue-500' : 'bg-gray-300'} 
            className="h-1"
          />
        </div>
      )}
    </div>
  );
};
