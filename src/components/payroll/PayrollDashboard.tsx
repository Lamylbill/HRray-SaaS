
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePayrollPeriods } from '@/hooks/use-payroll';
import { Calendar, ClipboardList, CreditCard, DollarSign } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Button } from '@/components/ui-custom/Button';
import { useNavigate } from 'react-router-dom';

const PayrollDashboard: React.FC = () => {
  const { periods, loading } = usePayrollPeriods();
  const [stats, setStats] = useState({
    activeEmployees: 0,
    totalPaid: 0,
    pendingPayroll: 0,
    completedPayrolls: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        // Get count of active employees
        const { count: activeEmployees } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('employment_status', 'Active');
        
        // Get count of completed payrolls
        const { count: completedPayrolls } = await supabase
          .from('payroll_periods')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Completed');
        
        // Get count of pending payrolls
        const { count: pendingPayroll } = await supabase
          .from('payroll_periods')
          .select('*', { count: 'exact', head: true })
          .in('status', ['Draft', 'Processing']);
        
        // Sum total paid amount
        const { data: totalPaidData } = await supabase
          .from('payroll_items')
          .select('net_pay')
          .eq('status', 'Paid');
        
        const totalPaid = totalPaidData?.reduce((sum, item) => sum + (item.net_pay || 0), 0) || 0;
        
        setStats({
          activeEmployees: activeEmployees || 0,
          completedPayrolls: completedPayrolls || 0,
          pendingPayroll: pendingPayroll || 0,
          totalPaid
        });
      } catch (error) {
        console.error('Error fetching payroll stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };
    
    fetchStats();
  }, []);

  const handleCreatePayroll = () => {
    navigate('/payroll?tab=calculate');
  };

  if (loading || loadingStats) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <ClipboardList className="h-4 w-4 text-blue-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEmployees}</div>
            <p className="text-xs text-muted-foreground">Eligible for payroll</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time payroll amount</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payrolls</CardTitle>
            <Calendar className="h-4 w-4 text-blue-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayroll}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Payrolls</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedPayrolls}</div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Recent Payroll Periods</CardTitle>
          </CardHeader>
          <CardContent>
            {periods.length > 0 ? (
              <div className="space-y-4">
                {periods.slice(0, 5).map((period) => (
                  <div key={period.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{period.period_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(period.start_date), 'dd MMM yyyy')} - {format(new Date(period.end_date), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        period.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        period.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                        period.status === 'Verified' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {period.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">No payroll periods found</p>
            )}
            {periods.length > 0 && (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate('/payroll?tab=history')}
              >
                View All Payrolls
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                className="w-full justify-start gap-2"
                onClick={handleCreatePayroll}
              >
                <DollarSign className="h-4 w-4" />
                Calculate New Payroll
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => navigate('/payroll?tab=payslips')}
              >
                <ClipboardList className="h-4 w-4" />
                Generate Payslips
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => navigate('/payroll?tab=bank-files')}
              >
                <CreditCard className="h-4 w-4" />
                Generate Bank Payment File
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => navigate('/payroll?tab=cpf-files')}
              >
                <Calendar className="h-4 w-4" />
                Export CPF Submission
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PayrollDashboard;
