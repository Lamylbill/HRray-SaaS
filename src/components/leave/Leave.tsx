import React from 'react';
import MonthCalendarView from './MonthCalendarView';
import {
  CalendarViewButton,
  LeaveRecordsButton,
  GenerateBotLinkButton,
  RefreshButton,
  ExportButton,
  AddLeaveButton,
} from './LeaveActionButtons';

const Leave = () => {
  return (
    <div className="flex flex-col bg-gray-50 h-full overflow-hidden">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col flex-grow">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Leave Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage employee leave, shifts, and attendance
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
            <RefreshButton />
            <ExportButton />
            <AddLeaveButton />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-wrap gap-3 mb-4">
          <CalendarViewButton />
          <LeaveRecordsButton />
          <GenerateBotLinkButton />
        </div>

        {/* Calendar */}
        <div className="flex-grow flex flex-col overflow-hidden">
          <MonthCalendarView />
        </div>
      </div>
    </div>
  );
};

export default Leave;
