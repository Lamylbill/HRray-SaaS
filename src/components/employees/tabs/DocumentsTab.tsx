
import React, { useState, useEffect } from 'react';
import { DocumentManager } from '@/components/employees/documents/DocumentManager';
import { ensureStorageBucket, STORAGE_BUCKET } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';

// Add isTabbed to DocumentManagerProps interface
interface DocumentManagerProps {
  employeeId: string;
  isReadOnly?: boolean;
  refreshTrigger?: number;
  bucketReady?: boolean;
  isTabbed?: boolean;
}

interface DocumentsTabProps {
  employeeId: string;
  isReadOnly?: boolean;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  employeeId,
  isReadOnly = false
}) => {
  const { toast } = useToast();
  const [bucketReady, setBucketReady] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId) {
      setIsInitializing(false);
      setBucketReady(false);
      setInitializationError("Employee ID is missing. Cannot initialize document storage.");
      return;
    }

    let isMounted = true;
    setIsInitializing(true);
    setInitializationError(null);
    setBucketReady(null);

    const prepareBucket = async () => {
      try {
        const ready = await ensureStorageBucket(STORAGE_BUCKET);
        if (isMounted) {
          if (!ready) {
            const errorMsg = `Failed to verify or create document storage bucket: ${STORAGE_BUCKET}`;
            setInitializationError(errorMsg);
            toast({ title: 'Storage Setup Issue', description: 'Problem setting up document storage.', variant: 'destructive' });
          }
          setBucketReady(ready);
        }
      } catch (error: any) {
        if (isMounted) {
          const errorMsg = `Error preparing document storage: ${error.message || String(error)}`;
          setInitializationError(errorMsg);
          toast({ title: 'Storage Error', description: 'Failed to initialize document storage.', variant: 'destructive' });
          setBucketReady(false);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    prepareBucket();

    return () => {
      isMounted = false;
    };
  }, [employeeId, toast]);

  if (isInitializing) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center h-full text-gray-500">
        <LoadingSpinner size="lg" />
        <p className="mt-3">Preparing document storage...</p>
      </div>
    );
  }

  if (initializationError || bucketReady === false) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center h-full text-red-600 p-4 border border-red-200 bg-red-50 rounded-md">
        <p className="font-semibold">Storage Initialization Failed</p>
        <p className="text-sm mt-1">{initializationError || "Document storage could not be accessed or created."}</p>
        <p className="text-sm mt-2">Please try refreshing. If the issue persists, contact support.</p>
      </div>
    );
  }

  if (bucketReady === true && employeeId) {
    return (
      <DocumentManager
        employeeId={employeeId}
        isReadOnly={isReadOnly}
        bucketReady={true}
      />
    );
  }

  if (!employeeId) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center h-full text-gray-500">
        <p>Employee not selected. Cannot manage documents.</p>
      </div>
    );
  }

  return null;
};

// Export the DocumentManagerProps interface for use in other files
export type { DocumentManagerProps };
