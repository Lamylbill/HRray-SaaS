import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { complianceService } from '@/services/compliance.service';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [employees, pendingLeave, activePayroll, workPassExpiries] = await Promise.all([
        supabase.from('employees').select('id, employment_status', { count: 'exact' }).eq('employment_status', 'Active'),
        supabase.from('leave_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('payroll_periods').select('id', { count: 'exact' }).eq('status', 'processing'),
        complianceService.getWorkPassExpiries(90),
      ]);
      return {
        totalEmployees: employees.count ?? 0,
        pendingLeave: pendingLeave.count ?? 0,
        activePayroll: activePayroll.count ?? 0,
        expiringWorkPasses: workPassExpiries.length,
      };
    },
  });
}

export function useRecentActivities() {
  return useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recent_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useWorkPassExpiries() {
  return useQuery({
    queryKey: ['work-pass-expiries'],
    queryFn: () => complianceService.getWorkPassExpiries(90),
  });
}

export function usePendingLeave() {
  return useQuery({
    queryKey: ['pending-leave-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*, employees(full_name, department), leave_types(name, color)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });
}
