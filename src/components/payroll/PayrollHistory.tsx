
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui-custom/Button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { Eye, FileText, Search } from 'lucide-react';
import { PayrollPeriod } from '@/types/payroll';

const PayrollHistory: React.FC = () => {
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [payrollItems, setPayrollItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayrollPeriods();
  }, []);

  const fetchPayrollPeriods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll_periods')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setPayrollPeriods(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching payroll periods',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollItems = async (periodId: string) => {
    try {
      setLoadingItems(true);
      const { data, error } = await supabase
        .from('payroll_items')
        .select(`
          *,
          employees(id, full_name, job_title, department, email)
        `)
        .eq('payroll_period_id', periodId);
      
      if (error) {
        throw error;
      }
      
      setPayrollItems(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching payroll items',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoadingItems(false);
    }
  };

  const handleViewPayrollDetails = (period: PayrollPeriod) => {
    setSelectedPeriod(period);
    fetchPayrollItems(period.id);
  };

  const handleBackToList = () => {
    setSelectedPeriod(null);
    setPayrollItems([]);
  };

  const filteredPeriods = payrollPeriods.filter(period => 
    period.period_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      {!selectedPeriod ? (
        <Card className="bg-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Payroll History</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search periods..."
                className="pl-8 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredPeriods.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPeriods.map((period) => (
                    <TableRow key={period.id}>
                      <TableCell className="font-medium">{period.period_name}</TableCell>
                      <TableCell>{format(new Date(period.start_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{format(new Date(period.end_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{format(new Date(period.payment_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          period.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          period.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                          period.status === 'Verified' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {period.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPayrollDetails(period)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No payroll periods found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try a different search term' : 'Create a new payroll period to get started'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{selectedPeriod.period_name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(selectedPeriod.start_date), 'dd MMM yyyy')} - {format(new Date(selectedPeriod.end_date), 'dd MMM yyyy')}
              </p>
            </div>
            <Button variant="outline" onClick={handleBackToList}>
              Back to List
            </Button>
          </CardHeader>
          <CardContent>
            {loadingItems ? (
              <div className="flex justify-center py-10">
                <LoadingSpinner size="md" />
              </div>
            ) : payrollItems.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead className="text-right">Basic Salary</TableHead>
                      <TableHead className="text-right">Allowances</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">CPF (Employee)</TableHead>
                      <TableHead className="text-right">Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.employees?.full_name}</TableCell>
                        <TableCell>{item.employees?.job_title || 'N/A'}</TableCell>
                        <TableCell className="text-right">${item.basic_salary.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${item.allowances.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${item.deductions.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${item.employee_cpf.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${item.net_pay.toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.status === 'Paid' ? 'bg-green-100 text-green-800' :
                            item.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                            item.status === 'Calculated' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <tfoot className="bg-gray-100 font-medium">
                    <TableRow>
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-right">
                        ${payrollItems.reduce((sum, item) => sum + item.basic_salary, 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${payrollItems.reduce((sum, item) => sum + item.allowances, 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${payrollItems.reduce((sum, item) => sum + item.deductions, 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${payrollItems.reduce((sum, item) => sum + item.employee_cpf, 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${payrollItems.reduce((sum, item) => sum + item.net_pay, 0).toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </tfoot>
                </Table>
              </div>
            ) : (
              <div className="text-center py-10">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No payroll items found</h3>
                <p className="text-muted-foreground">
                  This payroll period doesn't have any calculated items
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PayrollHistory;
