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

  useEffect(() => {
    console.log("EmployeeDetailsDialog: Rendered or viewMode/employee changed. Current viewMode:", viewMode, "Employee ID:", employee?.id);
  }, [viewMode, employee]);

  const handleDelete = async () => {
    console.log("EmployeeDetailsDialog: handleDelete triggered for employee ID:", employee.id);
    if (!window.confirm(`Are you sure you want to delete ${employee.full_name}? This action cannot be undone.`)) {
        return;
    }
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employee.id);

      if (error) {
        console.error('EmployeeDetailsDialog: Error deleting employee:', error);
        throw error;
      }

      toast({
        title: 'Employee Deleted',
        description: `${employee.full_name} has been removed.`,
      });
      console.log("EmployeeDetailsDialog: Employee deleted successfully, calling onDelete prop.");
      onDelete();
    } catch (error: any) {
      console.error('EmployeeDetailsDialog: Catch block in handleDelete:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete employee',
        variant: 'destructive',
      });
    }
  };

  const handleEmployeeUpdate = (formData: EmployeeFormData) => {
    console.log("EmployeeDetailsDialog: handleEmployeeUpdate called with formData. Employee ID:", employee.id, "Form Data Employee Name:", formData.employee.full_name);
    toast({
      title: 'Changes Saved',
      description: `Details for ${formData.employee.full_name || employee.full_name} updated.`,
    });

    const updatedEmployee: Employee = {
      ...employee,
      ...formData.employee,
      id: employee.id,
      user_id: employee.user_id,
    };

    setViewMode('view');
    onEdit(updatedEmployee);
  };

  const initialFormData: EmployeeFormData = {
    employee: { ...employee },
  };

  const triggerFormSubmit = () => {
    if (formRef.current) {
      formRef.current.dispatchEvent(
        new Event('submit', { cancelable: true, bubbles: true })
      );
    } else {
      console.warn("EmployeeDetailsDialog: formRef.current is null. Cannot trigger submit.");
    }
  };

  const handleCancelEdit = () => {
    console.log("EmployeeDetailsDialog: Edit cancelled. Setting viewMode to 'view'.");
    setViewMode('view');
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)] overflow-hidden">
      <div className="px-6 py-4 border-b flex-shrink-0">
        <DialogHeader>
          <DialogTitle>
            {viewMode === 'view' ? 'Employee Details' : 'Edit Employee Details'}
          </DialogTitle>
          {viewMode === 'view' && (
            <DialogDescription>
              View and manage employee information. Click "Edit Employee" to make changes.
            </DialogDescription>
          )}
          {viewMode === 'edit' && (
            <DialogDescription>
              Modify the employee's information below.
            </DialogDescription>
          )}
        </DialogHeader>
      </div>

      <div className="flex-1 overflow-y-auto">
        <EmployeeTabbedForm
          key={employee.id}
          initialData={initialFormData}
          employee={employee}
          mode={viewMode}
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
              onClick={() => {
                console.log("EmployeeDetailsDialog: Edit button clicked. Setting viewMode to 'edit'.");
                setViewMode('edit');
              }}
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
