
export interface Employee {
  id: string;
  full_name: string;
}

export interface LeaveType {
  id: string;
  name: string;
  color: string;
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
}
