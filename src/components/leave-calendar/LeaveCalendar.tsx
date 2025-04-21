
import React from 'react';
import MonthCalendarView from './MonthCalendarView';

const LeaveCalendar: React.FC = () => {
  return (
    <div className="h-[calc(100vh-180px)] overflow-hidden">
      <MonthCalendarView />
    </div>
  );
};

export default LeaveCalendar;
