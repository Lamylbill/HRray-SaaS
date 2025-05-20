
import React, { useState, useEffect, useRef } from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui-custom/Button';
import { Employee, EmployeeFormData } from '@/types/employee';
import { Trash, Pencil, X as CancelIcon, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EmployeeTabbedForm } from './EmployeeTabbedForm';

interface EmployeeDetailsDialogProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: () => void;
}

export const EmployeeDetailsDialog: React.FC<EmployeeDetailsDialogProps> = ({
  employee,
  onEdit,
  onDelete,
}) => {
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${employee.full_name}? This action cannot be undone.`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employee.id);

      if (error) throw error;

      toast({
        title: 'Employee Deleted',
        description: `${employee.full_name} has been removed.`,
      });
      onDelete();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete employee',
        variant: 'destructive',
      });
    }
  };

  const handleEmployeeUpdate = async (formData: EmployeeFormData) => {
    try {
      console.log("EmployeeDetailsDialog: Updating employee with data:", formData.employee);
      console.log("EmployeeDetailsDialog: Employment status before update:", employee.employment_status);
      console.log("EmployeeDetailsDialog: Employment status from form:", formData.employee.employment_status);
      
      // Ensure we're updating the correct employee
      const updatedEmployee: Employee = {
        ...employee,
        ...formData.employee,
        id: employee.id,
        user_id: employee.user_id,
        // Explicitly ensure employment_status is included
        employment_status: formData.employee.employment_status || employee.employment_status
      };
      
      console.log("EmployeeDetailsDialog: Final payload to be sent to Supabase:", updatedEmployee);
      
      // Double-check direct update to Supabase
      const { data, error } = await supabase
        .from('employees')
        .update(updatedEmployee)
        .eq('id', employee.id)
        .select();
        
      if (error) throw error;

      console.log("EmployeeDetailsDialog: Response from Supabase update:", data);
      
      toast({
        title: 'Changes Saved',
        description: `Details for ${formData.employee.full_name || employee.full_name} updated.`,
      });

      // Ensure we pass the actual updated data returned from Supabase
      setViewMode('view');
      onEdit(data?.[0] || updatedEmployee);
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update employee',
        variant: 'destructive',
      });
    }
  };

  const initialFormData: EmployeeFormData = {
    employee: { ...employee },
  };

  const triggerFormSubmit = () => {
    if (formRef.current) {
      formRef.current.dispatchEvent(
        new Event('submit', { cancelable: true, bubbles: true })
      );
    }
  };

  const handleCancelEdit = () => {
    setViewMode('view');
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)] overflow-hidden">
      <div className="px-6 py-4 border-b flex-shrink-0">
        <DialogHeader>
          <DialogTitle>
            {viewMode === 'view' ? 'Employee Details' : 'Edit Employee Details'}
          </DialogTitle>
          <DialogDescription>
            {viewMode === 'view'
              ? 'View and manage employee information. Click "Edit Employee" to make changes.'
              : "Modify the employee's information below."}
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="flex-1 overflow-y-auto">
        <EmployeeTabbedForm
          key={employee.id}
          initialData={initialFormData}
          employee={employee}
          mode={viewMode === 'view' ? 'view' : 'edit'}
          onSuccess={handleEmployeeUpdate}
          isViewOnly={viewMode === 'view'}
          formRef={formRef}
          hideControls={true}
        />
      </div>

      <div className="bg-background border-t px-6 py-4 flex justify-between items-center flex-shrink-0 sticky bottom-0">
        {viewMode === 'view' ? (
          <>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="text-base px-6 py-2 rounded-full flex items-center gap-2 sm:w-auto"
            >
              <Trash className="h-4 w-4" />
              Delete
            </Button>
            <Button
              type="button"
              onClick={() => setViewMode('edit')}
              className="text-base px-6 py-2 rounded-full flex items-center gap-2 sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Pencil className="h-4 w-4" />
              Edit Employee
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              onClick={handleCancelEdit}
              variant="outline"
              className="text-base px-6 py-2 rounded-full flex items-center gap-2 sm:w-auto"
            >
              <CancelIcon className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={triggerFormSubmit}
              className="text-base px-6 py-2 rounded-full flex items-center gap-2 sm:w-auto bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="h-4 w-4" />
              Save Changes
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
