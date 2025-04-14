interface Employee {
  id: string;
  full_name: string;
}

interface LeaveType {
  id: string;
  name: string;
  color: string;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  employee: Employee;
  leave_types: LeaveType;
}

interface MonthViewProps {
  month: number;
  year: number;
}