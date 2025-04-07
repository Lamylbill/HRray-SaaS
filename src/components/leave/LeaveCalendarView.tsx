
import React, { useState, useEffect } from 'react';
import { addDays, format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { PremiumCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-custom/Card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';

interface LeaveEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: string;
  employee: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  color: string;
}

interface PublicHoliday {
  id: string;
  name: string;
  date: Date;
  country: string;
}

interface ShiftEvent {
  id: string;
  employee: string;
  start: Date;
  end: Date;
  name?: string;
}

export const LeaveCalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [leaveEvents, setLeaveEvents] = useState<LeaveEvent[]>([]);
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
  const [shiftEvents, setShiftEvents] = useState<ShiftEvent[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<LeaveEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, viewMode]);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, we would fetch from Supabase
      // For now, let's use dummy data

      // Mock leave events
      const mockLeaveEvents: LeaveEvent[] = [
        {
          id: '1',
          title: 'Annual Leave',
          start: addDays(currentDate, -1),
          end: addDays(currentDate, 1),
          type: 'Annual Leave',
          employee: 'Sarah Johnson',
          status: 'Approved',
          color: '#3b82f6',
        },
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
      ];

      // Mock holidays
      const mockHolidays: PublicHoliday[] = [
        {
          id: '1',
          name: 'National Day',
          date: addDays(currentDate, 5),
          country: 'SG',
        },
      ];

      // Mock shifts
      const mockShifts: ShiftEvent[] = [
        {
          id: '1',
          employee: 'David Kim',
          start: new Date(currentDate.setHours(9, 0, 0, 0)),
          end: new Date(currentDate.setHours(17, 0, 0, 0)),
          name: 'Morning Shift',
        },
      ];

      setLeaveEvents(mockLeaveEvents);
      setPublicHolidays(mockHolidays);
      setShiftEvents(mockShifts);
      setPendingRequests(mockLeaveEvents.filter(e => e.status === 'Pending'));
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
    // In a real implementation, fetch from Supabase
    // For now, use dummy data
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
      // In a real implementation, this would update the database
      // For now, just update the local state
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
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      // Handle month navigation
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setCurrentDate(newDate);
    }
  };

  const navigateNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      // Handle month navigation
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setCurrentDate(newDate);
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Generate days for the current week view
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start from Monday
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getEventStyle = (event: LeaveEvent) => {
    switch (event.status) {
      case 'Approved':
        return { backgroundColor: event.color, color: 'white', borderRadius: '4px', padding: '1px 6px' };
      case 'Pending':
        return { backgroundColor: 'transparent', color: event.color, border: `1px dashed ${event.color}`, borderRadius: '4px', padding: '0px 6px' };
      case 'Rejected':
        return { backgroundColor: 'transparent', color: 'gray', border: '1px solid gray', borderRadius: '4px', padding: '0px 6px', textDecoration: 'line-through' };
      default:
        return {};
    }
  };

  const isPublicHoliday = (date: Date) => {
    return publicHolidays.some(holiday => 
      format(holiday.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const getPublicHoliday = (date: Date) => {
    return publicHolidays.find(holiday => 
      format(holiday.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
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
            {viewMode === 'week' 
              ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
              : format(currentDate, 'MMMM yyyy')}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex border rounded-md overflow-hidden">
            <Button 
              variant={viewMode === 'week' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="rounded-none"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button 
              variant={viewMode === 'month' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="rounded-none"
              onClick={() => setViewMode('month')}
            >
              Month
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

      <PremiumCard>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="calendar-view">
              {viewMode === 'week' ? (
                <div className="grid grid-cols-7 gap-2">
                  {/* Day headers */}
                  {days.map((day, i) => (
                    <div 
                      key={i} 
                      className={`text-center p-2 font-medium ${isWeekend(day) ? 'text-gray-500' : 'text-gray-700'} 
                      ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'bg-blue-50 rounded-md' : ''}`}
                    >
                      <div>{format(day, 'EEE')}</div>
                      <div className={`text-lg ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'text-blue-600 font-bold' : ''}`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  ))}
                  
                  {/* Day cells with events */}
                  {days.map((day, i) => {
                    const dayEvents = leaveEvents.filter(event => 
                      format(event.start, 'yyyy-MM-dd') <= format(day, 'yyyy-MM-dd') &&
                      format(event.end, 'yyyy-MM-dd') >= format(day, 'yyyy-MM-dd')
                    );
                    
                    const holiday = getPublicHoliday(day);
                    
                    return (
                      <div 
                        key={`cell-${i}`} 
                        className={`min-h-[120px] border rounded-md p-2 
                          ${isWeekend(day) ? 'bg-gray-50' : 'bg-white'}
                          ${isPublicHoliday(day) ? 'bg-red-50' : ''}
                          ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'border-blue-300' : 'border-gray-200'}
                        `}
                      >
                        {holiday && (
                          <div className="text-xs font-medium text-red-700 bg-red-100 rounded px-2 py-0.5 mb-1">
                            {holiday.name}
                          </div>
                        )}

                        {dayEvents.map(event => (
                          <div 
                            key={event.id} 
                            className="text-xs mb-1 truncate"
                            style={getEventStyle(event)}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>{event.employee}: {event.type}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    <div className="font-bold">{event.type}</div>
                                    <div>Employee: {event.employee}</div>
                                    <div>Status: {event.status}</div>
                                    <div>
                                      {format(event.start, 'MMM d')} - {format(event.end, 'MMM d, yyyy')}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-8">
                  Month view would be implemented here with a similar structure
                </div>
              )}
            </div>
          )}
        </CardContent>
      </PremiumCard>

      {/* Pending Leaves Sidebar */}
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
                        {((new Date(request.end).getTime() - new Date(request.start).getTime()) / (1000 * 60 * 60 * 24) + 1)} days
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
