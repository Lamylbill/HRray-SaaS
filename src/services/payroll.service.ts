import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type PayrollPeriod = Tables<'payroll_periods'>;
export type PayrollItem = Tables<'payroll_items'>;

interface CPFResult {
  employeeContribution: number;
  employerContribution: number;
}

export const payrollService = {
  async getPeriods(): Promise<PayrollPeriod[]> {
    const { data, error } = await supabase
      .from('payroll_periods')
      .select('*')
      .order('start_date', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getPeriodItems(periodId: string): Promise<PayrollItem[]> {
    const { data, error } = await supabase
      .from('payroll_items')
      .select('*, payroll_allowance_items(*), payroll_deduction_items(*)')
      .eq('payroll_period_id', periodId);
    if (error) throw error;
    return data ?? [];
  },

  async createPeriod(period: Omit<TablesInsert<'payroll_periods'>, 'created_by'>): Promise<PayrollPeriod> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('payroll_periods')
      .insert({ ...period, created_by: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updatePeriodStatus(id: string, status: string): Promise<PayrollPeriod> {
    const { data, error } = await supabase
      .from('payroll_periods')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Singapore CPF rates — simplified, based on 2024 MOM/CPF rates
  calculateCPF(basicSalary: number, age: number, residencyStatus: string): CPFResult {
    if (residencyStatus === 'foreigner') {
      return { employeeContribution: 0, employerContribution: 0 };
    }

    let employeeRate: number;
    let employerRate: number;

    if (age < 55) {
      employeeRate = 0.20;
      employerRate = 0.17;
    } else if (age < 60) {
      employeeRate = 0.15;
      employerRate = 0.15;
    } else if (age < 65) {
      employeeRate = 0.075;
      employerRate = 0.115;
    } else if (age < 70) {
      employeeRate = 0.05;
      employerRate = 0.075;
    } else {
      employeeRate = 0.05;
      employerRate = 0.05;
    }

    const cappedSalary = Math.min(basicSalary, 6800); // OW ceiling FY2024
    return {
      employeeContribution: Math.round(cappedSalary * employeeRate * 100) / 100,
      employerContribution: Math.round(cappedSalary * employerRate * 100) / 100,
    };
  },

  // SDL: Skills Development Levy — 0.25% of gross, min $2, max $11.25/month
  calculateSDL(grossSalary: number): number {
    const sdl = grossSalary * 0.0025;
    return Math.min(Math.max(sdl, 2), 11.25);
  },
};
