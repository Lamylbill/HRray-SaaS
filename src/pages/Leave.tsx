
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ListFilter, Plus, RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { AnimatedSection } from '@/components/ui-custom/AnimatedSection';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LeaveCalendarView } from '@/components/leave/LeaveCalendarView';
import { LeaveRecordsView } from '@/components/leave/LeaveRecordsView';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Leave = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
  }, [isAuthenticated, isLoading, navigate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Fetch updated leave data from Supabase
      // This would be a real data fetch in a production implementation
      await Promise.all([
        supabase
          .from('leave_requests')
          .select('*'),
        supabase
          .from('public_holidays')
          .select('*'),
        supabase
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
    // Implementation for exporting data would go here
    toast({
      title: "Export Started",
      description: `Exporting ${activeTab === 'calendar' ? 'calendar' : 'leave records'} data`,
      duration: 3000,
    });
  };
  
  const handleFilter = () => {
    setShowFilterDrawer(true);
    // Implementation for filter functionality would go here
    toast({
      title: "Filters",
      description: "Filter functionality will be implemented soon",
      duration: 3000,
    });
  };

  const handleAddLeave = () => {
    // Implementation for adding leave would go here
    toast({
      title: "Add Leave",
      description: "Leave creation dialog will be implemented soon",
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <AnimatedSection>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
              <p className="mt-1 text-gray-600">Manage employee leave, shifts, and attendance</p>
            </div>
            
            {/* Action Buttons */}
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
                onClick={handleFilter}
              >
                <ListFilter className="mr-2 h-4 w-4" /> Filter
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExport}
              >
                <Upload className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={handleAddLeave}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Leave
              </Button>
            </div>
          </div>
          
          {/* Updated Tabs UI using shadcn Tabs component */}
          <div className="mb-8">
            <Tabs defaultValue="calendar" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-full max-w-xs">
                <TabsTrigger value="calendar" className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Calendar View
                </TabsTrigger>
                <TabsTrigger value="records" className="flex items-center">
                  <ListFilter className="mr-2 h-4 w-4" />
                  Leave Records
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Tab Content */}
          <div className="mt-0">
            {activeTab === 'calendar' && <LeaveCalendarView />}
            {activeTab === 'records' && <LeaveRecordsView />}
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default Leave;
