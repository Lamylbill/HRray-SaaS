import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'; // Verify path
import { Button } from '@/components/ui-custom/Button'; // Verify path
import { Employee, EmployeeFormData } from '@/types/employee'; // Verify path
import { Trash, Pencil, X as CancelIcon, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // Verify path
import { getAuthorizedClient } from '@/integrations/supabase/client'; // Verify path
import { EmployeeTabbedForm } from './EmployeeTabbedForm'; // Verify path

interface EmployeeDetailsDialogProps {
  employee: Employee;
  onEdit: (employee: Employee) => void; // This is called after successful edit
  onDelete: () => void; // This is called after successful delete
  // Add onCancel prop if the parent controls visibility and needs to be notified to close
  // onCancelDialog?: () => void; 
}

export const EmployeeDetailsDialog: React.FC<EmployeeDetailsDialogProps> = ({
  employee,
  onEdit,
  onDelete,
  // onCancelDialog 
}) => {
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null); // Ref for the EmployeeTabbedForm

  // --- DEBUG LOG: Log when component mounts/updates and viewMode changes ---
  useEffect(() => {
    console.log("EmployeeDetailsDialog: Rendered or viewMode/employee changed. Current viewMode:", viewMode, "Employee ID:", employee?.id);
  }, [viewMode, employee]);
  // ---

  const handleDelete = async () => {
    console.log("EmployeeDetailsDialog: handleDelete triggered for employee ID:", employee.id);
    // Optional: Add a window.confirm here for safety
    if (!window.confirm(`Are you sure you want to delete ${employee.full_name}? This action cannot be undone.`)) {
        return;
    }
    try {
      const supabase = getAuthorizedClient();
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
      onDelete(); // This should notify the parent to update its list and possibly close this dialog
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
    // --- DEBUG LOG ---
    console.log("EmployeeDetailsDialog: handleEmployeeUpdate called with formData. Employee ID:", employee.id, "Form Data Employee Name:", formData.employee.full_name);
    // ---
    toast({
      title: 'Changes Saved',
      description: `Details for ${formData.employee.full_name || employee.full_name} updated.`,
    });

    // Construct the updated employee object carefully
    const updatedEmployee: Employee = {
      ...employee, // Start with existing employee data
      ...formData.employee, // Override with form data
      id: employee.id, // Ensure ID is preserved
      user_id: employee.user_id, // Ensure user_id is preserved (if it exists on Employee type)
    };
    
    console.log("EmployeeDetailsDialog: Setting viewMode to 'view' and calling onEdit prop.");
    setViewMode('view');
    onEdit(updatedEmployee); // Notify parent of the update
                            // Parent component might close the dialog upon receiving this
  };

  const initialFormData: EmployeeFormData = {
    employee: { ...employee }, // Ensure it's a copy to avoid direct state mutation if employee prop changes
    // Add other sections of EmployeeFormData if they exist and need to be pre-filled
  };

  // Function to trigger form submission from outside the form (Save Changes button)
  const triggerFormSubmit = () => {
    console.log("EmployeeDetailsDialog: triggerFormSubmit called. Attempting to submit EmployeeTabbedForm.");
    if (formRef.current) {
      // This creates and dispatches a synthetic submit event
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
    // If there's an onCancelDialog prop to close the whole dialog:
    // if (onCancelDialog) onCancelDialog();
  };

  return (
    // Ensure parent DialogContent sets overflow-hidden if this structure is used
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)] overflow-hidden"> {/* Adjusted max-h for viewport with margins */}
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

      {/* The form itself with scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Pass employee directly if EmployeeTabbedForm is designed to re-initialize with it */}
        {/* Or rely on defaultValues of useForm, but ensure key prop if initialData needs to force re-init */}
        <EmployeeTabbedForm
          key={employee.id} // Adding key might help re-initialize form if employee prop changes significantly
          initialData={initialFormData} // This is defaultValues for react-hook-form
          employee={employee} // Pass current employee data for display in view mode or as reference
          mode={viewMode}
          onSuccess={handleEmployeeUpdate} // This is the callback when EmployeeTabbedForm's internal submit succeeds
          // onCancel for EmployeeTabbedForm is to cancel its *internal* edit, not this dialog
          // onCancel={() => setViewMode('view')} // This would be if EmployeeTabbedForm had its own cancel for edit
          isViewOnly={viewMode === 'view'} // Pass viewOnly status
          formRef={formRef} // Pass the ref to EmployeeTabbedForm
          hideControls={true} // We are providing controls at the Dialog level
        />
      </div>

      {/* Dialog-level Action Buttons */}
      <div className="bg-background border-t px-6 py-4 flex justify-between items-center flex-shrink-0 sticky bottom-0">
        {viewMode === 'view' ? (
          <>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="text-base px-6 py-2 rounded-full flex items-center gap-2 sm:w-auto" // Adjusted width
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
              className="text-base px-6 py-2 rounded-full flex items-center gap-2 sm:w-auto bg-blue-600 hover:bg-blue-700 text-white" // Example primary styling
            >
              <Pencil className="h-4 w-4" />
              Edit Employee
            </Button>
          </>
        ) : ( // Edit Mode Buttons
          <>
            <Button
              type="button"
              onClick={handleCancelEdit} // This button cancels edit mode, returns to view mode
              variant="outline"
              className="text-base px-6 py-2 rounded-full flex items-center gap-2 sm:w-auto"
            >
              <CancelIcon className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="button" // Important: This button *triggers* the form submit, not a submit type itself
              onClick={triggerFormSubmit}
              className="text-base px-6 py-2 rounded-full flex items-center gap-2 sm:w-auto bg-green-600 hover:bg-green-700 text-white" // Example save styling
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