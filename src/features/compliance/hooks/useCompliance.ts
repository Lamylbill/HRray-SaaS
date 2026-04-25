import { useQuery } from '@tanstack/react-query';
import { complianceService } from '@/services/compliance.service';

export function useComplianceScore() {
  return useQuery({
    queryKey: ['compliance-score'],
    queryFn: () => complianceService.getScore(),
  });
}

export function useWorkPassExpiries(daysAhead = 90) {
  return useQuery({
    queryKey: ['work-pass-expiries', daysAhead],
    queryFn: () => complianceService.getWorkPassExpiries(daysAhead),
  });
}

export function useProbationsDue(daysAhead = 30) {
  return useQuery({
    queryKey: ['probations-due', daysAhead],
    queryFn: () => complianceService.getProbationsDue(daysAhead),
  });
}

export function useForeignWorkerQuota() {
  return useQuery({
    queryKey: ['foreign-worker-quota'],
    queryFn: () => complianceService.getForeignWorkerQuota(),
  });
}
