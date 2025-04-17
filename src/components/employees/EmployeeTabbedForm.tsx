
import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { getAuthorizedClient, supabase } from '@/integrations/supabase/client';
import { Employee, EmployeeFormData } from '@/types/employee';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Plus, X as CancelIcon } from 'lucide-react';
import { standardizeEmployee } from '@/utils/employeeFieldUtils';

import { Button } from '@/components/ui-custom/Button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProfilePhotoUploader } from './ProfilePhotoUploader';
import { PersonalInfoTab } from './tabs/PersonalInfoTab';
import { EmploymentInfoTab } from './tabs/EmploymentInfoTab';
import { ContractLifecycleTab } from './tabs/ContractLifecycleTab';
import { CompensationBenefitsTab } from './tabs/CompensationBenefitsTab';
import { ComplianceTab } from './tabs/ComplianceTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { TabNav } from './tabs/TabNav';

interface EmployeeTabbedFormProps {
  initialData?: Partial<EmployeeFormData>;
  onSuccess: (data: EmployeeFormData) => void;
  onCancel: () => void;
  isViewOnly?: boolean;
  mode: 'create' | 'edit' | 'view';
  defaultTab?: string;
  formRef?: React.RefObject<HTMLFormElement>;
  hideControls?: boolean;
}

export const EmployeeTabbedForm: React.FC<EmployeeTabbedFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
  isViewOnly = false,
  mode,
  defaultTab = 'personal-info',
  formRef,
  hideControls = false,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  const processedInitialData = initialData ? {
    ...initialData,
    employee: initialData.employee ? standardizeEmployee(initialData.employee) : initialData.employee
  } : undefined;

  const methods = useForm<EmployeeFormData>({
    defaultValues: processedInitialData || {
      employee: {
        id: '',
        user_id: '',
        email: '',
        full_name: '',
      },
    },
    mode: 'onSubmit',
  });

  const { handleSubmit, watch, setValue } = methods;
  const employeeData = watch('employee');

  useEffect(() => {
    const checkUser = async () => {
      setAuthError(null);
      if (user?.id) {
        setValue('employee.user_id', user.id);
        setIsUserLoaded(true);
        return;
      }

      try {
        const authorizedClient = getAuthorizedClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          setAuthError('Unable to verify session. Please log in again.');
          return;
        }
        if (session?.user?.id) {
          setValue('employee.user_id', session.user.id);
          setIsUserLoaded(true);
        } else {
          setAuthError('No user session found. Please log in.');
        }
      } catch {
        setAuthError('Authentication error. Please try again.');
      }
    };

    checkUser();
  }, [user, setValue]);

  const onSubmit = async (data: EmployeeFormData) => {
    const userId = data.employee.user_id?.trim() || user?.id;

    if (!userId) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to create or update an employee.',
        variant: 'destructive',
      });
      return;
    }

    const employeeData = standardizeEmployee(data.employee);

    if (!employeeData.email || !employeeData.full_name) {
      toast({
        title: 'Validation Error',
        description: 'Email and Full Name are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Clean up the employee data before saving to remove any fields not in the schema
      const employeeForDb: any = { ...employeeData };

      // Remove the category field which is causing the error
      delete employeeForDb.category;

      // Process boolean fields
      if (typeof employeeForDb.disciplinary_flags === 'string') {
        employeeForDb.disciplinary_flags = employeeForDb.disciplinary_flags === 'Yes' || 
                                        employeeForDb.disciplinary_flags === 'true' || 
                                        employeeForDb.disciplinary_flags === true;
      }
      
      if (typeof employeeForDb.cpf_contribution === 'string') {
        employeeForDb.cpf_contribution = employeeForDb.cpf_contribution === 'Yes' || 
                                      employeeForDb.cpf_contribution === 'true' || 
                                      employeeForDb.cpf_contribution === true;
      }
      
      if (typeof employeeForDb.must_clock === 'string') {
        employeeForDb.must_clock = employeeForDb.must_clock === 'Yes' || 
                                employeeForDb.must_clock === 'true' || 
                                employeeForDb.must_clock === true;
      }
      
      if (typeof employeeForDb.all_work_day === 'string') {
        employeeForDb.all_work_day = employeeForDb.all_work_day === 'Yes' || 
                                  employeeForDb.all_work_day === 'true' || 
                                  employeeForDb.all_work_day === true;
      }
      
      if (typeof employeeForDb.freeze_payment === 'string') {
        employeeForDb.freeze_payment = employeeForDb.freeze_payment === 'Yes' || 
                                    employeeForDb.freeze_payment === 'true' || 
                                    employeeForDb.freeze_payment === true;
      }
      
      if (typeof employeeForDb.paid_medical_examination_fee === 'string') {
        employeeForDb.paid_medical_examination_fee = employeeForDb.paid_medical_examination_fee === 'Yes' || 
                                                  employeeForDb.paid_medical_examination_fee === 'true' || 
                                                  employeeForDb.paid_medical_examination_fee === true;
      }
      
      if (typeof employeeForDb.new_graduate === 'string') {
        employeeForDb.new_graduate = employeeForDb.new_graduate === 'Yes' || 
                                  employeeForDb.new_graduate === 'true' || 
                                  employeeForDb.new_graduate === true;
      }
      
      if (typeof employeeForDb.rehire === 'string') {
        employeeForDb.rehire = employeeForDb.rehire === 'Yes' || 
                            employeeForDb.rehire === 'true' || 
                            employeeForDb.rehire === true;
      }
      
      if (typeof employeeForDb.contract_signed === 'string') {
        employeeForDb.contract_signed = employeeForDb.contract_signed === 'Yes' || 
                                      employeeForDb.contract_signed === 'true' || 
                                      employeeForDb.contract_signed === true;
      }
      
      if (typeof employeeForDb.thirteenth_month_entitlement === 'string') {
        employeeForDb.thirteenth_month_entitlement = employeeForDb.thirteenth_month_entitlement === 'Yes' || 
                                                  employeeForDb.thirteenth_month_entitlement === 'true' || 
                                                  employeeForDb.thirteenth_month_entitlement === true;
      }
      
      // Convert numeric fields that might be strings
      if (typeof employeeForDb.annual_bonus_eligible === 'string' && !isNaN(parseFloat(employeeForDb.annual_bonus_eligible))) {
        employeeForDb.annual_bonus_eligible = parseFloat(employeeForDb.annual_bonus_eligible);
      }
      
      if (typeof employeeForDb.basic_salary === 'string' && !isNaN(parseFloat(employeeForDb.basic_salary))) {
        employeeForDb.basic_salary = parseFloat(employeeForDb.basic_salary);
      }
      
      if (typeof employeeForDb.gross_salary === 'string' && !isNaN(parseFloat(employeeForDb.gross_salary))) {
        employeeForDb.gross_salary = parseFloat(employeeForDb.gross_salary);
      }
      
      if (typeof employeeForDb.allowances === 'string' && !isNaN(parseFloat(employeeForDb.allowances))) {
        employeeForDb.allowances = parseFloat(employeeForDb.allowances);
      }

      const authorizedClient = getAuthorizedClient();

      if (mode === 'edit' && employeeForDb.id) {
        const { error } = await authorizedClient
          .from('employees')
          .update(employeeForDb)
          .eq('id', employeeForDb.id)
          .eq('user_id', userId);

        if (error) throw error;
      } else if (mode === 'create') {
        const { id, ...createData } = employeeForDb;
        
        const { data: newEmployee, error } = await authorizedClient
          .from('employees')
          .insert({ ...createData, user_id: userId })
          .select()
          .single();

        if (error) throw error;
        if (newEmployee) {
          data.employee.id = newEmployee.id;
        }
      }

      toast({
        title: mode === 'create' ? 'Employee Created' : 'Employee Updated',
        description: `${employeeData.full_name} has been saved.`,
      });

      onSuccess(data);
      if (mode === 'create') {
        setTimeout(() => setActiveTab('documents'), 500);
      }
    } catch (error: any) {
      console.error('Error saving employee:', error);
      toast({
        title: 'Save Error',
        description: error.message || 'An error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal-info':
        return <PersonalInfoTab isViewOnly={isViewOnly} showAdvancedFields={showAdvancedFields} onToggleAdvanced={setShowAdvancedFields} />;
      case 'employment-info':
        return <EmploymentInfoTab isViewOnly={isViewOnly} showAdvancedFields={showAdvancedFields} onToggleAdvanced={setShowAdvancedFields} />;
      case 'contract-lifecycle':
        return <ContractLifecycleTab isViewOnly={isViewOnly} showAdvancedFields={showAdvancedFields} onToggleAdvanced={setShowAdvancedFields} />;
      case 'compensation-benefits':
        return <CompensationBenefitsTab isViewOnly={isViewOnly} showAdvancedFields={showAdvancedFields} onToggleAdvanced={setShowAdvancedFields} />;
      case 'compliance':
        return <ComplianceTab isViewOnly={isViewOnly} showAdvancedFields={showAdvancedFields} onToggleAdvanced={setShowAdvancedFields} />;
      case 'documents':
        return employeeData?.id ? (
          <DocumentsTab employeeId={employeeData.id} isReadOnly={isViewOnly} />
        ) : (
          <div className="p-6 flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Save Required</h3>
            <p className="mb-4 text-muted-foreground">Please save the employee details before accessing documents.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TabNav activeTab={activeTab} onChange={setActiveTab} />

      <FormProvider {...methods}>
        <form
          id="employee-form"
          ref={formRef}
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col h-full overflow-hidden"
        >
          {authError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          <div className="flex-1 overflow-auto p-4">
            {renderTabContent()}
          </div>

          {!isViewOnly && !hideControls && (
            <div className="flex justify-end gap-2 p-4 border-t bg-white mt-auto">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={onCancel}
              >
                <CancelIcon className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                <Plus className="mr-2 h-4 w-4" />
                {mode === 'create' ? 'Create Employee' : 'Save Changes'}
              </Button>
            </div>
          )}
        </form>
      </FormProvider>
    </div>
  );
};
