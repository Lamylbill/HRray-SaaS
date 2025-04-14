
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LeaveType, LeaveQuota } from '@/components/leave-calendar/interfaces';

export const useLeave = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: leaveTypes, isLoading: isLoadingLeaveTypes } = useQuery({
    queryKey: ['leaveTypes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as LeaveType[];
    },
  });

  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name')
        .order('full_name');
      
      if (error) throw error;
      return data;
    },
  });

  const fetchLeaveQuota = async (employeeId: string, leaveTypeId: string) => {
    const { data, error } = await supabase
      .from('leave_quotas')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data as LeaveQuota;
  };

  const submitLeaveRequest = async (values: {
    employeeId: string;
    leaveTypeId: string;
    startDate: Date;
    endDate: Date;
    notes?: string;
    isHalfDay?: boolean;
    halfDayType?: 'AM' | 'PM';
  }) => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .insert([
          {
            employee_id: values.employeeId,
            leave_type_id: values.leaveTypeId,
            start_date: values.startDate.toISOString().split('T')[0],
            end_date: values.endDate.toISOString().split('T')[0],
            notes: values.notes,
            half_day: values.isHalfDay,
            half_day_type: values.isHalfDay ? values.halfDayType : null,
            status: 'Pending'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Leave request submitted successfully",
        duration: 3000,
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit leave request",
        variant: "destructive",
        duration: 3000,
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    leaveTypes,
    employees,
    isLoadingLeaveTypes,
    isLoadingEmployees,
    isSubmitting,
    fetchLeaveQuota,
    submitLeaveRequest,
  };
};
