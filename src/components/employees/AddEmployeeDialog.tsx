
import React from 'react';
import { DialogContent } from '@/components/ui/dialog';
import { AddEmployeeForm } from './AddEmployeeForm';

interface AddEmployeeDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddEmployeeDialog: React.FC<AddEmployeeDialogProps> = ({
  onSuccess,
  onCancel
}) => {
  return (
    <DialogContent className="max-w-screen-lg w-full" title="Add New Employee" description="Add an Employee to your organization.">
      <AddEmployeeForm 
        onSuccess={onSuccess}
        onCancel={onCancel}
        isTabbed={true}
      />
    </DialogContent>
  );
};
