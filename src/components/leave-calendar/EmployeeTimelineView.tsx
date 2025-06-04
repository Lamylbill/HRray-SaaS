import React, { useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [departmentFilter, setDepartmentFilter] = useState('all');

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
          .select(
            `id, start_date, end_date, employee_id, status,
            leave_type:leave_type_id (name, color)`
          )
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

  const departments = useMemo(() => {
    const values = employees.map(e => e.department).filter(Boolean) as string[];
    return Array.from(new Set(values));
  }, [employees]);

  const resources = useMemo(() => {
    const filtered = departmentFilter === 'all'
      ? employees
      : employees.filter(e => e.department === departmentFilter);
    return filtered.map(emp => ({ id: emp.id, title: emp.full_name }));
  }, [employees, departmentFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(dep => (
              <SelectItem key={dep} value={dep}>{dep}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <FullCalendar
        plugins={[resourceTimelinePlugin]}
        initialView="resourceTimelineMonth"
        resources={resources}
        events={events}
        height="auto"
      />
    </div>
  );
};

export default EmployeeTimelineView;
