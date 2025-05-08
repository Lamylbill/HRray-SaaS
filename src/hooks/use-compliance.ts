
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

export type ComplianceCheck = {
  id: string;
  checkType: string;
  checkDate: string;
  status: 'passed' | 'failed' | 'warning';
  details: any;
};

export type ForeignWorkerQuota = {
  id: string;
  industrySector: string;
  quotaPercentage: number;
  localHeadcount: number;
  foreignHeadcount: number;
  maxForeignAllowed: number;
};

export const useComplianceData = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [complianceScore, setComplianceScore] = useState<number>(0);
  const [cpfValidation, setCpfValidation] = useState<ComplianceCheck[]>([]);
  const [irasSubmission, setIrasSubmission] = useState<ComplianceCheck[]>([]);
  const [workPassExpiry, setWorkPassExpiry] = useState<any[]>([]);
  const [missingDataChecks, setMissingDataChecks] = useState<any[]>([]);
  const [leavePolicyViolations, setLeavePolicyViolations] = useState<any[]>([]);
  const [overtimeBreaches, setOvertimeBreaches] = useState<any[]>([]);
  const [foreignWorkerQuota, setForeignWorkerQuota] = useState<ForeignWorkerQuota | null>(null);

  const fetchComplianceChecks = useCallback(async (checkType: string) => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('compliance_checks')
        .select('*')
        .eq('user_id', user.id)
        .eq('check_type', checkType)
        .order('check_date', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching ${checkType} data:`, error);
      return [];
    }
  }, [user]);

  const checkCPFValidation = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Fetch employees missing CPF data
      const { data: employeesWithMissingCpf, error } = await supabase
        .from('employees')
        .select('id, full_name, cpf_account_number, cpf_contribution')
        .or('cpf_account_number.is.null,cpf_contribution.is.null')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Create a compliance check record
      const status = employeesWithMissingCpf && employeesWithMissingCpf.length > 0 ? 'failed' : 'passed';
      
      const { error: insertError } = await supabase
        .from('compliance_checks')
        .insert({
          user_id: user.id,
          check_type: 'cpf_validation',
          status: status,
          details: { employees: employeesWithMissingCpf || [] }
        });
      
      if (insertError) throw insertError;
      
      // Fetch updated CPF validation records
      const cpfData = await fetchComplianceChecks('cpf_validation');
      setCpfValidation(cpfData);
      
      return cpfData;
    } catch (error) {
      console.error('Error in CPF validation check:', error);
      toast({
        title: 'Failed to run CPF validation check',
        description: 'An error occurred while checking CPF data.',
        variant: 'destructive'
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchComplianceChecks, toast]);
  
  const checkWorkPassExpiry = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Get current date and 90 days ahead for warning
      const currentDate = new Date();
      const ninetyDaysLater = new Date();
      ninetyDaysLater.setDate(currentDate.getDate() + 90);
      
      // Format dates for Supabase query
      const currentDateStr = currentDate.toISOString().split('T')[0];
      const warningDateStr = ninetyDaysLater.toISOString().split('T')[0];
      
      // Fetch employees with work passes expiring soon
      const { data: employeesWithExpiringPasses, error } = await supabase
        .from('employees')
        .select('id, full_name, work_pass_type, work_pass_number, work_pass_expiry')
        .not('work_pass_expiry', 'is', null)
        .lte('work_pass_expiry', warningDateStr)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Separate expired and expiring soon passes
      const expiredPasses = employeesWithExpiringPasses?.filter(
        emp => new Date(emp.work_pass_expiry) <= new Date(currentDateStr)
      ) || [];
      
      const expiringSoonPasses = employeesWithExpiringPasses?.filter(
        emp => new Date(emp.work_pass_expiry) > new Date(currentDateStr)
      ) || [];
      
      // Create a compliance check record
      let status = 'passed';
      if (expiredPasses.length > 0) {
        status = 'failed';
      } else if (expiringSoonPasses.length > 0) {
        status = 'warning';
      }
      
      const { error: insertError } = await supabase
        .from('compliance_checks')
        .insert({
          user_id: user.id,
          check_type: 'work_pass_expiry',
          status: status,
          details: { 
            expired: expiredPasses, 
            expiring_soon: expiringSoonPasses 
          }
        });
      
      if (insertError) throw insertError;
      
      // Fetch updated work pass expiry records
      const workPassData = await fetchComplianceChecks('work_pass_expiry');
      setWorkPassExpiry(workPassData);
      
      return workPassData;
    } catch (error) {
      console.error('Error in work pass expiry check:', error);
      toast({
        title: 'Failed to check work pass expiry',
        description: 'An error occurred while checking work pass expiry dates.',
        variant: 'destructive'
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchComplianceChecks, toast]);

  const checkMissingData = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Fetch employees with missing NRIC or DOB
      const { data: employeesWithMissingData, error } = await supabase
        .from('employees')
        .select('id, full_name, nric, date_of_birth')
        .or('nric.is.null,date_of_birth.is.null')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Create a compliance check record
      const status = employeesWithMissingData && employeesWithMissingData.length > 0 ? 'failed' : 'passed';
      
      const { error: insertError } = await supabase
        .from('compliance_checks')
        .insert({
          user_id: user.id,
          check_type: 'missing_data',
          status: status,
          details: { employees: employeesWithMissingData || [] }
        });
      
      if (insertError) throw insertError;
      
      // Fetch updated missing data check records
      const missingDataChecksData = await fetchComplianceChecks('missing_data');
      setMissingDataChecks(missingDataChecksData);
      
      return missingDataChecksData;
    } catch (error) {
      console.error('Error in missing data check:', error);
      toast({
        title: 'Failed to check missing data',
        description: 'An error occurred while checking for missing employee data.',
        variant: 'destructive'
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchComplianceChecks, toast]);

  const fetchForeignWorkerQuota = useCallback(async () => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('foreign_worker_quota')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      
      return data;
    } catch (error) {
      console.error('Error fetching foreign worker quota:', error);
      return null;
    }
  }, [user]);

  const fetchComplianceScore = useCallback(async () => {
    if (!user) return 0;
    
    try {
      // Call the database function to calculate compliance score
      const { data, error } = await supabase
        .rpc('calculate_compliance_score', { p_user_id: user.id });
      
      if (error) throw error;
      
      return data || 0;
    } catch (error) {
      console.error('Error fetching compliance score:', error);
      return 0;
    }
  }, [user]);

  const refreshComplianceData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Run all compliance checks
      await Promise.all([
        checkCPFValidation(),
        checkWorkPassExpiry(),
        checkMissingData()
      ]);
      
      // Fetch other compliance data
      const [irasData, leaveData, overtimeData, quotaData, score] = await Promise.all([
        fetchComplianceChecks('iras_submission'),
        fetchComplianceChecks('leave_policy'),
        fetchComplianceChecks('overtime_rest_day'),
        fetchForeignWorkerQuota(),
        fetchComplianceScore()
      ]);
      
      setIrasSubmission(irasData);
      setLeavePolicyViolations(leaveData);
      setOvertimeBreaches(overtimeData);
      setForeignWorkerQuota(quotaData);
      setComplianceScore(score);
      
      toast({
        title: 'Compliance data refreshed',
        description: 'All compliance checks have been updated.'
      });
    } catch (error) {
      console.error('Error refreshing compliance data:', error);
      toast({
        title: 'Error refreshing data',
        description: 'Some compliance checks failed to update.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    user, 
    checkCPFValidation, 
    checkWorkPassExpiry, 
    checkMissingData,
    fetchComplianceChecks,
    fetchForeignWorkerQuota,
    fetchComplianceScore,
    toast
  ]);
  
  return {
    isLoading,
    complianceScore,
    cpfValidation,
    irasSubmission,
    workPassExpiry,
    missingDataChecks,
    leavePolicyViolations,
    overtimeBreaches,
    foreignWorkerQuota,
    refreshComplianceData,
    checkCPFValidation,
    checkWorkPassExpiry,
    checkMissingData
  };
};
