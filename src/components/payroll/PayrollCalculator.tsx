
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui-custom/Button';
import { useToast } from '@/hooks/use-toast';
import { usePayrollPeriods, calculateCpfContributions } from '@/hooks/use-payroll';
import { supabase } from '@/integrations/supabase/client';
import { PayrollItem } from '@/types/payroll';
import { format } from 'date-fns';

const PayrollCalculator: React.FC = () => {
  const [periodName, setPeriodName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [periodCreated, setPeriodCreated] = useState(false);
  const [currentPeriodId, setCurrentPeriodId] = useState<string | null>(null);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  
  const { toast } = useToast();
  const { createPayrollPeriod } = usePayrollPeriods();

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('id, full_name, email, job_title, department, basic_salary, date_of_birth')
          .eq('employment_status', 'Active');
        
        if (error) {
          throw error;
        }
        
        setEmployees(data || []);
      } catch (error: any) {
        toast({
          title: 'Error fetching employees',
          description: error.message,
          variant: 'destructive'
        });
      }
    };
    
    fetchEmployees();
  }, [toast]);

  const handleCreatePeriod = async () => {
    if (!periodName || !startDate || !endDate || !paymentDate) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setLoading(true);
      const periodData = {
        period_name: periodName,
        start_date: startDate,
        end_date: endDate,
        payment_date: paymentDate,
        status: 'Draft' as const,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };
      
      const result = await createPayrollPeriod(periodData);
      setCurrentPeriodId(result.id);
      setPeriodCreated(true);
      
      toast({
        title: 'Success',
        description: 'Payroll period created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error creating payroll period',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.id));
    }
  };

  const handleCalculatePayroll = async () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: 'No Employees Selected',
        description: 'Please select at least one employee to calculate payroll',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      
      const calculatedItems = await Promise.all(
        selectedEmployees.map(async (employeeId) => {
          const employee = employees.find(emp => emp.id === employeeId);
          
          // Calculate age for CPF contribution
          const birthDate = employee.date_of_birth ? new Date(employee.date_of_birth) : new Date();
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          
          // Basic salary defaulting to 0 if not set
          const basicSalary = employee.basic_salary || 0;
          
          // In a real app, you'd fetch allowances and deductions from the database
          const allowances = 0;
          const deductions = 0;
          
          // Calculate CPF contributions
          const cpf = calculateCpfContributions(basicSalary, age);
          
          const grossPay = basicSalary + allowances;
          const netPay = grossPay - deductions - cpf.employee;
          
          // Create payroll item
          const payrollItem = {
            payroll_period_id: currentPeriodId as string,
            employee_id: employeeId,
            basic_salary: basicSalary,
            allowances: allowances,
            deductions: deductions,
            employee_cpf: cpf.employee,
            employer_cpf: cpf.employer,
            sdl: Math.min(basicSalary * 0.0025, 11.25), // 0.25% capped at $11.25
            sinda: 0, // These would be based on employee's race/religion
            cdac: 0, 
            mbmf: 0,
            gross_pay: grossPay,
            net_pay: netPay,
            status: 'Calculated' as const
          };
          
          // Insert into database
          const { data, error } = await supabase
            .from('payroll_items')
            .insert(payrollItem)
            .select()
            .single();
            
          if (error) {
            throw error;
          }
          
          return data;
        })
      );
      
      setPayrollItems(calculatedItems);
      
      toast({
        title: 'Payroll Calculated',
        description: `Successfully calculated payroll for ${calculatedItems.length} employees`,
      });
    } catch (error: any) {
      toast({
        title: 'Error calculating payroll',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    try {
      setLoading(true);
      
      // Update payroll period status
      const { error } = await supabase
        .from('payroll_periods')
        .update({ status: 'Completed' })
        .eq('id', currentPeriodId);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Payroll Finalized',
        description: 'Payroll has been successfully finalized',
      });
      
      // Reset form for new payroll
      setPeriodName('');
      setStartDate('');
      setEndDate('');
      setPaymentDate('');
      setSelectedEmployees([]);
      setPayrollItems([]);
      setPeriodCreated(false);
      setCurrentPeriodId(null);
      
    } catch (error: any) {
      toast({
        title: 'Error finalizing payroll',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Calculate Payroll</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue="period-details" className="w-full">
            <AccordionItem value="period-details">
              <AccordionTrigger>Payroll Period Details</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="period-name">Period Name</Label>
                      <Input 
                        id="period-name" 
                        placeholder="e.g., July 2024 Payroll"
                        value={periodName}
                        onChange={(e) => setPeriodName(e.target.value)}
                        disabled={periodCreated}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-date">Payment Date</Label>
                      <Input 
                        id="payment-date" 
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        disabled={periodCreated}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input 
                        id="start-date" 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        disabled={periodCreated}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input 
                        id="end-date" 
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        disabled={periodCreated}
                      />
                    </div>
                  </div>
                  {!periodCreated && (
                    <Button 
                      onClick={handleCreatePeriod} 
                      disabled={loading}
                      isLoading={loading}
                    >
                      Create Payroll Period
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {periodCreated && (
              <AccordionItem value="employee-selection">
                <AccordionTrigger>Select Employees</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium">Select employees for payroll calculation</h3>
                      <Button variant="outline" onClick={handleSelectAll}>
                        {selectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-blue-700 text-white">
                          <tr>
                            <th className="py-2 px-4 text-left w-8">Select</th>
                            <th className="py-2 px-4 text-left">Name</th>
                            <th className="py-2 px-4 text-left">Job Title</th>
                            <th className="py-2 px-4 text-left">Department</th>
                            <th className="py-2 px-4 text-right">Basic Salary</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employees.map(employee => (
                            <tr key={employee.id} className="border-t">
                              <td className="py-2 px-4">
                                <input 
                                  type="checkbox"
                                  checked={selectedEmployees.includes(employee.id)}
                                  onChange={() => handleEmployeeSelect(employee.id)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                              </td>
                              <td className="py-2 px-4">{employee.full_name}</td>
                              <td className="py-2 px-4">{employee.job_title || 'Not set'}</td>
                              <td className="py-2 px-4">{employee.department || 'Not set'}</td>
                              <td className="py-2 px-4 text-right">${employee.basic_salary?.toLocaleString() || '0.00'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <Button 
                      onClick={handleCalculatePayroll} 
                      disabled={selectedEmployees.length === 0 || loading}
                      isLoading={loading}
                    >
                      Calculate Payroll for Selected
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {payrollItems.length > 0 && (
              <AccordionItem value="calculation-results">
                <AccordionTrigger>Payroll Calculation Results</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="border rounded-md overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-blue-700 text-white">
                          <tr>
                            <th className="py-2 px-2 text-left">Employee</th>
                            <th className="py-2 px-2 text-right">Basic Salary</th>
                            <th className="py-2 px-2 text-right">Allowances</th>
                            <th className="py-2 px-2 text-right">Deductions</th>
                            <th className="py-2 px-2 text-right">CPF (Employee)</th>
                            <th className="py-2 px-2 text-right">CPF (Employer)</th>
                            <th className="py-2 px-2 text-right">Gross Pay</th>
                            <th className="py-2 px-2 text-right">Net Pay</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payrollItems.map((item) => {
                            const employee = employees.find(e => e.id === item.employee_id);
                            return (
                              <tr key={item.id} className="border-t">
                                <td className="py-2 px-2">{employee?.full_name || 'Unknown'}</td>
                                <td className="py-2 px-2 text-right">${item.basic_salary.toFixed(2)}</td>
                                <td className="py-2 px-2 text-right">${item.allowances.toFixed(2)}</td>
                                <td className="py-2 px-2 text-right">${item.deductions.toFixed(2)}</td>
                                <td className="py-2 px-2 text-right">${item.employee_cpf.toFixed(2)}</td>
                                <td className="py-2 px-2 text-right">${item.employer_cpf.toFixed(2)}</td>
                                <td className="py-2 px-2 text-right">${item.gross_pay.toFixed(2)}</td>
                                <td className="py-2 px-2 text-right">${item.net_pay.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-gray-100 font-medium">
                          <tr>
                            <td className="py-2 px-2">Total</td>
                            <td className="py-2 px-2 text-right">
                              ${payrollItems.reduce((sum, item) => sum + item.basic_salary, 0).toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-right">
                              ${payrollItems.reduce((sum, item) => sum + item.allowances, 0).toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-right">
                              ${payrollItems.reduce((sum, item) => sum + item.deductions, 0).toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-right">
                              ${payrollItems.reduce((sum, item) => sum + item.employee_cpf, 0).toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-right">
                              ${payrollItems.reduce((sum, item) => sum + item.employer_cpf, 0).toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-right">
                              ${payrollItems.reduce((sum, item) => sum + item.gross_pay, 0).toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-right">
                              ${payrollItems.reduce((sum, item) => sum + item.net_pay, 0).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        onClick={() => setPayrollItems([])}
                      >
                        Reset Calculations
                      </Button>
                      <Button 
                        onClick={handleFinalize}
                        disabled={loading}
                        isLoading={loading}
                      >
                        Finalize Payroll
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollCalculator;
