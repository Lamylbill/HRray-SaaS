
// Define the shape of a LeaveType
export interface LeaveType {
  id: string;
  name: string;
  color: string;
  is_paid: boolean;
}

// Define employee reference within leave request
export interface LeaveRequestEmployee {
  id: string;
  full_name: string;
}

// Define the shape of a LeaveRequest
export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee: LeaveRequestEmployee; 
  leave_type_id?: string;
  leave_type: LeaveType;  // This is now a single object, not an array
  start_date: string;
  end_date: string;
  status: string;
  half_day: boolean;
  half_day_type?: string;
  notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  chargeable_duration?: number;
}

// Define the shape of DocumentManagerProps
export interface DocumentManagerProps {
  employeeId: string;
  refreshTrigger?: number;
  isReadOnly?: boolean;
  bucketReady?: boolean;
  isTabbed?: boolean; // Add this property to fix the type error
}
