
// src/components/employees/tabs/DocumentsTab.tsx
import React, { useState, useEffect } from 'react';
import { DocumentManager } from '@/components/employees/documents/DocumentManager'; // Verify path
import { ensureStorageBucket, STORAGE_BUCKET } from '@/integrations/supabase/client'; // Verify path
import { useToast } from '@/hooks/use-toast'; // Verify path
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner'; // Example import

interface DocumentsTabProps {
  employeeId: string;
  isReadOnly?: boolean;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  employeeId,
  isReadOnly = false
}) => {
  const { toast } = useToast();
  const [bucketReady, setBucketReady] = useState<boolean | null>(null); // null = not checked, true = ready, false = error/not ready
  const [isInitializing, setIsInitializing] = useState(true); // Tracks the initial check
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    console.log(`DocumentsTab: useEffect for bucket check triggered. employeeId: ${employeeId}`);
    if (!employeeId) {
      console.log("DocumentsTab: No employeeId, cannot prepare bucket.");
      setIsInitializing(false);
      setBucketReady(false);
      setInitializationError("Employee ID is missing. Cannot initialize document storage.");
      return;
    }

    let isMounted = true; // To prevent state updates on unmounted component
    setIsInitializing(true);
    setInitializationError(null);
    setBucketReady(null); // Reset while checking

    const prepareBucket = async () => {
      console.log("DocumentsTab: Calling ensureStorageBucket...");
      try {
        const ready = await ensureStorageBucket(STORAGE_BUCKET);
        if (isMounted) {
          console.log(`DocumentsTab: ensureStorageBucket returned: ${ready}`);
          if (!ready) {
            const errorMsg = `Failed to verify or create document storage bucket: ${STORAGE_BUCKET}`;
            console.error("DocumentsTab:", errorMsg);
            setInitializationError(errorMsg);
            toast({ title: 'Storage Setup Issue', description: 'Problem setting up document storage.', variant: 'destructive' });
          }
          setBucketReady(ready);
        }
      } catch (error: any) {
        if (isMounted) {
          const errorMsg = `Error preparing document storage: ${error.message || String(error)}`;
          console.error("DocumentsTab:", errorMsg);
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
      isMounted = false; // Cleanup
    };
  }, [employeeId, toast]); // Only run when employeeId or toast (stable) changes

  // Log the final bucketReady state when it changes
  useEffect(() => {
    if (!isInitializing) { // Log only after initialization attempt
        console.log(`DocumentsTab: Final bucketReady state is: ${bucketReady}`);
    }
  }, [bucketReady, isInitializing]);


  if (isInitializing) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center h-full text-gray-500">
        <LoadingSpinner size="lg" />
        <p className="mt-3">Preparing document storage...</p>
      </div>
    );
  }

  if (initializationError || bucketReady === false) { // Check explicitly for false after init
    return (
      <div className="flex-grow flex flex-col items-center justify-center h-full text-red-600 p-4 border border-red-200 bg-red-50 rounded-md">
          <p className="font-semibold">Storage Initialization Failed</p>
          <p className="text-sm mt-1">{initializationError || "Document storage could not be accessed or created."}</p>
          <p className="text-sm mt-2">Please try refreshing. If the issue persists, contact support.</p>
      </div>
    );
  }
  
  // Only render DocumentManager if bucket is definitively ready and employeeId exists
  if (bucketReady === true && employeeId) {
    return (
        <DocumentManager
            employeeId={employeeId}
            isReadOnly={isReadOnly}
            bucketReady={true} // Pass true since we've confirmed it
        />
    );
  }

  // Fallback if employeeId is missing after initialization (should be caught earlier ideally)
  if (!employeeId) {
      return (
          <div className="flex-grow flex flex-col items-center justify-center h-full text-gray-500">
              <p>Employee not selected. Cannot manage documents.</p>
          </div>
      );
  }

  return null; // Should not be reached if logic above is correct
};
