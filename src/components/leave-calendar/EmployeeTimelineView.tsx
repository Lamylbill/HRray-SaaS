import React, { useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

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
  isHalfDay?: boolean;
  status?: string;
  employeeName?: string;
  [key: string]: any;
}

const EmployeeTimelineView: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [events, setEvents] = useState<LeaveEvent[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const calendarRef = useRef<any>(null);

  // ---- Highlight today's column with overlay right border ----
  function highlightTodayColumn() {
    // Format today's date
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Remove old highlights and overlays
    document.querySelectorAll('.fc-timeline-today, .fc-timeline-today-overlay').forEach(el => {
      el.classList.remove('fc-timeline-today', 'fc-timeline-today-overlay');
    });
    document.querySelectorAll('.fc-today-border-overlay').forEach(el => el.remove());

    // Add highlight to all header and cell elements for today
    const todayCells = Array.from(document.querySelectorAll(`th[data-date="${todayStr}"], td[data-date="${todayStr}"]`));
    todayCells.forEach(el => el.classList.add('fc-timeline-today'));

    // Overlay right border: for each today cell, append an absolutely-positioned div
    todayCells.forEach((cell: Element) => {
      const overlay = document.createElement('div');
      overlay.className = 'fc-today-border-overlay';
      Object.assign(overlay.style, {
        position: 'absolute',
        top: '0',
        right: '0',
        height: '100%',
        width: '0',
        borderRight: '3px solid #fb923c',
        pointerEvents: 'none',
        zIndex: '5',
      });
      (cell as HTMLElement).style.position = 'relative';
      cell.appendChild(overlay);
    });
  }

  // ---- Scroll to today ----
  const scrollToToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const todayCell = document.querySelector(`td[data-date="${todayStr}"]`);
    let scrollerEl: HTMLElement | null = null;
    if (todayCell) {
      const harness = todayCell.closest('.fc-scroller-harness');
      if (harness) scrollerEl = harness.querySelector('.fc-scroller');
    }
    if (todayCell && scrollerEl) {
      let scrollLeft =
        (todayCell as HTMLElement).offsetLeft -
        scrollerEl.clientWidth / 2 +
        (todayCell as HTMLElement).clientWidth / 2;
      if (scrollLeft < 0) scrollLeft = 0;
      scrollerEl.scrollLeft = scrollLeft;
    }
  };

  useEffect(() => {
    setTimeout(() => {
      highlightTodayColumn();
      scrollToToday();
    }, 200);
  }, [events, employees, selectedEmployees]);

  const handleDatesSet = () => {
    setTimeout(() => {
      highlightTodayColumn();
      scrollToToday();
    }, 200);
  };

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
      try {
        const supabase = getAuthorizedClient();
        const { data, error } = await supabase
          .from('leave_requests')
          .select(
            `id, start_date, end_date, employee_id, status, half_day, leave_type:leave_type_id (name, color), employee:employee_id (full_name)`
          )
          .in('status', ['Approved', 'Pending']);
        if (error) throw error;
        const formatted = (data || []).map((ev: any) => ({
          id: ev.id,
          title: ev.leave_type?.name || 'Unknown',
          start: ev.start_date,
          end: ev.end_date,
          resourceId: ev.employee_id,
          backgroundColor: ev.leave_type?.color || '#3b82f6',
          isHalfDay: ev.half_day === true,
          status: ev.status,
          employeeName: ev.employee?.full_name || '',
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
      <div className="flex gap-2 items-center">
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
        <Button
          variant="outline"
          className="ml-2"
          onClick={() => {
            if (calendarRef.current) {
              calendarRef.current.getApi().today();
            }
            setTimeout(() => {
              highlightTodayColumn();
              scrollToToday();
            }, 600);
          }}
        >
          Scroll to Today
        </Button>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[resourceTimelinePlugin]}
        initialView="resourceTimelineMonth"
        schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
        height="auto"
        resources={resources}
        events={events}
        resourceAreaHeaderContent="Name"
        resourceAreaWidth="150px"
        resourceLabelContent={arg => ({ html: arg.resource.title })}
        eventDidMount={info => {
          const event = info.event.extendedProps;
          if (event.status === 'Pending') {
            info.el.classList.add('pending-leave');
            if (info.el.querySelector('.fc-event-main-frame')) {
              info.el.querySelector('.fc-event-main-frame').classList.add('pending-leave');
            }
          }
          if (event.isHalfDay) {
            const badge = document.createElement('span');
            badge.innerText = '½';
            badge.style.marginLeft = '6px';
            badge.style.fontWeight = 'bold';
            badge.style.background = '#fbbf24';
            badge.style.color = '#fff';
            badge.style.borderRadius = '8px';
            badge.style.fontSize = '12px';
            badge.style.padding = '0px 4px';
            badge.style.verticalAlign = 'middle';
            badge.style.display = 'inline-block';
            badge.style.lineHeight = '1.1';
            info.el.appendChild(badge);
          }
          tippy(info.el, {
            content: `
              <div>
                <strong>${info.event.title}</strong><br/>
                <span>${info.event.startStr} — ${info.event.endStr}</span><br/>
                <span>Status: ${event.status || ''}</span><br/>
                <span>Employee: ${event.employeeName || ''}</span>
                ${event.isHalfDay ? '<br/><span><strong>Half Day</strong></span>' : ''}
              </div>
            `,
            allowHTML: true,
            theme: 'light',
          });
        }}
        datesSet={handleDatesSet}
        headerToolbar={{
          left: 'prev,next',
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
