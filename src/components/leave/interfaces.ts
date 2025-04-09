
export interface LeaveEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: string;
  employee: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  color: string;
}

export interface PublicHoliday {
  id: string;
  name: string;
  date: Date;
  country: string;
}

export interface LeaveHistory {
  id: string;
  start_date: Date;
  end_date: Date;
  status: 'Pending' | 'Approved' | 'Rejected';
  leave_type: {
    name: string;
    color: string;
  };
  days: number;
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
  status: 'Pending' | 'Approved' | 'Rejected';
  half_day: boolean;
  half_day_type: 'AM' | 'PM' | null;
  created_at: string;
}

// Define the CSSProperties type for consistent styling
export type EventStyleProps = React.CSSProperties;
