
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
  notes?: string; // Add optional notes property
}
