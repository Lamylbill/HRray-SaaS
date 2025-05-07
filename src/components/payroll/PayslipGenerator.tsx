
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui-custom/Button';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { PayrollPeriod, PayrollItem } from '@/types/payroll';
import { Download, FileText, Mail, Printer } from 'lucide-react';
import { Label } from '@/components/ui/label';

const PayslipGenerator: React.FC = () => {
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
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
        .order('payment_date', { ascending: false });

      if (error) throw error;

      // Convert database response to match our type definitions
      const typedData = data?.map(item => ({
        ...item,
        status: item.status as PayrollPeriod['status']
      })) || [];

      setPayrollPeriods(typedData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPeriodId) {
      fetchPayrollItems(selectedPeriodId);
    } else {
      setPayrollItems([]);
      setSelectAll(false);
      setSelectedEmployees([]);
    }
  }, [selectedPeriodId]);

  const fetchPayrollItems = async (periodId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll_items')
        .select('id, employee_id, basic_salary, allowances, deductions, net_pay, employees(full_name, email)')
        .eq('payroll_period_id', periodId);

      if (error) throw error;

      // Create complete PayrollItem objects with all required fields
      const typedData = (data || []).map(item => {
        // Extract the employees nested object to use separately
        const { employees, ...rest } = item;
        
        // Create a properly typed PayrollItem with default values for missing fields
        const payrollItem: PayrollItem = {
          id: rest.id,
          payroll_period_id: periodId,
          employee_id: rest.employee_id,
          basic_salary: rest.basic_salary,
          allowances: rest.allowances,
          deductions: rest.deductions,
          employee_cpf: 0, // Default value
          employer_cpf: 0, // Default value
          sdl: 0, // Default value
          sinda: 0, // Default value
          cdac: 0, // Default value
          mbmf: 0, // Default value
          gross_pay: 0, // Default value
          net_pay: rest.net_pay,
          status: 'Calculated', // Default value
          created_at: new Date().toISOString(), // Default value
          updated_at: new Date().toISOString(), // Default value
          // Store employee info to use for display
          employees: employees as { full_name: string; email: string }
        };
        
        return payrollItem;
      });

      setPayrollItems(typedData);
      setSelectAll(false);
      setSelectedEmployees([]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectAll((prev) => !prev);
    if (!selectAll) {
      setSelectedEmployees(payrollItems.map((item) => item.employee_id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleGeneratePayslips = async () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: 'Warning',
        description: 'Please select at least one employee to generate payslips.',
        variant: 'default',
      });
      return;
    }

    try {
      setGenerating(true);
      // Simulate generating payslips (replace with actual logic)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: 'Success',
        description: `Successfully generated payslips for ${selectedEmployees.length} employees.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to generate payslips. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Generate Payslips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payroll-period">Payroll Period</Label>
              <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                <SelectTrigger id="payroll-period">
                  <SelectValue placeholder="Select payroll period" />
                </SelectTrigger>
                <SelectContent>
                  {payrollPeriods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.period_name} ({format(new Date(period.payment_date), 'dd MMM yyyy')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {payrollItems.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                      </TableHead>
                      <TableHead>Employee Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Net Pay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedEmployees.includes(item.employee_id)}
                            onCheckedChange={() => handleEmployeeSelect(item.employee_id)}
                          />
                        </TableCell>
                        <TableCell>{item.employees?.full_name}</TableCell>
                        <TableCell>{item.employees?.email}</TableCell>
                        <TableCell>{item.net_pay}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleGeneratePayslips}
                disabled={selectedEmployees.length === 0 || generating}
                isLoading={generating}
              >
                {generating ? 'Generating...' : 'Generate Payslips'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayslipGenerator;
