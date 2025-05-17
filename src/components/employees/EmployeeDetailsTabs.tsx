import React, { useState, useEffect } from 'react';
import { Employee } from '@/types/employee';
import { formatPhoneNumber, formatCurrency, formatDate } from '@/utils/formatters';
import { Button } from '@/components/ui-custom/Button';
import { Edit, Save, Upload } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { DocumentManager } from '@/components/employees/documents/DocumentManager';
import { TabNav } from '@/components/employees/tabs/TabNav';
import { ensureStorageBucket, STORAGE_BUCKET } from '@/integrations/supabase/client';
import { DocumentManagerProps } from '@/components/employees/tabs/DocumentsTab';

interface EmployeeDetailsTabsProps {
  employee: Employee;
  onSuccess: () => void;
  onCancel: () => void;
  isViewOnly?: boolean;
}

export const EmployeeDetailsTabs: React.FC<EmployeeDetailsTabsProps> = ({
  employee,
  onSuccess,
  onCancel,
  isViewOnly = false
}) => {
  const [activeTab, setActiveTab] = useState('personal-info');
  const [refreshDocuments, setRefreshDocuments] = useState(0);
  const [bucketReady, setBucketReady] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if storage bucket is ready
    const checkBucket = async () => {
      const ready = await ensureStorageBucket(STORAGE_BUCKET);
      setBucketReady(ready);
    };
    
    checkBucket();
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'documents') {
      setRefreshDocuments(prev => prev + 1);
    }
  };

  // View mode content for each tab
  const renderViewContent = () => {
    switch (activeTab) {
      case 'personal-info':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-lg mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">
                    {employee.full_name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium">{employee.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nationality</p>
                  <p className="font-medium">{employee.nationality || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">{formatDate(employee.date_of_birth)}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-lg mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{employee.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{formatPhoneNumber(employee.contact_number) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Identity Number</p>
                  <p className="font-medium">{employee.nric || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Marital Status</p>
                  <p className="font-medium">{employee.marital_status || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'employment-info':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-lg mb-4">Employment Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Date of Hire</p>
                  <p className="font-medium">{formatDate(employee.date_of_hire)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium">{employee.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Designation</p>
                  <p className="font-medium">{employee.job_title || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employment Type</p>
                  <p className="font-medium">{employee.employment_type || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-lg mb-4">Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Manager</p>
                  <p className="font-medium">{employee.supervisor || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employment Status</p>
                  <p className="font-medium">{employee.employment_status || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employee Code</p>
                  <p className="font-medium">{employee.employee_code || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'contract-lifecycle':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-lg mb-4">Contract Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Contract Type</p>
                  <p className="font-medium">{employee.contract_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contract Start Date</p>
                  <p className="font-medium">{formatDate(employee.contract_start)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contract End Date</p>
                  <p className="font-medium">{formatDate(employee.contract_end)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Probation Period</p>
                  <p className="font-medium">{employee.probation_end ? `Until ${formatDate(employee.probation_end)}` : 'N/A'}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-lg mb-4">Lifecycle Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Confirmation Date</p>
                  <p className="font-medium">{formatDate(employee.confirmation_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Resignation Date</p>
                  <p className="font-medium">{formatDate(employee.resignation_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Working Day</p>
                  <p className="font-medium">{formatDate(employee.last_working_day)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Exit Reason</p>
                  <p className="font-medium">{employee.exit_reason || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'compensation-benefits':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-lg mb-4">Salary Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Salary</p>
                  <p className="font-medium">{formatCurrency (employee.gross_salary) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Basic Salary</p>
                  <p className="font-medium">{formatCurrency (employee.basic_salary) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">CPF Contribution</p>
                  <p className="font-medium">{employee.cpf_contribution || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Allowances</p>
                  <p className="font-medium">{formatCurrency (employee.allowances) || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-lg mb-4">Banking Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Bank Name</p>
                  <p className="font-medium">{employee.bank_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bank Account Number</p>
                  <p className="font-medium">{employee.bank_account || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pay Mode</p>
                  <p className="font-medium">{employee.pay_mode || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'compliance':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-lg mb-4">Compliance Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">CPF Status</p>
                  <p className="font-medium">{employee.cpf_status || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tax File No</p>
                  <p className="font-medium">{employee.tax_file_no || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">MOM Status</p>
                  <p className="font-medium">{employee.mom_status || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-lg mb-4">Work Pass Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Work Pass Type</p>
                  <p className="font-medium">{employee.work_pass_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">CPF Account</p>
                  <p className="font-medium">{employee.cpf_account || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Work Pass Number</p>
                  <p className="font-medium">{employee.work_pass_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Work Pass Expiry</p>
                  <p className="font-medium">{formatDate(employee.work_pass_expiry)}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'documents':
        return null; // DocumentManager will be rendered directly in the tab content
      default:
        return <div>Select a tab to view employee information</div>;
    }
  };

  // Render a form or view component based on isViewOnly flag
  const renderFormContent = () => {
    if (isViewOnly) {
      return renderViewContent();
    }
    
    if (activeTab !== 'documents') {
      return (
        <div className="p-4">Content will be handled by AddEmployeeForm for editable mode</div>
      );
    }
    
    return null; // DocumentManager will be rendered directly
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TabNav 
        activeTab={activeTab} 
        onChange={handleTabChange} 
      />
      
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'documents' && employee && employee.id ? (
          <DocumentManager 
            employeeId={employee.id}
            refreshTrigger={refreshDocuments}
            isTabbed={true}
            bucketReady={bucketReady}
          />
        ) : activeTab === 'documents' ? (
          <div className="p-6 border border-dashed rounded-md text-center bg-gray-50">
            <p className="font-medium mb-2">Save employee record first to enable document uploads</p>
            <p className="text-sm text-gray-500 mb-4">
              You need to save the employee details before you can upload documents.
            </p>
            <Button variant="primary" onClick={onSuccess}>
              <Save className="mr-2 h-4 w-4" />
              Save Employee Details
            </Button>
          </div>
        ) : (
          renderFormContent()
        )}
      </div>
      
      {!isViewOnly && activeTab !== 'documents' && (
        <div className="mt-auto p-4 border-t flex justify-end gap-2 bg-white">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="employee-form">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
          
          {employee && employee.id && (
            <Button 
              variant="outline" 
              onClick={() => setActiveTab('documents')}
              className="ml-4"
            >
              <Upload className="mr-2 h-4 w-4" />
              Manage Documents
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
