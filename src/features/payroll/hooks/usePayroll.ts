import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '@/services/payroll.service';
import { TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export function usePayrollPeriods() {
  return useQuery({
    queryKey: ['payroll-periods'],
    queryFn: () => payrollService.getPeriods(),
  });
}

export function usePayrollItems(periodId: string | null) {
  return useQuery({
    queryKey: ['payroll-items', periodId],
    queryFn: () => payrollService.getPeriodItems(periodId!),
    enabled: !!periodId,
  });
}

export function useCreatePayrollPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<TablesInsert<'payroll_periods'>, 'created_by'>) =>
      payrollService.createPeriod(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll-periods'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Payroll period created');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePeriodStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      payrollService.updatePeriodStatus(id, status),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['payroll-periods'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(`Payroll ${status.toLowerCase()}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
