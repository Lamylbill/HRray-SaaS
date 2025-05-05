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
    // Simply fetch the existing quota that should have been created by our trigger
    const { data: quotaData, error: quotaError } = await supabase
      .from('leave_quotas')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
      .single();
    
    if (quotaError) {
      if (quotaError.code === 'PGRST116') {
        // If somehow the quota doesn't exist (which should be rare now), 
        // check if this is an unpaid leave type
        const { data: leaveType, error: leaveTypeError } = await supabase
          .from('leave_types')
          .select('is_paid')
          .eq('id', leaveTypeId)
          .single();

        if (leaveTypeError) throw leaveTypeError;
        
        // For unpaid leave types, return unlimited quota
        if (!leaveType.is_paid) {
          return {
            id: 'unlimited',
            employee_id: employeeId,
            leave_type_id: leaveTypeId,
            quota_days: Number.MAX_SAFE_INTEGER,
            taken_days: 0,
            adjustment_days: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as LeaveQuota;
        }

        // Otherwise return a default object (which should be rare since we now auto-create quotas)
        return {
          id: 'new',
          employee_id: employeeId,
          leave_type_id: leaveTypeId,
          quota_days: 0,
          taken_days: 0,
          adjustment_days: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as LeaveQuota;
      }
      throw quotaError;
    }
    
    // Now fetch all relevant leave requests (both approved and pending)
    const { data: leaveRequests, error: requestsError } = await supabase
      .from('leave_requests')
      .select('start_date, end_date, half_day, status')
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
      .in('status', ['Approved', 'Pending']);
    
    if (requestsError) throw requestsError;
    
    // Calculate days from both approved and pending requests
    let approvedDays = 0;
    let pendingDays = 0;
    
    if (leaveRequests) {
      leaveRequests.forEach(req => {
        const startDate = new Date(req.start_date);
        const endDate = new Date(req.end_date);
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const leaveDays = req.half_day ? 0.5 : days;
        
        if (req.status === 'Approved') {
          approvedDays += leaveDays;
        } else if (req.status === 'Pending') {
          pendingDays += leaveDays;
        }
      });
    }
    
    // Return quota with both approved and pending days included in taken_days
    return {
      ...quotaData,
      taken_days: approvedDays + pendingDays
    } as LeaveQuota;
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
