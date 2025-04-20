
export interface Employee {
  id: string;
  full_name: string;
}

export interface LeaveType {
  id: string;
  name: string;
  color: string;
  is_paid?: boolean;
}

export interface LeaveRequest {
  id: string;
  employee: {
    id: string;
    full_name: string;
  };
  leave_type: {
    id: string;
    name: string;
    color: string;
  };
  start_date: string;
  end_date: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

export interface MonthViewProps {
  month: number;
  year: number;
  leaveRequests: LeaveRequest[];
  isFirst?: boolean;
  isCurrent?: boolean;
}

export interface LeaveQuota {
  id: string;
  employee_id: string;
  leave_type_id: string;
  quota_days: number;
  taken_days: number;
  adjustment_days: number;
  created_at: string;
  updated_at: string;
}
