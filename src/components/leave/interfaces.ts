
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

// Define the CSSProperties type for consistent styling
export type EventStyleProps = React.CSSProperties;
