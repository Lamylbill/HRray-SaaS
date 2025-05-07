
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui-custom/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { calculateCpfContributions } from '@/hooks/use-payroll';
import { supabase } from '@/integrations/supabase/client';
import { PayrollPeriod, PayrollItem, Employee, PayrollItemStatus } from '@/types/payroll';
import { format } from 'date-fns';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';

const PayrollCalculator: React.FC = () => {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [basicSalary, setBasicSalary] = useState<number | ''>('');
  const [allowances, setAllowances] = useState<number | ''>('');
  const [deductions, setDeductions] = useState<number | ''>('');
  const [cpfContributions, setCpfContributions] = useState({ employee: 0, employer: 0, total: 0 });
  const [netPay, setNetPay] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPayrollData();
  }, []);

  const loadPayrollData = async () => {
    try {
      setIsLoading(true);

      // Fetch payroll periods
      const periodsResult = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('status', 'Draft')
        .order('payment_date', { ascending: false });

      if (periodsResult.error) throw periodsResult.error;
      
      // Convert database response to match our type definitions
      const typedPeriodsData = periodsResult.data?.map(item => ({
        ...item,
        status: item.status as PayrollPeriod['status']
      })) || [];
      
      setPeriods(typedPeriodsData);

      // Fetch employees
      const employeesResult = await supabase
        .from('employees')
        .select('id, full_name, email, basic_salary, allowances')
        .order('full_name', { ascending: true });

      if (employeesResult.error) throw employeesResult.error;
      setEmployees(employeesResult.data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading data',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayrollItems();
  }, [selectedPeriodId]);

  const loadPayrollItems = async () => {
    try {
      setIsLoading(true);
      
      // Fetch employees
      const employeesResult = await supabase
        .from('employees')
        .select('id, full_name, email, basic_salary, allowances')
        .order('full_name', { ascending: true });

      if (employeesResult.error) throw employeesResult.error;
      setEmployees(employeesResult.data || []);

      // Fetch payroll items for the selected period
      const payrollItems = await supabase
        .from('payroll_items')
        .select('*')
        .eq('payroll_period_id', selectedPeriodId);
      
      if (payrollItems.data) {
        // Convert database response to match our type definitions
        const typedPayrollItems = payrollItems.data.map(item => ({
          ...item,
          status: item.status as PayrollItemStatus
        }));
        
        setItems(typedPayrollItems);
      }
      
    } catch (error: any) {
      toast({
        title: 'Error loading payroll items',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    calculatePayroll();
  }, [basicSalary, allowances, deductions]);

  const calculatePayroll = () => {
    const salary = Number(basicSalary);
    const allowance = Number(allowances);
    const deduction = Number(deductions);

    const grossPay = salary + allowance - deduction;
    const cpf = calculateCpfContributions(salary, 30);

    setCpfContributions(cpf);
    setNetPay(grossPay - cpf.employee);
  };

  const handleCalculate = async () => {
    if (!selectedPeriodId || !selectedEmployeeId || !basicSalary || !allowances || !deductions) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsCalculating(true);

      const newItem: Omit<PayrollItem, 'id' | 'created_at' | 'updated_at'> = {
        payroll_period_id: selectedPeriodId,
        employee_id: selectedEmployeeId,
        basic_salary: Number(basicSalary),
        allowances: Number(allowances),
        deductions: Number(deductions),
        employee_cpf: cpfContributions.employee,
        employer_cpf: cpfContributions.employer,
        sdl: 0,
        sinda: 0,
        cdac: 0,
        mbmf: 0,
        gross_pay: Number(basicSalary) + Number(allowances) - Number(deductions),
        net_pay: netPay,
        status: 'Calculated',
      };

      const { data, error } = await supabase
        .from('payroll_items')
        .insert(newItem)
        .select();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Payroll calculated and saved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error calculating payroll',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsCalculating(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Payroll Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payroll-period">Payroll Period</Label>
              <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                <SelectTrigger id="payroll-period">
                  <SelectValue placeholder="Select payroll period" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.period_name} ({format(new Date(period.payment_date), 'dd MMM yyyy')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name} ({employee.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="basic-salary">Basic Salary</Label>
              <Input
                id="basic-salary"
                type="number"
                placeholder="Enter basic salary"
                value={basicSalary}
                onChange={(e) => setBasicSalary(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowances">Allowances</Label>
              <Input
                id="allowances"
                type="number"
                placeholder="Enter allowances"
                value={allowances}
                onChange={(e) => setAllowances(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deductions">Deductions</Label>
              <Input
                id="deductions"
                type="number"
                placeholder="Enter deductions"
                value={deductions}
                onChange={(e) => setDeductions(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">Payroll Summary</h3>
            <Table>
              <TableCaption>Summary of calculated payroll values.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Label</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Gross Pay</TableCell>
                  <TableCell>{Number(basicSalary) + Number(allowances) - Number(deductions)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Employee CPF</TableCell>
                  <TableCell>{cpfContributions.employee}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Employer CPF</TableCell>
                  <TableCell>{cpfContributions.employer}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Net Pay</TableCell>
                  <TableCell>{netPay}</TableCell>
                </TableRow>
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2}>
                    <Button onClick={handleCalculate} disabled={isCalculating} isLoading={isCalculating}>
                      {isCalculating ? 'Calculating...' : 'Calculate Payroll'}
                    </Button>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollCalculator;
