import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type ComplianceCheck = Tables<'compliance_checks'>;

export const complianceService = {
  async getChecks(): Promise<ComplianceCheck[]> {
    const { data, error } = await supabase
      .from('compliance_checks')
      .select('*')
      .order('check_date', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getScore(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .rpc('calculate_compliance_score', { p_user_id: user.id });
    if (error) throw error;
    return (data as number) ?? 0;
  },

  async getWorkPassExpiries(daysAhead = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, work_pass_type, work_pass_expiry_date, department')
      .not('work_pass_expiry_date', 'is', null)
      .lte('work_pass_expiry_date', cutoff.toISOString().split('T')[0])
      .gte('work_pass_expiry_date', new Date().toISOString().split('T')[0])
      .order('work_pass_expiry_date');
    if (error) throw error;
    return data ?? [];
  },

  async getForeignWorkerQuota(): Promise<Tables<'foreign_worker_quota'> | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('foreign_worker_quota')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async logCheck(checkType: string, status: string, details?: Record<string, unknown>): Promise<ComplianceCheck> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('compliance_checks')
      .insert({
        user_id: user.id,
        check_type: checkType,
        status,
        details: details ?? null,
        check_date: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getProbationsDue(daysAhead = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, department, probation_end, employment_status')
      .not('probation_end', 'is', null)
      .lte('probation_end', cutoff.toISOString().split('T')[0])
      .gte('probation_end', new Date().toISOString().split('T')[0])
      .order('probation_end');
    if (error) throw error;
    return data ?? [];
  },
};
