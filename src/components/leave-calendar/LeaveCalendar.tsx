
import React from 'react';
import { MonthCalendarView } from './MonthCalendarView';
import EmployeeTimelineView from './EmployeeTimelineView';

interface LeaveCalendarProps {
  view?: 'month' | 'timeline';
}
const LeaveCalendar: React.FC<LeaveCalendarProps> = ({ view = 'month' }) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {view === 'month' ? <MonthCalendarView /> : <EmployeeTimelineView />}
    </div>
  );
};

export default LeaveCalendar;
