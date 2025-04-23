
import React from 'react';
import LeaveCalendar from '../leave-calendar/LeaveCalendar';
import { Button } from '@/components/ui-custom/Button';
import { RefreshCw, Upload, Plus, Calendar, FileText, Link as LinkIcon } from 'lucide-react';

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
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="default" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Leave
            </Button>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Calendar View
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Leave Records
          </Button>
          <Button variant="outline" size="sm">
            <LinkIcon className="mr-2 h-4 w-4" />
            Generate Bot Link
          </Button>
        </div>

        {/* Calendar */}
        <div className="flex-grow flex flex-col overflow-hidden">
          <LeaveCalendar />
        </div>
      </div>
    </div>
  );
};

export default Leave;
