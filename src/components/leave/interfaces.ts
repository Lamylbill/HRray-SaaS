
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
