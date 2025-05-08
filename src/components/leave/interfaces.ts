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
  is_paid: boolean;
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
    is_paid?: boolean;
  };
  start_date: string;
  end_date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  half_day: boolean;
  half_day_type: 'AM' | 'PM' | null;
  created_at: string;
  chargeable_duration?: number;
}

export type EventStyleProps = React.CSSProperties;

export interface AddLeaveFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialDate?: Date | undefined;
}

export interface LeaveCalendarViewProps {
  selectedLeaveTypes: string[];
  onLeaveTypeFilter: (types: string[]) => void;
}

export interface LeaveRecordsViewProps {
  selectedLeaveTypes: string[];
  onLeaveTypeFilter: (types: string[]) => void;
  availableLeaveTypes?: LeaveType[];
}
