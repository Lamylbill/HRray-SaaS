import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type LeaveRequest = Tables<'leave_requests'>;
export type LeaveRequestInsert = TablesInsert<'leave_requests'>;
export type LeaveType = Tables<'leave_types'>;
export type LeaveQuota = Tables<'leave_quotas'>;

interface LeaveRequestFilters {
  employeeId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const leaveService = {
  async getRequests(filters?: LeaveRequestFilters): Promise<LeaveRequest[]> {
    let query = supabase
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.employeeId) query = query.eq('employee_id', filters.employeeId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.startDate) query = query.gte('start_date', filters.startDate);
    if (filters?.endDate) query = query.lte('end_date', filters.endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async createRequest(request: Omit<LeaveRequestInsert, 'user_id'>): Promise<LeaveRequest> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('leave_requests')
      .insert({ ...request, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: string, reviewNotes?: string): Promise<LeaveRequest> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status,
        review_notes: reviewNotes ?? null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getLeaveTypes(): Promise<LeaveType[]> {
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .order('name');
    if (error) throw error;
    return data ?? [];
  },

  async getQuotasByEmployee(employeeId: string): Promise<LeaveQuota[]> {
    const { data, error } = await supabase
      .from('leave_quotas')
      .select('*')
      .eq('employee_id', employeeId);
    if (error) throw error;
    return data ?? [];
  },

  async updateQuota(id: string, updates: TablesUpdate<'leave_quotas'>): Promise<LeaveQuota> {
    const { data, error } = await supabase
      .from('leave_quotas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  calculateWorkingDays(startDate: Date, endDate: Date, publicHolidays: string[]): number {
    let count = 0;
    const current = new Date(startDate);
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split('T')[0];
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !publicHolidays.includes(dateStr)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  },
};
