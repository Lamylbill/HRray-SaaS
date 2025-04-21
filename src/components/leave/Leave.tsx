import React from 'react';
import MonthCalendarView from './MonthCalendarView';
import {
  CalendarViewButton,
  LeaveRecordsButton,
  GenerateBotLinkButton,
  RefreshButton,
  ExportButton,
  AddLeaveButton
} from './LeaveActionButtons';

const Leave = () => {
  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      <div className="px-6 py-4 md:px-10 md:py-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage employee leave, shifts, and attendance
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <CalendarViewButton />
            <LeaveRecordsButton />
            <GenerateBotLinkButton />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <RefreshButton />
            <ExportButton />
          </div>
          <div className="flex gap-2">
            <AddLeaveButton />
          </div>
        </div>

        <section className="mt-6 relative h-[calc(100vh-240px)]">
          <MonthCalendarView />
        </section>
      </div>
    </div>
  );
};

export default Leave;
