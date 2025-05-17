export interface LeaveType {
  id: string;
  name: string;
  color: string;
  is_paid?: boolean;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee: {
    id: string;
    full_name: string;
  };
  leave_type: LeaveType;
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
