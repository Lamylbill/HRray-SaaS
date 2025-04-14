
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListFilter, RefreshCw, Upload, Link, Plus } from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { AnimatedSection } from '@/components/ui-custom/AnimatedSection';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getAuthorizedClient } from '@/integrations/supabase/client';
import LeaveCalendar from '@/components/leave-calendar/LeaveCalendar';
import LeaveRecordsView from '@/components/leave/LeaveRecordsView';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const Leave = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedLeaveTypes, setSelectedLeaveTypes] = useState<string[]>([]);
  const [botLinkDialogOpen, setBotLinkDialogOpen] = useState(false);
  const [botLink, setBotLink] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
  }, [isAuthenticated, isLoading, navigate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const authorizedClient = getAuthorizedClient();
      
      await Promise.all([
        authorizedClient
          .from('leave_requests')
          .select('*'),
        authorizedClient
          .from('public_holidays')
          .select('*'),
        authorizedClient
          .from('leave_quotas')
          .select('*'),
        authorizedClient
          .from('shifts')
          .select('*')
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
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: `Exporting ${activeTab === 'calendar' ? 'calendar' : 'leave records'} data`,
      duration: 3000,
    });
  };

  const handleLeaveTypeFilter = (types: string[]) => {
    setSelectedLeaveTypes(types);
  };

  const handleGenerateBotLink = () => {
    if (user) {
      const botUsername = 'hrflow_leave_bot';
      const generatedLink = `https://t.me/${botUsername}?start=${user.id}`;

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
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(botLink).then(() => {
      toast({
        title: "Copied",
        description: "Bot link copied to clipboard",
        duration: 3000,
      });
      setBotLinkDialogOpen(false);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
        duration: 3000,
      });
    });
  };

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-full">
        <AnimatedSection className="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
              <p className="mt-1 text-gray-600">Manage employee leave, shifts, and attendance</p>
            </div>

            <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
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
                variant="default"
                size="sm"
                className="bg-blue-500 text-white hover:bg-blue-700"
              > 
                <Plus className="mr-2 h-4 w-4" />
                Add Leave
              </Button>

            </div>
          </div>

          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeTab === 'calendar' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('calendar')}
                className="flex items-center"
              >
                <ListFilter className="mr-2 h-4 w-4" />
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
                <Link className="mr-2 h-4 w-4" />
                Generate Bot Link
              </Button>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {activeTab === 'calendar' && (
              <LeaveCalendar />
            )}
            {activeTab === 'records' && (
              <LeaveRecordsView 
                selectedLeaveTypes={selectedLeaveTypes} 
                onLeaveTypeFilter={handleLeaveTypeFilter} 
              />
            )}
          </div>
        </AnimatedSection>
      </div>

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
            <Button type="button" onClick={copyToClipboard} className="w-full sm:w-auto">
              Copy Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leave;
