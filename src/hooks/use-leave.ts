
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LeaveType, LeaveQuota, Employee } from '@/components/leave-calendar/interfaces';

export const useLeave = () => {
  const { toast } = useToast();
  const supabase = getAuthorizedClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: leaveTypesData, isLoading: isLoadingLeaveTypes } = useQuery<LeaveType[], Error>({
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
  // Provide a default empty array if data is undefined during initial load or error
  const leaveTypes = leaveTypesData || [];


  const { data: employeesData, isLoading: isLoadingEmployees } = useQuery<Employee[], Error>({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name')
        .order('full_name');
      
      if (error) throw error;
      return data as Employee[];
    },
  });
  // Provide a default empty array
  const employees = employeesData || [];

  const fetchLeaveQuota = useCallback(async (employeeId: string, leaveTypeId: string): Promise<LeaveQuota | null> => {
    // Ensure supabase client is stable or include it in dependencies if it can change.
    // If getAuthorizedClient() always returns the same instance or a lightweight new one, this is okay.
    const { data: quotaData, error: quotaError } = await supabase
      .from('leave_quotas')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
      .single();

    if (quotaError) {
      if (quotaError.code === 'PGRST116') { // "No rows found" or "Too many rows found" for .single()
        // Check if the leave type is unpaid to return a pseudo-quota for unlimited
        const { data: leaveTypeData, error: leaveTypeError } = await supabase
          .from('leave_types')
          .select('is_paid') // Using is_paid now
          .select('is_paid') // Using is_paid property
          .eq('id', leaveTypeId)
          .single();

        if (leaveTypeError) {
            console.error("Error fetching leave type for quota check:", leaveTypeError);
            // Decide how to handle this error, maybe return null or a default error quota
            return null; 
        }
        
        if (leaveTypeData && !leaveTypeData.is_paid) { // Check if it's an unpaid leave type (!is_paid instead of is_unpaid)
          return {
            // Using fields consistent with LeaveQuota interface. Ensure these are correct.
            // id might not be needed if not part of your DB schema for this pseudo-quota
            // id: 'unlimited', // This field might not exist on your LeaveQuota type
            employee_id: employeeId,
            leave_type_id: leaveTypeId,
            quota_days: Number.MAX_SAFE_INTEGER,
            taken_days: 0, // Unpaid leave doesn't usually consume a quota this way
            adjustment_days: 0,
            // created_at and updated_at are likely not relevant for this pseudo-quota object
          } as LeaveQuota; // Cast carefully, ensure this matches your actual LeaveQuota structure
        }

        // If no specific quota row found and it's not an explicitly unpaid type (handled above),
        // return a default zero quota.
        return {
        //   id: 'new_or_zero', // This field might not exist on your LeaveQuota type
          employee_id: employeeId,
          leave_type_id: leaveTypeId,
          quota_days: 0,
          taken_days: 0,
          adjustment_days: 0,
        } as LeaveQuota; // Cast carefully
      }
      // For other errors, or if you don't want to return a default/pseudo quota
      console.error("Error fetching leave quota:", quotaError);
      throw quotaError; // Or return null, depending on desired error handling
    }
    
    // If quotaData is found, proceed to calculate taken_days
    // The logic for calculating taken_days here seems to be a simple sum of days.
    // Be cautious: this calculation of `days` doesn't skip weekends/holidays.
    // The `AddLeaveForm`'s `calculateChargeableDaysInternal` DOES handle weekends/holidays for the *current request*.
    // This `taken_days` here should reflect what's already recorded as taken in the DB,
    // or how your system defines "taken days" for the quota overview.
    // If your `leave_requests` table stores `chargeable_duration`, it's better to sum that.
    const { data: leaveRequests, error: requestsError } = await supabase
      .from('leave_requests')
      .select('chargeable_duration, status') // Select chargeable_duration
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
      .in('status', ['Approved', 'Pending']); // Consider if 'Pending' should count towards 'taken'
    
    if (requestsError) {
        console.error("Error fetching leave requests for quota:", requestsError);
        throw requestsError; // Or handle more gracefully
    }

    let calculatedTakenDays = 0;
    if (leaveRequests) {
      leaveRequests.forEach(req => {
        // Sum up the stored chargeable duration
        if (req.chargeable_duration !== null && req.chargeable_duration !== undefined) {
            calculatedTakenDays += req.chargeable_duration;
        } else {
            // Fallback if chargeable_duration is not available (this part is less accurate)
            const startDate = new Date(req.start_date);
            const endDate = new Date(req.end_date);
            // This simple day diff calculation doesn't account for non-working days.
            const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            calculatedTakenDays += req.half_day ? 0.5 : daysDifference;
        }
      });
    }

    return {
      ...quotaData, // This is the base quota from 'leave_quotas' table
      taken_days: calculatedTakenDays // Override with newly calculated taken_days
    } as LeaveQuota;

  }, [supabase]); // Dependency: supabase client instance

  // submitLeaveRequest (memoized)
  const submitLeaveRequest = useCallback(async (values: {
    employee_id: string; leave_type_id: string; start_date: string; end_date: string;
    notes?: string; half_day?: boolean; half_day_type?: 'AM' | 'PM';
    chargeable_duration: number; status: string;
    employee_id: string;
    leave_type_id: string;
    start_date: string;
    end_date: string;
    notes?: string;
    half_day?: boolean;
    half_day_type?: 'AM' | 'PM';
    chargeable_duration: number;
    status: string;
  }) => {
    setIsSubmitting(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        console.error('Auth user not found for submitLeaveRequest');
        throw new Error('Authentication error: User not found.');
      }

      const { data, error } = await supabase
        .from('leave_requests')
        .insert([
          {
            employee_id: values.employee_id,
            leave_type_id: values.leave_type_id,
            start_date: values.start_date,
            end_date: values.end_date,
            notes: values.notes,
            half_day: values.half_day,
            half_day_type: values.half_day ? values.half_day_type : null,
            status: values.status || 'Pending', // Default to Pending if not provided
            user_id: userData.user.id,
            chargeable_duration: values.chargeable_duration, // Save calculated duration
          }
        ])
        .select()
        .single();

      if (error) {
        console.error("Error inserting leave request:", error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Leave request submitted successfully",
        duration: 3000,
      });

      return data;
    } catch (error: any) {
      console.error("Failed to submit leave request in hook:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit leave request",
        variant: "destructive",
        duration: 3000,
      });
      throw error; // Re-throw to be caught by AddLeaveForm if needed
    } finally {
      setIsSubmitting(false);
    }
  }, [supabase, toast]); // setIsSubmitting is stable, so not strictly needed

  // Return all values needed by components
  return {
    leaveTypes, // The memoized array (defaults to [])
    employees,  // The memoized array (defaults to [])
    isLoadingLeaveTypes, // Loading state from useQuery
    isLoadingEmployees,  // Loading state from useQuery
    isSubmitting, // Local state for submission status
    fetchLeaveQuota, // Memoized fetch function
    submitLeaveRequest, // Memoized submit function
    leaveTypes,
    employees,
    isLoadingLeaveTypes,
    isLoadingEmployees,
    isSubmitting,
    fetchLeaveQuota,
    submitLeaveRequest,
  };
};
