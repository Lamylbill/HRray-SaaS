
// src/components/employees/tabs/DocumentsTab.tsx
import React, { useEffect } from 'react';
import { DocumentManager } from '@/components/employees/documents/DocumentManager';
import { ensureStorageBucket, STORAGE_BUCKET } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DocumentsTabProps {
  employeeId: string;
  isReadOnly?: boolean;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ 
  employeeId, 
  isReadOnly = false 
}) => {
  const { toast } = useToast();
  const [bucketReady, setBucketReady] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(true);

  // Check if the bucket exists when the component mounts
  useEffect(() => {
    const prepareBucket = async () => {
      setIsInitializing(true);
      try {
        const ready = await ensureStorageBucket(STORAGE_BUCKET);
        
        if (!ready) {
          console.error('Failed to verify or create document storage bucket');
          toast({
            title: 'Storage Setup Issue',
            description: 'There was a problem setting up document storage. Please try again.',
            variant: 'destructive'
          });
        }
        
        setBucketReady(ready);
      } catch (error) {
        console.error('Error preparing document storage:', error);
        toast({
          title: 'Storage Error',
          description: 'Failed to initialize document storage. Please check console for details.',
          variant: 'destructive'
        });
        setBucketReady(false);
      } finally {
        setIsInitializing(false);
      }
    };

    prepareBucket();
  }, [employeeId, toast]);

  return (
    <div className="h-full">
      {isInitializing ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-gray-500">Preparing document storage...</div>
        </div>
      ) : (
        <DocumentManager 
          employeeId={employeeId} 
          refreshTrigger={0}
          isTabbed={true}
          isReadOnly={isReadOnly}
          bucketReady={bucketReady}
        />
      )}
    </div>
  );
};
