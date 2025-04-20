
import React from 'react';
import LeaveCalendarView from '../leave/LeaveCalendarView';

const LeaveCalendar: React.FC = () => {
  return (
    <div className="h-[calc(100vh-180px)] overflow-hidden">
      <LeaveCalendarView />
    </div>
  );
};

export default LeaveCalendar;
