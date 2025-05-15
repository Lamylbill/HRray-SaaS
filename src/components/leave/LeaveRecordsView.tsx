import React, { useState, useEffect } from 'react';
import { LeaveType } from '../leave-calendar/interfaces';

// Add the missing props to interface
export interface LeaveRecordsViewProps {
  selectedLeaveTypes: string[];
  onLeaveTypeFilter: (types: string[]) => void;
  availableLeaveTypes: LeaveType[];
}

export const LeaveRecordsView: React.FC<LeaveRecordsViewProps> = ({ 
  selectedLeaveTypes, 
  onLeaveTypeFilter, 
  availableLeaveTypes 
}) => {
  const [leaveTypes, setLeaveTypes] = useState<string[]>(selectedLeaveTypes);

  useEffect(() => {
    setLeaveTypes(selectedLeaveTypes);
  }, [selectedLeaveTypes]);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    let updatedLeaveTypes = [...leaveTypes];

    if (checked) {
      updatedLeaveTypes = [...updatedLeaveTypes, value];
    } else {
      updatedLeaveTypes = updatedLeaveTypes.filter(type => type !== value);
    }

    setLeaveTypes(updatedLeaveTypes);
    onLeaveTypeFilter(updatedLeaveTypes);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {availableLeaveTypes.map((leaveType) => (
          <label key={leaveType.id} className="inline-flex items-center">
            <input
              type="checkbox"
              className="mr-1"
              value={leaveType.id}
              checked={leaveTypes.includes(leaveType.id)}
              onChange={handleCheckboxChange}
            />
            {leaveType.name}
          </label>
        ))}
      </div>
    </div>
  );
};

export default LeaveRecordsView;
