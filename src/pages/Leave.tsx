import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListFilter, RefreshCw, Upload, Link as LinkIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { AnimatedSection } from '@/components/ui-custom/AnimatedSection';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import LeaveCalendar from '@/components/leave-calendar/LeaveCalendar';
import LeaveRecordsView from '@/components/leave/LeaveRecordsView';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AddLeaveForm } from '@/components/leave/AddLeaveForm';
import { LeaveType } from '@/components/leave/interfaces';

const Leave = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedLeaveTypes, setSelectedLeaveTypes] = useState<string[]>([]);
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState<LeaveType[]>([]);
  const [botLinkDialogOpen, setBotLinkDialogOpen] = useState(false);
  const [botLink, setBotLink] = useState('');
  const [addLeaveDialogOpen, setAddLeaveDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
    
    // Add code to fetch leave types
    const fetchLeaveTypes = async () => {
      try {
        const authorizedClient = getAuthorizedClient();
        const { data, error } = await authorizedClient
          .from('leave_types')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setAvailableLeaveTypes(data || []);
      } catch (err) {
        console.error('Error fetching leave types:', err);
      }
    };
    
    fetchLeaveTypes();
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
  }, [isAuthenticated, isLoading, navigate]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const authorizedClient = getAuthorizedClient();
      
      // These Supabase calls seem intended to refresh data sources.
      // Their effectiveness depends on how child components consume this data
      // (e.g., via realtime subscriptions or data fetching hooks that react to cache changes).
      await Promise.all([
        authorizedClient.from('leave_requests').select('*'),
        authorizedClient.from('public_holidays').select('*'),
        authorizedClient.from('leave_quotas').select('*'),
        authorizedClient.from('shifts').select('*')
      ]);

      toast({
        title: "Refreshed",
        description: "Leave data has been refreshed",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [toast]); // getAuthorizedClient is an import, setIsRefreshing is stable

  const handleExport = useCallback(() => { // Wrapped in useCallback, though not strictly necessary if not a dependency/prop
    toast({
      title: "Export Started",
      description: `Exporting ${activeTab === 'calendar' ? 'calendar' : 'leave records'} data`,
      duration: 3000,
    });
  }, [activeTab, toast]);

  const handleLeaveTypeFilter = useCallback((types: string[]) => {
    setSelectedLeaveTypes(types);
  }, []); // setSelectedLeaveTypes is stable

  const handleGenerateBotLink = useCallback(() => {
    if (user) {
      const botUsername = 'hrray_leave_bot';
      // Ensure user.id is URL-safe if it can contain special characters, though usually not an issue for IDs.
      const generatedLink = `https://t.me/${botUsername}?start=${encodeURIComponent(user.id)}`;

      setBotLink(generatedLink);
      setBotLinkDialogOpen(true);
      console.log('Generated bot link with user ID:', user.id);
    } else {
      toast({
        title: "Error",
        description: "You need to be logged in to generate a bot link",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [user, toast]); // setBotLink, setBotLinkDialogOpen are stable

  const copyToClipboard = useCallback(() => {
    if (!botLink) return;
    navigator.clipboard.writeText(botLink).then(() => {
      toast({
        title: "Copied",
        description: "Bot link copied to clipboard",
        duration: 3000,
      });
      setBotLinkDialogOpen(false); // Close dialog on successful copy
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard. Ensure you are in a secure context (HTTPS).",
        variant: "destructive",
        duration: 3000,
      });
    });
  }, [botLink, toast]); // setBotLinkDialogOpen is stable

  const handleAddLeaveSuccess = useCallback(() => {
    setAddLeaveDialogOpen(false);
    handleRefresh(); // Refresh data after successful leave submission
    toast({
      title: "Leave Request Submitted",
      description: "Your leave request has been submitted successfully",
      duration: 3000,
    });
  }, [handleRefresh, toast]); // setAddLeaveDialogOpen is stable

  const handleCancelAddLeave = useCallback(() => {
    setAddLeaveDialogOpen(false);
  }, []); // setAddLeaveDialogOpen is stable

  if (isLoading) {
    // Optional: Add a loading spinner for the whole page if auth is loading
    return <div className="min-h-screen flex items-center justify-center">Loading authentication...</div>;
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-full">
        <AnimatedSection className="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
              <p className="mt-1 text-gray-600 text-sm">Manage employee leave, shifts, and attendance</p>
            </div>

            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={isRefreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExport}
              >
                <Upload className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button
                variant="default" // Assuming this is a primary button style
                size="sm"
                className="bg-blue-700 text-white hover:bg-blue-800" // Example primary button styling
                onClick={() => setAddLeaveDialogOpen(true)}
              > 
                <Plus className="mr-2 h-4 w-4" />
                Add Leave
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Consider making these tab buttons part of a reusable Tab component */}
              <Button
                variant={activeTab === 'calendar' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('calendar')}
                className="flex items-center" // Ensure consistent styling/behavior
              >
                <ListFilter className="mr-2 h-4 w-4" /> {/* Icon could change based on view */}
                Calendar View
              </Button>
              <Button
                variant={activeTab === 'records' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('records')}
                className="flex items-center"
              >
                <ListFilter className="mr-2 h-4 w-4" />
                Leave Records
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateBotLink}
                className="flex items-center"
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Generate Bot Link
              </Button>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {/* Conditional rendering of views based on activeTab */}
            {activeTab === 'calendar' && (
              <LeaveCalendar /> // Ensure LeaveCalendar fetches/refreshes data as needed
            )}
            {activeTab === 'records' && (
              <LeaveRecordsView 
                selectedLeaveTypes={selectedLeaveTypes} 
                onLeaveTypeFilter={handleLeaveTypeFilter}
                availableLeaveTypes={availableLeaveTypes}
              />
            )}
          </div>
        </AnimatedSection>
      </div>

      {/* Bot Link Dialog */}
      <Dialog open={botLinkDialogOpen} onOpenChange={setBotLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Telegram Bot Link</DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-gray-50 rounded-md overflow-auto">
            <p className="text-sm mb-2">Your Bot Link:</p>
            <p className="text-xs md:text-sm break-all bg-white p-3 rounded border">{botLink}</p>
            <p className="text-xs text-gray-500 mt-2">(Employee will click this to start leave application process)</p>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button type="button" onClick={copyToClipboard} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
              Copy Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Leave Dialog */}
      <Dialog open={addLeaveDialogOpen} onOpenChange={setAddLeaveDialogOpen}>
        <DialogContent className="sm:max-w-3xl w-full" aria-describedby="add-leave-dialog-description"> {/* Added aria-describedby */}
          <DialogHeader>
            <DialogTitle>Add Leave Request</DialogTitle>
            {/* Optional: <DialogDescription id="add-leave-dialog-description">Fill in the details to submit a new leave request.</DialogDescription> */}
          </DialogHeader>
          <AddLeaveForm 
            onSuccess={handleAddLeaveSuccess}     // Passed memoized handler
            onCancel={handleCancelAddLeave}     // Passed memoized handler
            // If AddLeaveForm needs an initialDate, you can pass it here, e.g. initialDate={new Date()}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leave;
