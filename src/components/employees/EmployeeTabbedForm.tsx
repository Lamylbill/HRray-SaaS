
import React, { useState, useEffect, forwardRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PersonalInfoTab } from './tabs/PersonalInfoTab';
import { EmploymentInfoTab } from './tabs/EmploymentInfoTab';
import { ContractLifecycleTab } from './tabs/ContractLifecycleTab';
import { CompensationBenefitsTab } from './tabs/CompensationBenefitsTab';
import { ComplianceTab } from './tabs/ComplianceTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { employeeFormSchema } from '@/utils/employeeFieldUtils';
import { EmployeeFormData } from '@/types/employee';
import { TabNav } from './tabs/TabNav';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface EmployeeTabbedFormProps {
  employee?: any;
  initialData?: EmployeeFormData;
  onSubmit?: (data: EmployeeFormData) => void;
  onSuccess?: (data: EmployeeFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  isReadOnly?: boolean;
  isViewOnly?: boolean;
  mode?: 'create' | 'edit' | 'view';
  defaultTab?: string;
  formRef?: React.RefObject<HTMLFormElement>;
  hideControls?: boolean;
}

export const EmployeeTabbedForm = forwardRef<HTMLFormElement, EmployeeTabbedFormProps>(({
  employee,
  initialData,
  onSubmit,
  onSuccess,
  onCancel,
  isSubmitting = false,
  isReadOnly = false,
  isViewOnly = false,
  mode = 'create',
  defaultTab = 'personal-info',
  formRef,
  hideControls = false
}, ref) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const methods = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: initialData || {
      employee: {
        id: '',
        full_name: '',
        email: '',
        contact_number: '',
        gender: '',
        nationality: '',
        date_of_birth: '',
      }
    }
  });

  const handleSubmit = async (data: EmployeeFormData) => {
    console.log("EmployeeTabbedForm: handleSubmit triggered. Mode:", mode, "isProcessing:", isProcessing);
    if (isProcessing) return;
    setIsProcessing(true);
    const supabase = getAuthorizedClient();
  
    try {
      console.log('Data to submit:', data.employee);
  
      // Prepare employee data with all the required fields
      const payload = {
        full_name: data.employee.full_name || '',
        email: data.employee.email || '',
        contact_number: data.employee.contact_number || '',
        gender: data.employee.gender || '',
        nationality: data.employee.nationality || '',
        date_of_birth: data.employee.date_of_birth || null,
        user_id: user?.id || null,
        employment_status: 'Active',
      };
  
      let result;
      
      if (mode === 'create') {
        // For create operations, use direct table access instead of a view
        result = await supabase
          .from('employees') // Use the base table instead of a view
          .insert(payload)
          .select('id')
          .single();
  
        if (result.error) {
          console.error('Error inserting employee:', result.error);
          throw result.error;
        }
        
        // Update the employee ID in the form data
        if (result.data) {
          data.employee.id = result.data.id;
          toast.success('Employee created successfully');
        }
      } else if (mode === 'edit' && data.employee.id) {
        // For updates, also use the direct table
        result = await supabase
          .from('employees') // Use the base table instead of a view
          .update(payload)
          .eq('id', data.employee.id)
          .select();
  
        if (result.error) {
          console.error('Error updating employee:', result.error);
          throw result.error;
        }
  
        toast.success('Employee updated successfully');
      }
  
      if (onSuccess) onSuccess(data);
    } catch (error: any) {
      console.error('Error saving employee:', error);
      toast.error(`Failed to save employee: ${error.message || 'Please check required fields'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const isDocumentsTab = (tabKey: string) => tabKey === 'documents';

  return (
    <FormProvider {...methods}>
      <form 
        onSubmit={methods.handleSubmit(handleSubmit)} 
        className="h-full flex flex-col"
        ref={formRef || ref}
      >
        <TabNav 
          activeTab={activeTab} 
          onChange={handleTabChange} 
          className="mb-6"
        />

        <div className="flex-1 overflow-y-auto pb-6">
          {activeTab === 'personal-info' && (
            <PersonalInfoTab 
              isViewOnly={isViewOnly || isReadOnly} 
              showAdvancedFields={showAdvancedFields}
              onToggleAdvanced={setShowAdvancedFields}
            />
          )}

          {activeTab === 'employment-info' && (
            <EmploymentInfoTab 
              isViewOnly={isViewOnly || isReadOnly} 
              showAdvancedFields={showAdvancedFields}
              onToggleAdvanced={setShowAdvancedFields}
            />
          )}

          {activeTab === 'contract-lifecycle' && (
            <ContractLifecycleTab 
              isViewOnly={isViewOnly || isReadOnly} 
              showAdvancedFields={showAdvancedFields}
              onToggleAdvanced={setShowAdvancedFields}
            />
          )}

          {activeTab === 'compensation-benefits' && (
            <CompensationBenefitsTab 
              isViewOnly={isViewOnly || isReadOnly} 
              showAdvancedFields={showAdvancedFields}
              onToggleAdvanced={setShowAdvancedFields}
            />
          )}

          {activeTab === 'compliance' && (
            <ComplianceTab 
              isViewOnly={isViewOnly || isReadOnly} 
              showAdvancedFields={showAdvancedFields}
              onToggleAdvanced={setShowAdvancedFields}
            />
          )}

          {isDocumentsTab(activeTab) && initialData?.employee?.id && (
            <DocumentsTab 
              employeeId={initialData.employee.id} 
              isReadOnly={isViewOnly || isReadOnly} 
            />
          )}
        </div>

        {!(isViewOnly || isReadOnly) && !hideControls && (
          <div className="border-t py-4 px-4 sm:px-6 md:px-8 flex justify-end">
            {onCancel && (
              <Button type="button" variant="outline" className="mr-2" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || isProcessing}>
              {isSubmitting || isProcessing ? 'Saving...' : mode === 'create' ? 'Create Employee' : 'Save Changes'}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
});

EmployeeTabbedForm.displayName = 'EmployeeTabbedForm';

export default EmployeeTabbedForm;
