
import React from 'react';
import LeaveCalendarView from '../leave/LeaveCalendarView';

const LeaveCalendar: React.FC = () => {
  return (
    <div className="container mx-auto py-10 flex flex-col items-center w-full max-w-[1200px]">
      <LeaveCalendarView />
    </div>
  );
};

export default LeaveCalendar;
