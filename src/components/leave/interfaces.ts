
export interface LeaveType {
  id: string;
  name: string;
  color: string;
  is_paid?: boolean;
}

export interface LeaveQuota {
  employee_id: string;
  leave_type_id: string;
  quota_days: number;
  taken_days: number;
  adjustment_days: number;
}

export interface Employee {
  id: string;
  full_name: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee: {
    id: string;
    full_name: string;
  };
  leave_type: LeaveType;  // This ensures leave_type is of type LeaveType, not an array
  start_date: string;
  end_date: string;
  status: string;
  half_day?: boolean;
  half_day_type?: string;
  chargeable_duration?: number;
  created_at?: string;
}

export interface LeaveRecordsViewProps {
  availableLeaveTypes: LeaveType[];
  onlyPending?: boolean;
  title?: string;
  selectedLeaveTypes?: string[];
  onLeaveTypeFilter?: (types: string[]) => void;
}
