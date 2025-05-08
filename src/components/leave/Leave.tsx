import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// Verify component paths
import { ListFilter, RefreshCw, Upload, Link as LinkIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { AnimatedSection } from '@/components/ui-custom/AnimatedSection';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import LeaveCalendar from '@/components/leave-calendar/LeaveCalendar';
import LeaveRecordsView from '@/components/leave/LeaveRecordsView';
import { AddLeaveForm } from '@/components/leave/AddLeaveForm';
// Verify context/hook paths
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import { useLeave } from '@/hooks/use-leave'; // Import your hook

const Leave = () => {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('records'); // Default to records view
  const [botLinkDialogOpen, setBotLinkDialogOpen] = useState(false);
  const [botLink, setBotLink] = useState('');
  const [addLeaveDialogOpen, setAddLeaveDialogOpen] = useState(false);

  // --- Fetch Leave Data using useLeave Hook ---
  // This should be the ONLY declaration of leaveTypes in this scope
  const {
    leaveTypes,
    isLoadingLeaveTypes,
    // Include other values from useLeave if needed elsewhere
  } = useLeave();

  // Authentication check effect
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  // --- Handlers ---
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const authorizedClient = getAuthorizedClient();
      await Promise.all([
        authorizedClient.from('leave_requests').select('*', { head: true, count: 'exact' }),
        authorizedClient.from('public_holidays').select('*', { head: true, count: 'exact' }),
        authorizedClient.from('leave_quotas').select('*', { head: true, count: 'exact' }),
        authorizedClient.from('shifts').select('*', { head: true, count: 'exact' })
      ]);
      toast({ title: "Refreshed", description: "Leave data refreshed", duration: 3000 });
      // TODO: Trigger useLeave refetch if possible?
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({ title: "Error", description: "Failed to refresh data", variant: "destructive", duration: 3000 });
    } finally {
      setIsRefreshing(false);
    }
  }, [toast]); // Assuming getAuthorizedClient is stable

  const handleExport = useCallback(() => {
    toast({ title: "Export Started", description: `Exporting ${activeTab === 'calendar' ? 'calendar' : 'leave records'} data`, duration: 3000 });
    // Add actual export logic here
  }, [activeTab, toast]);

  const handleGenerateBotLink = useCallback(() => {
    if (user) {
      const botUsername = 'hrray_leave_bot'; // Replace if needed
      const generatedLink = `https://t.me/${botUsername}?start=${encodeURIComponent(user.id)}`;
      setBotLink(generatedLink);
      setBotLinkDialogOpen(true);
    } else {
      toast({ title: "Error", description: "You need to be logged in to generate a bot link", variant: "destructive", duration: 3000 });
    }
  }, [user, toast]);

  const copyToClipboard = useCallback(() => {
    if (!botLink) return;
    navigator.clipboard.writeText(botLink).then(() => {
      toast({ title: "Copied", description: "Bot link copied", duration: 3000 });
      setBotLinkDialogOpen(false);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast({ title: "Error", description: "Failed to copy link", variant: "destructive", duration: 3000 });
    });
  }, [botLink, toast]);

  const handleAddLeaveSuccess = useCallback(() => {
    setAddLeaveDialogOpen(false);
    handleRefresh(); // Refresh data after successful leave submission
    toast({ title: "Leave Request Submitted", description: "Successfully submitted", duration: 3000 });
  }, [handleRefresh, toast]);

  const handleCancelAddLeave = useCallback(() => {
    setAddLeaveDialogOpen(false);
  }, []);

  // --- Loading States ---
  const isLoading = isAuthLoading || isLoadingLeaveTypes;

  if (isLoading) {
    return (
        <div className="min-h-screen pt-20 pb-12 bg-gray-50 flex items-center justify-center">
            <LoadingSpinner size="lg" />
            <span className="ml-2">Loading data...</span>
        </div>
    );
  }

  // Ensure leaveTypes is always an array before passing
  const finalAvailableLeaveTypes = Array.isArray(leaveTypes) ? leaveTypes : [];

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-full">
        <AnimatedSection className="h-full flex flex-col">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
              <p className="mt-1 text-gray-600 text-sm">Manage employee leave, shifts, and attendance</p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}> <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh </Button>
              <Button variant="outline" size="sm" onClick={handleExport}> <Upload className="mr-2 h-4 w-4" /> Export </Button>
              <Button variant="default" size="sm" className="bg-blue-700 text-white hover:bg-blue-800" onClick={() => setAddLeaveDialogOpen(true)}> <Plus className="mr-2 h-4 w-4" /> Add Leave </Button>
            </div>
          </div>

          {/* Tab Buttons */}
           <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant={activeTab === 'calendar' ? 'secondary' : 'outline'} size="sm" onClick={() => setActiveTab('calendar')} className="flex items-center"> <ListFilter className="mr-2 h-4 w-4" /> Calendar View </Button>
              <Button variant={activeTab === 'records' ? 'secondary' : 'outline'} size="sm" onClick={() => setActiveTab('records')} className="flex items-center"> <ListFilter className="mr-2 h-4 w-4" /> Leave Records </Button>
              <Button variant="outline" size="sm" onClick={handleGenerateBotLink} className="flex items-center"> <LinkIcon className="mr-2 h-4 w-4" /> Generate Bot Link </Button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col">
            {activeTab === 'calendar' && (
              <LeaveCalendar /> // Ensure this component exists and works
            )}
            {activeTab === 'records' && (
              // Pass finalAvailableLeaveTypes which is guaranteed to be an array
              <LeaveRecordsView
                availableLeaveTypes={finalAvailableLeaveTypes}
              />
            )}
          </div>
        </AnimatedSection>
      </div>

      {/* Dialogs */}
      <Dialog open={botLinkDialogOpen} onOpenChange={setBotLinkDialogOpen}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Telegram Bot Link</DialogTitle></DialogHeader><div className="p-4 bg-gray-50 rounded-md overflow-auto"><p className="text-sm mb-2">Your Bot Link:</p><p className="text-xs md:text-sm break-all bg-white p-3 rounded border">{botLink}</p><p className="text-xs text-gray-500 mt-2">(Employee uses this link to apply)</p></div><DialogFooter className="sm:justify-start"><Button type="button" onClick={copyToClipboard} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">Copy Link</Button></DialogFooter></DialogContent>
      </Dialog>
      <Dialog open={addLeaveDialogOpen} onOpenChange={setAddLeaveDialogOpen}>
        <DialogContent className="sm:max-w-3xl w-full" aria-describedby="add-leave-dialog-description"><DialogHeader><DialogTitle>Add Leave Request</DialogTitle></DialogHeader><AddLeaveForm onSuccess={handleAddLeaveSuccess} onCancel={handleCancelAddLeave}/></DialogContent>
      </Dialog>
    </div>
  );
};

export default Leave;