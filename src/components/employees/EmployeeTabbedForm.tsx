// src/components/employees/EmployeeTabbedForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { supabase, getAuthorizedClient } from '@/integrations/supabase/client';
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

      const employeeForDb: any = { ...employeeData };

      if (typeof employeeForDb.disciplinary_flags === 'string') {
        employeeForDb.disciplinary_flags = employeeForDb.disciplinary_flags === 'Yes' || 
                                           employeeForDb.disciplinary_flags === 'true' || 
                                           employeeForDb.disciplinary_flags === true;
      }

      const supabase = getAuthorizedClient();

      if (mode === 'edit' && employeeForDb.id) {
        const { error } = await supabase
          .from('employees')
          .update(employeeForDb)
          .eq('id', employeeForDb.id)
          .eq('user_id', userId);

        if (error) throw error;
      } else if (mode === 'create') {
        const { id, ...createData } = employeeForDb;
        const { data: newEmployee, error } = await supabase
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
