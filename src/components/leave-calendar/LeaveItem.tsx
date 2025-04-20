
import React from 'react';
import { LeaveRequest } from './interfaces';

interface LeaveItemProps {
  leaveRequest: LeaveRequest;
}

const LeaveItem: React.FC<LeaveItemProps> = ({ leaveRequest }) => {
  const { employee, leave_type, status } = leaveRequest;

  return (
    <div 
      className="rounded px-1.5 py-1 text-xs text-white hover:opacity-90 truncate cursor-pointer transition-all hover:shadow-md"
      style={{ backgroundColor: leave_type.color }}
      title={`${employee.full_name} - ${leave_type.name} (${status})`}
    >
      <div className="font-medium truncate">{employee.full_name}</div>
      <div className="text-xs opacity-90 truncate flex items-center justify-between">
        <span>{leave_type.name}</span>
        {status !== 'Approved' && (
          <span className="text-[10px] rounded-full px-1 py-0.5 bg-white bg-opacity-30">
            {status}
          </span>
        )}
      </div>
    </div>
  );
};

export default LeaveItem;
