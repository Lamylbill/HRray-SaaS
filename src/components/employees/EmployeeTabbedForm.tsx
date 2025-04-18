
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
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  
  const methods = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: initialData || employee ? {
      employee: employee || initialData?.employee || {
        id: '',
        full_name: '',
        email: '',
        // Add other default values here
      }
    } : {
      employee: {
        id: '',
        full_name: '',
        email: '',
      }
    }
  });

  const handleSubmit = (data: EmployeeFormData) => {
    if (onSubmit) onSubmit(data);
    if (onSuccess) onSuccess(data);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Fix the type comparison issue - convert string to boolean when necessary
  const isDocumentsTab = (tabKey: string) => {
    return tabKey === 'documents';
  };

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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Employee' : 'Save Employee'}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
});

EmployeeTabbedForm.displayName = 'EmployeeTabbedForm';
