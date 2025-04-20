
import React, { useState } from 'react';
import { Button } from '@/components/ui-custom/Button';
import { Check, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';

interface LeaveActionButtonsProps {
  leaveId: string;
  onActionComplete: () => void;
}

export const LeaveActionButtons = ({ leaveId, onActionComplete }: LeaveActionButtonsProps) => {
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAction = async (action: 'Approved' | 'Rejected') => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const client = getAuthorizedClient();
      const { error } = await client
        .from('leave_requests')
        .update({
          status: action,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id
        })
        .eq('id', leaveId);

      if (error) throw error;

      toast({
        title: `Leave ${action.toLowerCase()}`,
        description: `Leave request has been ${action.toLowerCase()} successfully`,
      });

      onActionComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action.toLowerCase()} leave request`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsApproveDialogOpen(false);
      setIsRejectDialogOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="success"
        size="sm"
        onClick={() => setIsApproveDialogOpen(true)}
        disabled={isLoading}
      >
        {isLoading ? <LoadingSpinner size="sm" className="text-white" /> : <Check className="h-4 w-4" />}
      </Button>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsRejectDialogOpen(true)}
        disabled={isLoading}
      >
        {isLoading ? <LoadingSpinner size="sm" className="text-white" /> : <X className="h-4 w-4" />}
      </Button>

      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this leave request?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleAction('Approved')}>
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this leave request?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleAction('Rejected')}>
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
