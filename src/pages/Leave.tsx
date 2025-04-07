
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, ListFilter, Plus, RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { AnimatedSection } from '@/components/ui-custom/AnimatedSection';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LeaveCalendarView } from '@/components/leave/LeaveCalendarView';
import { LeaveRecordsView } from '@/components/leave/LeaveRecordsView';

const Leave = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
  }, [isAuthenticated, isLoading, navigate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // This would refresh the data from the API or database
    
    // Simulate a delay for demonstration
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Refreshed",
        description: "Leave data has been refreshed",
        duration: 3000,
      });
    }, 1000);
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
              <Button variant="outline" size="sm">
                <ListFilter className="mr-2 h-4 w-4" /> Filter
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button variant="primary" size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Leave
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="calendar" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
              <TabsTrigger value="calendar" className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" /> Calendar View
              </TabsTrigger>
              <TabsTrigger value="records" className="flex items-center">
                <ListFilter className="mr-2 h-4 w-4" /> Leave Records
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar" className="mt-0">
              <LeaveCalendarView />
            </TabsContent>
            
            <TabsContent value="records" className="mt-0">
              <LeaveRecordsView />
            </TabsContent>
          </Tabs>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default Leave;
