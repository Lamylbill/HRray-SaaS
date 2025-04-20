
import React from 'react';
import { LeaveRequest } from './interfaces';
import LeavePopover from './LeavePopover';

interface LeaveItemProps {
  leaveRequest: LeaveRequest;
  isStart?: boolean;
  isEnd?: boolean;
}

const LeaveItem: React.FC<LeaveItemProps> = ({ leaveRequest, isStart, isEnd }) => {
  const { employee, leave_type, status } = leaveRequest;

  return (
    <LeavePopover leaveRequest={leaveRequest}>
      <div 
        className={`
          px-1.5 py-1 text-xs text-white hover:opacity-90 cursor-pointer transition-all hover:shadow-md
          ${isStart ? 'rounded-l-md pl-2' : 'rounded-none pl-0'}
          ${isEnd ? 'rounded-r-md pr-2' : 'rounded-none pr-0'}
          ${!isStart && !isEnd ? 'px-0' : ''}
        `}
        style={{ backgroundColor: leave_type.color }}
        title={`${employee.full_name} - ${leave_type.name} (${status})`}
      >
        <div className={`font-medium truncate ${!isStart ? 'hidden' : ''}`}>
          {employee.full_name}
        </div>
        <div className={`text-xs opacity-90 truncate flex items-center justify-between ${!isStart ? 'hidden' : ''}`}>
          <span>{leave_type.name}</span>
          {status !== 'Approved' && (
            <span className="text-[10px] rounded-full px-1 py-0.5 bg-white bg-opacity-30">
              {status}
            </span>
          )}
        </div>
      </div>
    </LeavePopover>
  );
};

export default LeaveItem;
