import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService, LeaveRequestInsert } from '@/services/leave.service';
import { toast } from 'sonner';

export function useLeaveRequests(filters?: { status?: string }) {
  return useQuery({
    queryKey: ['leave-requests', filters],
    queryFn: () => leaveService.getRequests(filters),
  });
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: ['leave-types'],
    queryFn: () => leaveService.getLeaveTypes(),
  });
}

export function useCreateLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<LeaveRequestInsert, 'user_id'>) => leaveService.createRequest(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-requests'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Leave request submitted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLeaveStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      leaveService.updateStatus(id, status, notes),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['leave-requests'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(status === 'Approved' ? 'Leave approved' : 'Leave rejected');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
