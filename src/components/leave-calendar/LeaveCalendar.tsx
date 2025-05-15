
import React from 'react';
import { MonthCalendarView } from './MonthCalendarView';

const LeaveCalendar: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <MonthCalendarView />
    </div>
  );
};

export default LeaveCalendar;
