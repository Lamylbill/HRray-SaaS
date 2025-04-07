import React, { useState, useEffect } from 'react';
import { addMonths, format, parseISO, differenceInDays, addDays, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { PremiumCard, CardContent } from '@/components/ui-custom/Card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { LeaveEvent, PublicHoliday, EventStyleProps } from './interfaces';

export const LeaveCalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'1month' | '2months'>('1month');
  const [leaveEvents, setLeaveEvents] = useState<LeaveEvent[]>([]);
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<LeaveEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCalendarData();
    fetchPublicHolidays();
  }, [currentDate]);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const fetchPublicHolidays = async () => {
    try {
      const year = currentDate.getFullYear();
      
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
      
      if (existingHolidays && existingHolidays.length > 0) {
        setPublicHolidays(existingHolidays.map(h => ({
          ...h,
          date: new Date(h.date)
        })));
        return;
      }
      
      const { data, error: funcError } = await supabase.functions.invoke('fetch-public-holidays', {
        body: { year, country: 'SG' }
      });
      
      if (funcError) {
        console.error('Error fetching holidays:', funcError);
        return;
      }
      
      if (data && data.data) {
        setPublicHolidays(data.data.map(h => ({
          ...h,
          date: new Date(h.date)
        })));
      }
    } catch (error) {
      console.error('Error fetching public holidays:', error);
    }
  };

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      const { data: leaveRequestsData, error: leaveError } = await supabase
        .from('leave_requests')
        .select(`
          id,
          start_date,
          end_date,
          status,
          half_day,
          half_day_type,
          employees(id, full_name),
          leave_types(id, name, color)
        `);
      
      if (leaveError) {
        throw leaveError;
      }
      
      const formattedLeaveEvents: LeaveEvent[] = (leaveRequestsData || [])
        .map(leave => {
          const start = leave.start_date ? new Date(leave.start_date) : null;
          const end = leave.end_date ? new Date(leave.end_date) : null;
      
          if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
            console.warn("Invalid date in leave record:", leave);
            return null;
          }
      
          return {
            id: leave.id,
            title: leave.leave_types.name,
            start,
            end,
            type: leave.leave_types.name,
            employee: leave.employees?.full_name || 'Unknown Employee',
            status: leave.status as 'Pending' | 'Approved' | 'Rejected',
            color: leave.leave_types.color,
          };
        })
        .filter(Boolean); // Remove nulls

      
      setLeaveEvents(formattedLeaveEvents);
      setPendingRequests(formattedLeaveEvents.filter(e => e.status === 'Pending'));
      
    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load calendar data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    const mockPendingRequests: LeaveEvent[] = [
      {
        id: '2',
        title: 'Sick Leave',
        start: addDays(currentDate, 2),
        end: addDays(currentDate, 3),
        type: 'Sick Leave',
        employee: 'Michael Chen',
        status: 'Pending',
        color: '#ef4444',
      },
      {
        id: '3',
        title: 'Annual Leave',
        start: addDays(currentDate, 4),
        end: addDays(currentDate, 6),
        type: 'Annual Leave',
        employee: 'Priya Patel',
        status: 'Pending',
        color: '#3b82f6',
      },
    ];

    setPendingRequests(mockPendingRequests);
  };

  const handleApproveReject = async (id: string, action: 'Approved' | 'Rejected') => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ 
          status: action,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setPendingRequests(prev => prev.filter(request => request.id !== id));
      setLeaveEvents(prev => 
        prev.map(event => 
          event.id === id ? { ...event, status: action } : event
        )
      );

      toast({
        title: `Request ${action}`,
        description: `The leave request has been ${action === 'Approved' ? 'approved' : 'rejected'}.`,
        duration: 3000,
      });
      
      loadCalendarData();
      
    } catch (error) {
      console.error(`Error ${action.toLowerCase()} leave request:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action.toLowerCase()} leave request`,
        variant: 'destructive',
      });
    }
  };

  const navigatePrevious = () => {
    setCurrentDate(prev => addMonths(prev, -1));
  };

  const navigateNext = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const renderLeaveEvents = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const eventsForDay = leaveEvents.filter(event => {
      return isWithinInterval(date, {
        start: event.start,
        end: event.end
      });
    });

    eventsForDay.sort((a, b) => {
      const statusPriority = { 'Approved': 0, 'Pending': 1, 'Rejected': 2 };
      return statusPriority[a.status] - statusPriority[b.status];
    });

    return eventsForDay.map((event, index) => {
      const isFirstDay = format(event.start, 'yyyy-MM-dd') === dateStr;
      const isLastDay = format(event.end, 'yyyy-MM-dd') === dateStr;
      const totalDays = differenceInDays(event.end, event.start) + 1;
      const isMultiDay = totalDays > 1;
      
      let style: EventStyleProps = {
        backgroundColor: event.status === 'Approved' ? event.color : 'transparent',
        color: event.status === 'Approved' ? 'white' : event.color,
        borderRadius: '2px',
        padding: '1px 4px',
        fontSize: '0.7rem',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        marginBottom: '2px',
        marginTop: index === 0 ? '2px' : '0',
        border: event.status === 'Approved' ? 'none' : `1px dashed ${event.color}`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
      };
      
      if (isMultiDay) {
        if (isFirstDay) {
          style = {
            ...style,
            borderTopLeftRadius: '4px',
            borderBottomLeftRadius: '4px',
            borderTopRightRadius: '0',
            borderBottomRightRadius: '0',
            borderRight: 'none',
            paddingLeft: '6px',
          };
        } else if (isLastDay) {
          style = {
            ...style,
            borderTopLeftRadius: '0',
            borderBottomLeftRadius: '0',
            borderTopRightRadius: '4px',
            borderBottomRightRadius: '4px',
            borderLeft: 'none',
            paddingRight: '6px',
          };
        } else {
          style = {
            ...style,
            borderRadius: '0',
            borderLeft: 'none',
            borderRight: 'none',
          };
        }
      }
      
      if (event.status === 'Rejected') {
        style = {
          ...style,
          textDecoration: 'line-through',
          opacity: 0.7,
        };
      }
      
      return (
        <TooltipProvider key={`${event.id}-${dateStr}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div style={style}>
                {(isFirstDay || !isMultiDay) && (
                  <span>
                    {event.employee.split(' ')[0]} - {event.type}
                    {isMultiDay && ` (${totalDays}d)`}
                  </span>
                )}
                {!isFirstDay && isMultiDay && <span>⬤</span>}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <div className="font-bold">{event.type}</div>
                <div>Employee: {event.employee}</div>
                <div>Status: {event.status}</div>
                <div>
                  {format(event.start, 'MMM d')} - {format(event.end, 'MMM d, yyyy')}
                  {` (${totalDays} day${totalDays > 1 ? 's' : ''})`}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    });
  };

  const getHolidayForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return publicHolidays.find(holiday => 
      format(holiday.date, 'yyyy-MM-dd') === dateStr
    );
  };

  const renderCalendarDay = (day: Date, selectedDays: Date[], props: any) => {
    const holiday = getHolidayForDate(day);
    
    return (
      <div 
        {...props}
        className={`${props.className} relative h-32 overflow-y-auto`}
      >
        <div className="absolute top-1 right-1 text-sm">
          {format(day, 'd')}
        </div>
        
        {holiday && (
          <div className="mt-5 mb-1 text-xs font-medium text-red-700 bg-red-100 rounded px-1 py-0.5 text-center">
            {holiday.name}
          </div>
        )}
        
        <div className="mt-6 space-y-1 overflow-y-auto max-h-24">
          {renderLeaveEvents(day)}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={navigateToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex border rounded-md overflow-hidden">
            <Button 
              variant={viewMode === '1month' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="rounded-none"
              onClick={() => setViewMode('1month')}
            >
              1 Month
            </Button>
            <Button 
              variant={viewMode === '2months' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="rounded-none"
              onClick={() => setViewMode('2months')}
            >
              2 Months
            </Button>
          </div>
          {pendingRequests.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
              onClick={() => setSidebarOpen(true)}
            >
              {pendingRequests.length} Pending
            </Button>
          )}
        </div>
      </div>

      <div className="w-full h-full">
        {isLoading ? (
          <div className="flex justify-center items-center h-[700px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="calendar-container w-full overflow-hidden" style={{ 
            height: viewMode === '1month' ? 'calc(100vh - 280px)' : 'calc(100vh - 200px)',
            minHeight: viewMode === '1month' ? '700px' : '900px'
          }}>
            <div className="calendar-view">
              <Calendar
                mode="range"
                numberOfMonths={viewMode === '1month' ? 1 : 2}
                className="w-full border-0 p-0"
                month={currentDate}
                onMonthChange={setCurrentDate}
                disabled={() => false}
                selected={undefined}
                onSelect={() => {}}
                components={{
                  Day: ({ day, selectedDay, ...props }) => renderCalendarDay(day, selectedDay || [], props)
                }}
              />
              
              {viewMode === '2months' && (
                <Calendar
                  mode="range"
                  month={addMonths(currentDate, 1)}
                  onMonthChange={(date) => setCurrentDate(addMonths(date, -1))}
                  className="w-full border-0 p-0 mt-6"
                  disabled={() => false}
                  selected={undefined}
                  onSelect={() => {}}
                  components={{
                    Day: ({ day, selectedDay, ...props }) => renderCalendarDay(day, selectedDay || [], props)
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Pending Leave Requests</SheetTitle>
            <SheetDescription>
              {pendingRequests.length} leave requests pending your approval
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-8 space-y-4">
            {pendingRequests.map(request => (
              <div key={request.id} className="border rounded-md p-4 bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{request.employee}</h4>
                    <div className="text-sm text-gray-600">{request.type}</div>
                    <div className="text-sm mt-1">
                      {format(request.start, 'MMM d')} - {format(request.end, 'MMM d, yyyy')}
                      <Badge className="ml-2" variant="outline" style={{color: request.color, borderColor: request.color}}>
                        {differenceInDays(request.end, request.start) + 1} days
                      </Badge>
                    </div>
                  </div>
                  <Badge>Pending</Badge>
                </div>
                
                <div className="mt-4 flex justify-end space-x-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleApproveReject(request.id, 'Rejected')}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApproveReject(request.id, 'Approved')}
                  >
                    Approve
                  </Button>
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
