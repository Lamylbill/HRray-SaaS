import React, { useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Employee {
  id: string;
  full_name: string;
  department?: string | null;
}

interface LeaveEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  resourceId: string;
  backgroundColor: string;
}

const EmployeeTimelineView: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [events, setEvents] = useState<LeaveEvent[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const supabase = getAuthorizedClient();
        const { data, error } = await supabase
          .from('employees')
          .select('id, full_name, department')
          .order('full_name');
        if (error) throw error;
        setEmployees(data || []);
        setSelectedEmployees(data?.map(emp => emp.id) || []);
      } catch (err) {
        console.error('Error fetching employees', err);
      }
    };

    const fetchEvents = async () => {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      try {
        const supabase = getAuthorizedClient();
        const { data, error } = await supabase
          .from('leave_requests')
          .select(`id, start_date, end_date, employee_id, status, leave_type:leave_type_id (name, color)`)
          .gte('start_date', startDate.toISOString().split('T')[0])
          .lte('end_date', endDate.toISOString().split('T')[0])
          .in('status', ['Approved', 'Pending']);
        if (error) throw error;

        const formatted = (data || []).map((ev: any) => ({
          id: ev.id,
          title: ev.leave_type?.name || '',
          start: ev.start_date,
          end: ev.end_date,
          resourceId: ev.employee_id,
          backgroundColor: ev.leave_type?.color || '#3b82f6',
        }));
        setEvents(formatted);
      } catch (err) {
        console.error('Error fetching leave events', err);
      }
    };

    fetchEmployees();
    fetchEvents();
  }, []);

  const resources = useMemo(() => {
    const filtered = employees.filter(emp => selectedEmployees.includes(emp.id));
    return filtered.map(emp => ({ id: emp.id, title: emp.full_name }));
  }, [employees, selectedEmployees]);

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    setSelectedEmployees(employees.map(emp => emp.id));
  };

  const handleDeselectAll = () => {
    setSelectedEmployees([]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-64 justify-between">
              Staff Selection ({selectedEmployees.length} selected)
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-sm">Select Staff</h4>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-xs h-6 px-2">
                    All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDeselectAll} className="text-xs h-6 px-2">
                    None
                  </Button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {employees.map(employee => (
                  <div key={employee.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={employee.id}
                      checked={selectedEmployees.includes(employee.id)}
                      onCheckedChange={() => handleEmployeeToggle(employee.id)}
                    />
                    <label htmlFor={employee.id} className="text-sm font-normal cursor-pointer flex-1">
                      {employee.full_name}
                      {employee.department && (
                        <span className="text-gray-500 ml-1">({employee.department})</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <FullCalendar
        plugins={[resourceTimelinePlugin]}
        initialView="resourceTimelineMonth"
        schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
        height="auto"
        resources={resources}
        events={events}
        resourceAreaHeaderContent="Name"
        resourceAreaWidth="150px"
        resourceLabelContent={(arg) => ({
          html: `<div style="font-weight: normal; font-size: 14px;">${arg.resource.title}</div>`
        })}
        eventMinHeight={30}
        eventOverlap={false}
        slotEventOverlap={false}
        eventDidMount={(info) => {
          info.el.style.margin = '0';
          info.el.style.padding = '4px 6px';
          info.el.style.borderRadius = '6px';
          info.el.style.lineHeight = '1.25';
          info.el.style.fontSize = '13px';
          info.el.style.fontWeight = '500';
        }}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: ''
        }}
        slotLabelFormat={{
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        }}
        titleFormat={{
          year: 'numeric',
          month: 'long'
        }}
        dayHeaderFormat={{
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        }}
      />
    </div>
  );
};

export default EmployeeTimelineView;
