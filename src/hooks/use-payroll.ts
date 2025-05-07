
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  PayrollPeriod,
  PayrollItem,
  PayrollAllowanceItem,
  PayrollDeductionItem,
  BankTemplate,
  CpfContribution
} from '@/types/payroll';

export const usePayrollPeriods = () => {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPayrollPeriods = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('payroll_periods')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setPeriods(data || []);
      } catch (error: any) {
        setError(error.message);
        toast({
          title: 'Error fetching payroll periods',
          description: error.message,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPayrollPeriods();
  }, [toast]);

  const createPayrollPeriod = async (periodData: Omit<PayrollPeriod, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('payroll_periods')
        .insert(periodData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setPeriods(prev => [data as PayrollPeriod, ...prev]);
      toast({
        title: 'Success',
        description: 'Payroll period created successfully',
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Error creating payroll period',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const updatePayrollPeriod = async (id: string, updates: Partial<PayrollPeriod>) => {
    try {
      const { data, error } = await supabase
        .from('payroll_periods')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setPeriods(prev => 
        prev.map(period => 
          period.id === id ? { ...period, ...data } as PayrollPeriod : period
        )
      );

      toast({
        title: 'Success',
        description: 'Payroll period updated successfully',
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Error updating payroll period',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  return { periods, loading, error, createPayrollPeriod, updatePayrollPeriod };
};

export const usePayrollItems = (payrollPeriodId?: string) => {
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPayrollItems = async () => {
      if (!payrollPeriodId) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('payroll_items')
          .select(`
            *,
            employees(id, full_name, job_title, department, email)
          `)
          .eq('payroll_period_id', payrollPeriodId)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setItems(data || []);
      } catch (error: any) {
        setError(error.message);
        toast({
          title: 'Error fetching payroll items',
          description: error.message,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPayrollItems();
  }, [payrollPeriodId, toast]);

  const createPayrollItem = async (itemData: Omit<PayrollItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('payroll_items')
        .insert(itemData)
        .select(`
          *,
          employees(id, full_name, job_title, department, email)
        `)
        .single();

      if (error) {
        throw error;
      }

      setItems(prev => [data as unknown as PayrollItem, ...prev]);
      toast({
        title: 'Success',
        description: 'Payroll item created successfully',
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Error creating payroll item',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const updatePayrollItem = async (id: string, updates: Partial<PayrollItem>) => {
    try {
      const { data, error } = await supabase
        .from('payroll_items')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          employees(id, full_name, job_title, department, email)
        `)
        .single();

      if (error) {
        throw error;
      }

      setItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, ...data } as unknown as PayrollItem : item
        )
      );

      toast({
        title: 'Success',
        description: 'Payroll item updated successfully',
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Error updating payroll item',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  return { items, loading, error, createPayrollItem, updatePayrollItem };
};

export const useBankTemplates = () => {
  const [templates, setTemplates] = useState<BankTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBankTemplates = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('bank_templates')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setTemplates(data || []);
      } catch (error: any) {
        setError(error.message);
        toast({
          title: 'Error fetching bank templates',
          description: error.message,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBankTemplates();
  }, [toast]);

  const createBankTemplate = async (templateData: Omit<BankTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('bank_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setTemplates(prev => [data as BankTemplate, ...prev]);
      toast({
        title: 'Success',
        description: 'Bank template created successfully',
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Error creating bank template',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const deleteBankTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bank_templates')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setTemplates(prev => prev.filter(template => template.id !== id));
      toast({
        title: 'Success',
        description: 'Bank template deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting bank template',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  return { templates, loading, error, createBankTemplate, deleteBankTemplate };
};

// CPF calculation utility
export const calculateCpfContributions = (
  wage: number, 
  age: number, 
  isPermanentResident: boolean = false, 
  prYear: number = 3
): CpfContribution => {
  // Simplified CPF calculation - in a real app, this would have more complex rules
  // based on Singapore's CPF contribution rates by age and wage bands
  
  let employeeRate = 0;
  let employerRate = 0;
  
  // Basic rates for Singapore citizens
  if (age <= 55) {
    employeeRate = 0.2;
    employerRate = 0.17;
  } else if (age <= 60) {
    employeeRate = 0.13;
    employerRate = 0.13;
  } else if (age <= 65) {
    employeeRate = 0.075;
    employerRate = 0.09;
  } else {
    employeeRate = 0.05;
    employerRate = 0.075;
  }
  
  // Adjust rates for PRs based on years of residency
  if (isPermanentResident) {
    if (prYear === 1) {
      employeeRate *= 0.33;
      employerRate *= 0.33;
    } else if (prYear === 2) {
      employeeRate *= 0.66;
      employerRate *= 0.66;
    }
    // Year 3+ is full rate
  }
  
  // Apply wage ceiling of $6,000
  const cappedWage = Math.min(wage, 6000);
  
  const employeeCpf = Math.round(cappedWage * employeeRate * 100) / 100;
  const employerCpf = Math.round(cappedWage * employerRate * 100) / 100;
  
  return {
    employee: employeeCpf,
    employer: employerCpf,
    total: employeeCpf + employerCpf
  };
};
