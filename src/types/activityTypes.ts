
export interface RecentActivity {
  id: string;
  user_id: string;
  employee_id?: string;
  activity_type: string;
  message: string;
  created_at: string;
  category?: string;
  target_url?: string;
}

export type ActivityCategory = 'all' | 'leave' | 'employee' | 'document' | 'payroll' | 'compliance' | 'system';
