
// src/components/employees/tabs/DocumentsTab.tsx
import React from 'react';
import { DocumentManager } from '@/components/employees/documents/DocumentManager';

interface DocumentsTabProps {
  employeeId: string;
  isReadOnly?: boolean;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ 
  employeeId, 
  isReadOnly = false 
}) => {
  return (
    <div className="h-full">
      <DocumentManager 
        employeeId={employeeId} 
        refreshTrigger={0}
        isTabbed={true}
        isReadOnly={isReadOnly} // Changed from isViewOnly to isReadOnly to match DocumentManager props
      />
    </div>
  );
};
