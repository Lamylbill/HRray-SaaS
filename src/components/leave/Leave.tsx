import React from 'react'; // Keep React import
import MonthCalendarView from './MonthCalendarView';
import { CalendarViewButton, LeaveRecordsButton, GenerateBotLinkButton } from './LeaveActionButtons'; // Import your button components
import { RefreshButton, ExportButton, AddLeaveButton } from './LeaveActionButtons';

const Leave = () => {
    return (
        <div className="min-h-screen pt-20 pb-12 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
                        <p className="mt-1 text-gray-600">Manage employee leave, shifts, and attendance</p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
                        <CalendarViewButton />
                        <LeaveRecordsButton />
                        <GenerateBotLinkButton />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 gap-3">
                    {/* This is intentionally empty, as the buttons are already in the header */}
                </div>

                <section className="relative mt-6 overflow-hidden">
                    <MonthCalendarView />
                </section>
            </div>
        </div>
    );
};

export default Leave;