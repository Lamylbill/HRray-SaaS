import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesService, EmployeeInsert, EmployeeUpdate } from '@/services/employees.service';
import { toast } from 'sonner';

export function useEmployees(search?: string) {
  return useQuery({
    queryKey: ['employees', search],
    queryFn: () => search ? employeesService.search(search) : employeesService.getAll().then(r => r.data),
  });
}

export function useEmployee(id: string | null) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeesService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<EmployeeInsert, 'user_id'>) => employeesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Employee added');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmployeeUpdate }) =>
      employeesService.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Employee updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Employee removed');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
