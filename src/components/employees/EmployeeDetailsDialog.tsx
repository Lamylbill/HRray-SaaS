import React, { useState } from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui-custom/Button';
import { Employee, EmployeeFormData } from '@/types/employee';
import { Trash, Pencil, X as CancelIcon, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuthorizedClient } from '@/integrations/supabase/client';
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
  // Reference to the form to trigger submit programmatically
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleDelete = async () => {
    try {
      const supabase = getAuthorizedClient();
      
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employee.id);

      if (error) throw error;

      toast({
        title: 'Employee Deleted',
        description: `${employee.full_name} has been removed from the system.`,
      });

      onDelete();
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete employee',
        variant: 'destructive',
      });
    }
  };

  const handleEmployeeUpdate = (formData: EmployeeFormData) => {
    toast({
      title: 'Changes Saved',
      description: `Employee details for ${formData.employee.full_name} have been updated.`,
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
    employee: employee,
  };

  // Function to trigger form submission from outside the form
  const triggerFormSubmit = () => {
    if (formRef.current) {
      formRef.current.dispatchEvent(
        new Event('submit', { cancelable: true, bubbles: true })
      );
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[90vh] overflow-hidden">
      <div className="px-6 py-4 border-b flex-shrink-0">
        <DialogHeader>
          <DialogTitle>
            {viewMode === 'view' ? 'Employee Details' : 'Edit Employee'}
          </DialogTitle>
          {viewMode === 'view' && (
            <DialogDescription>
              View and manage employee information
            </DialogDescription>
          )}
        </DialogHeader>
      </div>

      <div className="flex-1 overflow-auto">
        <EmployeeTabbedForm
          initialData={initialFormData}
          mode={viewMode}
          onSuccess={handleEmployeeUpdate}
          onCancel={() => setViewMode('view')}
          isViewOnly={viewMode === 'view'}
          formRef={formRef}
          hideControls={true} // Hide controls in the form since we'll show them in the dialog
        />
      </div>

      {/* These are the controls that appear at the bottom of the dialog */}
      <div className="bg-white border-t px-6 py-4 flex justify-between items-center flex-shrink-0 sticky bottom-0">
        {viewMode === 'view' ? (
          <>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="text-base px-6 py-2 rounded-full flex items-center gap-2 w-[180px]"
            >
              <Trash className="h-4 w-4" />
              Delete Employee
            </Button>
            <Button
              type="button"
              onClick={() => setViewMode('edit')}
              className="text-base px-6 py-2 rounded-full flex items-center gap-2 w-[180px]"
            >
              <Pencil className="h-4 w-4" />
              Edit Employee
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              onClick={() => setViewMode('view')}
              variant="outline"
              className="text-base px-6 py-2 rounded-full flex items-center gap-2 w-[180px]"
            >
              <CancelIcon className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={triggerFormSubmit}
              className="text-base px-6 py-2 rounded-full flex items-center gap-2 w-[180px]"
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
