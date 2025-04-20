
import React from 'react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LeaveRequest } from './interfaces';

interface LeavePopoverProps {
  leaveRequest: LeaveRequest;
  children: React.ReactNode;
}

const LeavePopover: React.FC<LeavePopoverProps> = ({ leaveRequest, children }) => {
  const { employee, leave_type, start_date, end_date, status, notes } = leaveRequest;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="right">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h4 className="font-medium">{employee.full_name}</h4>
            <span className={`text-xs px-2 py-1 rounded ${
              status === 'Approved' ? 'bg-green-100 text-green-800' :
              status === 'Rejected' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {status}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {leave_type.name}
          </p>
          <div className="text-sm">
            <p className="text-gray-600">
              {format(new Date(start_date), 'PPP')}
              {start_date !== end_date && ` - ${format(new Date(end_date), 'PPP')}`}
            </p>
          </div>
          {notes && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">Notes:</p>
              <p className="text-sm mt-1">{notes}</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LeavePopover;
