
import React, { useState, useEffect } from 'react';
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

interface EmployeeTabbedFormProps {
  employee?: any;
  onSubmit: (data: EmployeeFormData) => void;
  isSubmitting?: boolean;
  isReadOnly?: boolean;
}

export const EmployeeTabbedForm: React.FC<EmployeeTabbedFormProps> = ({
  employee,
  onSubmit,
  isSubmitting = false,
  isReadOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState('personal-info');
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  
  const methods = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: employee || {
      employee: {
        id: '',
        first_name: '',
        last_name: '',
        email: '',
        // Add other default values here
      }
    }
  });

  const handleSubmit = (data: EmployeeFormData) => {
    onSubmit(data);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Fix the type comparison issue - convert string to boolean when necessary
  const isDocumentsTab = (tabKey: string) => {
    return tabKey === 'documents' || tabKey === true;
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleSubmit)} className="h-full flex flex-col">
        <TabNav 
          activeTab={activeTab} 
          onChange={handleTabChange} 
          className="mb-6"
        />
        
        <div className="flex-1 overflow-y-auto pb-6">
          {activeTab === 'personal-info' && (
            <PersonalInfoTab 
              isViewOnly={isReadOnly} 
              showAdvancedFields={showAdvancedFields}
              onToggleAdvanced={setShowAdvancedFields}
            />
          )}
          
          {activeTab === 'employment-info' && (
            <EmploymentInfoTab 
              isViewOnly={isReadOnly} 
              showAdvancedFields={showAdvancedFields}
              onToggleAdvanced={setShowAdvancedFields}
            />
          )}
          
          {activeTab === 'contract-lifecycle' && (
            <ContractLifecycleTab 
              isViewOnly={isReadOnly} 
              showAdvancedFields={showAdvancedFields}
              onToggleAdvanced={setShowAdvancedFields}
            />
          )}
          
          {activeTab === 'compensation-benefits' && (
            <CompensationBenefitsTab 
              isViewOnly={isReadOnly} 
              showAdvancedFields={showAdvancedFields}
              onToggleAdvanced={setShowAdvancedFields}
            />
          )}
          
          {activeTab === 'compliance' && (
            <ComplianceTab 
              isViewOnly={isReadOnly} 
              showAdvancedFields={showAdvancedFields}
              onToggleAdvanced={setShowAdvancedFields}
            />
          )}
          
          {isDocumentsTab(activeTab) && employee?.id && (
            <DocumentsTab 
              employeeId={employee.id} 
              isReadOnly={isReadOnly} 
            />
          )}
        </div>
        
        {!isReadOnly && (
          <div className="border-t py-4 px-4 sm:px-6 md:px-8 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Employee'}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
};
