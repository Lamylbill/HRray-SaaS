
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Upload, Link as LinkIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { AnimatedSection } from '@/components/ui-custom/AnimatedSection';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import LeaveCalendar from '@/components/leave-calendar/LeaveCalendar';
import LeaveRecordsView from '@/components/leave/LeaveRecordsView';
import LeaveCalendarView from '@/components/leave/LeaveCalendarView';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AddLeaveForm } from '@/components/leave/AddLeaveForm';
import { LeaveType } from '@/components/leave/interfaces';
import '../App.css';

type TabId = 'calendar' | 'monthly' | 'records';

const TABS: { id: TabId; label: string }[] = [
  { id: 'calendar', label: 'Timeline' },
  { id: 'monthly', label: 'Calendar' },
  { id: 'records', label: 'Leave Records' },
];

const Leave = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('calendar');
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState<LeaveType[]>([]);
  const [botLinkDialogOpen, setBotLinkDialogOpen] = useState(false);
  const [botLink, setBotLink] = useState('');
  const [addLeaveDialogOpen, setAddLeaveDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');

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

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const authorizedClient = getAuthorizedClient();
      await Promise.all([
        authorizedClient.from('leave_requests').select('*'),
        authorizedClient.from('public_holidays').select('*'),
        authorizedClient.from('leave_quotas').select('*'),
        authorizedClient.from('shifts').select('*'),
      ]);
      toast({ title: 'Refreshed', description: 'Leave data has been refreshed', duration: 3000 });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({ title: 'Error', description: 'Failed to refresh data', variant: 'destructive', duration: 3000 });
    } finally {
      setIsRefreshing(false);
    }
  }, [toast]);

  const handleExport = useCallback(() => {
    toast({ title: 'Export Started', description: `Exporting ${activeTab} data`, duration: 3000 });
  }, [activeTab, toast]);

  const handleGenerateBotLink = useCallback(() => {
    if (user) {
      const botUsername = 'hrray_leave_bot';
      const generatedLink = `https://t.me/${botUsername}?start=${encodeURIComponent(user.id)}`;
      setBotLink(generatedLink);
      setBotLinkDialogOpen(true);
    } else {
      toast({ title: 'Error', description: 'You need to be logged in to generate a bot link', variant: 'destructive', duration: 3000 });
    }
  }, [user, toast]);

  const copyToClipboard = useCallback(() => {
    if (!botLink) return;
    navigator.clipboard.writeText(botLink).then(() => {
      toast({ title: 'Copied', description: 'Bot link copied to clipboard', duration: 3000 });
      setBotLinkDialogOpen(false);
    }).catch(() => {
      toast({ title: 'Error', description: 'Failed to copy to clipboard.', variant: 'destructive', duration: 3000 });
    });
  }, [botLink, toast]);

  const handleAddLeaveSuccess = useCallback(() => {
    setAddLeaveDialogOpen(false);
    handleRefresh();
    toast({ title: 'Leave Request Submitted', description: 'Your leave request has been submitted successfully', duration: 3000 });
  }, [handleRefresh, toast]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading authentication...</div>;
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-full">
        <AnimatedSection className="h-full flex flex-col">

          {/* Page header */}
          <div className="rounded-xl bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Leave Management</h1>
              <p className="mt-1 text-blue-200 text-sm">Manage employee leave, shifts, and attendance</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                <Upload className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                size="sm"
                onClick={() => setAddLeaveDialogOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white border-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Leave
              </Button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 mb-6 bg-white rounded-lg border border-gray-200 p-1 w-fit shadow-sm">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer ${
                  activeTab === id
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={handleGenerateBotLink}
              className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Bot Link
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 flex flex-col">
            {activeTab === 'calendar' && <LeaveCalendar view="timeline" />}
            {activeTab === 'monthly' && <LeaveCalendarView />}
            {activeTab === 'records' && (
              <LeaveRecordsView availableLeaveTypes={availableLeaveTypes} />
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
            <p className="text-xs text-gray-500 mt-2">Employee will click this to start the leave application process.</p>
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
        <DialogContent className="sm:max-w-3xl w-full" aria-describedby="add-leave-dialog-description">
          <DialogHeader>
            <DialogTitle>Add Leave Request</DialogTitle>
          </DialogHeader>
          <AddLeaveForm
            onSuccess={handleAddLeaveSuccess}
            onCancel={() => setAddLeaveDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leave;
