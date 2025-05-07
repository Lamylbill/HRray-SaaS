
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui-custom/Button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PayrollPeriod } from '@/types/payroll';
import { format } from 'date-fns';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { Check, Download, FileText, Loader2, Printer } from 'lucide-react';

// Function to generate PDF payslip (mock implementation)
const generatePayslipPDF = async (employeeId: string, periodId: string) => {
  // In a real implementation, this would call a backend service to generate the PDF
  // For now, we'll simulate a delay and success
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve(`payslip-${employeeId}-${periodId}.pdf`);
    }, 1000);
  });
};

const PayslipGenerator: React.FC = () => {
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [payrollItems, setPayrollItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingPayslips, setGeneratingPayslips] = useState<Record<string, boolean>>({});
  const [generatedPayslips, setGeneratedPayslips] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchPayrollPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      fetchPayrollItems(selectedPeriod);
    } else {
      setPayrollItems([]);
    }
  }, [selectedPeriod]);

  const fetchPayrollPeriods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('status', 'Completed') // Only get completed payrolls
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
      setLoading(true);
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
      setLoading(false);
    }
  };

  const handleGeneratePayslip = async (employeeId: string) => {
    try {
      setGeneratingPayslips(prev => ({ ...prev, [employeeId]: true }));
      
      // Generate payslip PDF
      const payslipFile = await generatePayslipPDF(employeeId, selectedPeriod);
      
      // In a real implementation, you would save this file path to the database
      setGeneratedPayslips(prev => ({ ...prev, [employeeId]: payslipFile }));
      
      toast({
        title: 'Success',
        description: 'Payslip generated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error generating payslip',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setGeneratingPayslips(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  const handleGenerateAllPayslips = async () => {
    try {
      // Set all employees as generating
      const generatingAll: Record<string, boolean> = {};
      payrollItems.forEach(item => {
        generatingAll[item.employee_id] = true;
      });
      setGeneratingPayslips(generatingAll);
      
      // Generate each payslip one by one
      const generated: Record<string, string> = { ...generatedPayslips };
      for (const item of payrollItems) {
        const payslipFile = await generatePayslipPDF(item.employee_id, selectedPeriod);
        generated[item.employee_id] = payslipFile;
        // Update the generating state to mark this one as done
        setGeneratingPayslips(prev => ({ ...prev, [item.employee_id]: false }));
      }
      
      setGeneratedPayslips(generated);
      
      toast({
        title: 'Success',
        description: `Generated ${payrollItems.length} payslips successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error generating payslips',
        description: error.message,
        variant: 'destructive'
      });
      
      // Reset all generating states
      const notGenerating: Record<string, boolean> = {};
      payrollItems.forEach(item => {
        notGenerating[item.employee_id] = false;
      });
      setGeneratingPayslips(notGenerating);
    }
  };

  const filteredPayrollItems = payrollItems.filter(item => 
    item.employees?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPeriodData = payrollPeriods.find(p => p.id === selectedPeriod);

  if (loading && payrollPeriods.length === 0) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Generate Payslips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="payroll-period" className="block font-medium">Select Payroll Period</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger id="payroll-period">
                    <SelectValue placeholder="Select a payroll period" />
                  </SelectTrigger>
                  <SelectContent>
                    {payrollPeriods.map(period => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.period_name} ({format(new Date(period.start_date), 'dd MMM')} - {format(new Date(period.end_date), 'dd MMM yyyy')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedPeriod && (
                <div className="space-y-2">
                  <label htmlFor="search-employee" className="block font-medium">Search Employee</label>
                  <Input
                    id="search-employee"
                    placeholder="Search by employee name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              )}
            </div>

            {selectedPeriod && selectedPeriodData && (
              <div className="rounded-md border bg-gray-50 p-4">
                <h3 className="font-semibold">{selectedPeriodData.period_name}</h3>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Period:</span> {format(new Date(selectedPeriodData.start_date), 'dd MMM yyyy')} - {format(new Date(selectedPeriodData.end_date), 'dd MMM yyyy')}
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Payment Date:</span> {format(new Date(selectedPeriodData.payment_date), 'dd MMM yyyy')}
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Status:</span> {selectedPeriodData.status}
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Employees:</span> {payrollItems.length}
                  </div>
                </div>
              </div>
            )}

            {selectedPeriod && payrollItems.length > 0 && (
              <div className="flex justify-end">
                <Button onClick={handleGenerateAllPayslips}>
                  Generate All Payslips
                </Button>
              </div>
            )}

            {selectedPeriod && (loading ? (
              <div className="flex justify-center py-10">
                <LoadingSpinner size="md" />
              </div>
            ) : filteredPayrollItems.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-blue-700 text-white">
                    <tr>
                      <th className="py-3 px-4 text-left">Employee</th>
                      <th className="py-3 px-4 text-left">Position</th>
                      <th className="py-3 px-4 text-left">Department</th>
                      <th className="py-3 px-4 text-right">Net Pay</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayrollItems.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="py-3 px-4">{item.employees?.full_name}</td>
                        <td className="py-3 px-4">{item.employees?.job_title || 'N/A'}</td>
                        <td className="py-3 px-4">{item.employees?.department || 'N/A'}</td>
                        <td className="py-3 px-4 text-right">${item.net_pay.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          {generatingPayslips[item.employee_id] ? (
                            <Button variant="outline" disabled>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </Button>
                          ) : generatedPayslips[item.employee_id] ? (
                            <div className="flex space-x-2 justify-center">
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                              <Button variant="outline" size="sm">
                                <Printer className="h-4 w-4 mr-1" />
                                Print
                              </Button>
                            </div>
                          ) : (
                            <Button variant="outline" onClick={() => handleGeneratePayslip(item.employee_id)}>
                              <FileText className="h-4 w-4 mr-1" />
                              Generate Payslip
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No employees found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try a different search term' : 'This payroll period has no employee records'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayslipGenerator;
