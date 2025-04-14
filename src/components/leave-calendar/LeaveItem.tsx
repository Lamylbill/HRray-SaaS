import React from 'react';
import { LeaveRequest } from './interfaces'; // Import LeaveRequest interface

interface LeaveItemProps {
  leaveRequest: LeaveRequest;
}

const LeaveItem: React.FC<LeaveItemProps> = ({ leaveRequest }) => {
  const { employee, leave_type, status } = leaveRequest; // Destructure data

  return (
    <div 
      className={`rounded-md px-2 py-1 text-sm text-white ${leave_type.color} hover:opacity-90`} // Main container styling
      style={{ backgroundColor: leave_type.color }} // Set background color dynamically
    >
      <div className="font-medium">{employee.full_name}</div> {/* Employee name styling */}
      <div className="text-xs">{leave_type.name}</div> {/* Leave type name styling */}
      {/* Removed leave type name from here */}
      {status !== 'Approved' && (
        <span className="ml-1 rounded-full px-2 py-0.5 text-xs font-bold uppercase bg-opacity-50 bg-white text-black">
          {status}
        </span>
      )}
    </div>
  );
};

export default LeaveItem;