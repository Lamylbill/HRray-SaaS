
import React, { useState, useEffect } from 'react';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import { INITIAL_EVENTS, createEventId } from './event-utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/context/AuthContext';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import { LeaveType } from './interfaces';

interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  halfDay: boolean;
  halfDayType: 'start' | 'end' | null;
  status: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeColor: string;
}

interface LeaveTypeResponse {
  id: string;
  name: string;
  color: string;
}

interface EmployeeResponse {
  full_name: string;
}

export function MonthCalendarView() {
  const [weekendsVisible, setWeekendsVisible] = useState(true)
  const [currentEvents, setCurrentEvents] = useState<Event[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    fetchEvents(currentYear, currentMonth);
  }, []);

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const authorizedClient = getAuthorizedClient();
        const { data, error } = await authorizedClient
          .from('leave_types')
          .select('*')
          .order('name');

        if (error) throw error;
        setLeaveTypes(data || []);
      } catch (error) {
        console.error('Error fetching leave types:', error);
      }
    };

    fetchLeaveTypes();
  }, []);

  const renderEventContent = (eventInfo: any) => {
    return (
      <>
        <b>{eventInfo.timeText}</b>
        <span>{eventInfo.event.title}</span>
      </>
    )
  }

  const handleDateSelect = (selectInfo: any) => {
    setIsDialogOpen(true);
    setStartDate(selectInfo.startStr);
    setEndDate(selectInfo.endStr);
  }

  const handleEventClick = (clickInfo: any) => {
    if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
      clickInfo.event.remove()
    }
  }

  const handleEvents = (events: any) => {
    setCurrentEvents(events)
  }

  const toggleWeekends = () => {
    setWeekendsVisible(!weekendsVisible)
  }

  const addLeaveRequest = async () => {
    if (!user) {
      toast({
        title: 'Unauthorized',
        description: 'You must be logged in to submit a leave request.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedLeaveType || !startDate || !endDate) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const authorizedClient = getAuthorizedClient();
      const { data, error } = await authorizedClient
        .from('leave_requests')
        .insert([
          {
            employee_id: user.id,
            leave_type_id: selectedLeaveType,
            start_date: startDate,
            end_date: endDate,
            status: 'Pending',
          },
        ]);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Leave request submitted successfully!',
      });

      setIsDialogOpen(false);
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      fetchEvents(currentYear, currentMonth);
    } catch (error: any) {
      console.error('Error submitting leave request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit leave request.',
        variant: 'destructive',
      });
    }
  };

  const fetchEvents = async (year: number, month: number) => {
    setIsLoading(true);
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const authorizedClient = getAuthorizedClient();
      const { data, error } = await authorizedClient
        .from('leave_requests')
        .select(`
          id, start_date, end_date, half_day, half_day_type, status,
          employee_id, employee:employee_id (full_name),
          leave_type_id, leave_type:leave_type_id (id, name, color)
        `)
        .gte('start_date', startDate.toISOString().split('T')[0])
        .lte('end_date', endDate.toISOString().split('T')[0])
        .in('status', ['Approved', 'Pending']);
      
      if (error) throw error;
      
      const formattedEvents = data.map((event: any) => ({
        id: event.id,
        title: event.employee?.full_name || 'Unknown Employee',
        start: event.start_date,
        end: event.end_date,
        halfDay: event.half_day,
        halfDayType: event.half_day_type,
        status: event.status,
        employeeId: event.employee_id,
        leaveTypeId: event.leave_type_id,
        leaveTypeName: event.leave_type?.name || 'Unknown',
        leaveTypeColor: event.leave_type?.color || '#cccccc',
      }));
      
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching leave events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='demo-app'>
      <div className='demo-app-top'>
        <Button onClick={toggleWeekends}>toggle weekends</Button>&nbsp;
      </div>
      <div className='demo-app-calendar'>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          initialView='dayGridMonth'
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={weekendsVisible}
          events={events}
          select={handleDateSelect}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          eventsSet={handleEvents}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Leave Request</DialogTitle>
            <DialogDescription>
              Submit a leave request for review.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leaveType" className="text-right">
                Leave Type
              </Label>
              <Select onValueChange={setSelectedLeaveType} defaultValue={selectedLeaveType} >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                End Date
              </Label>
              <Input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <Button onClick={addLeaveRequest}>Submit Leave Request</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
