import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"

interface Employee {
  id: string;
  full_name: string;
  email: string;
}

const PayslipGenerator: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [payPeriodStart, setPayPeriodStart] = useState<Date | undefined>(undefined);
  const [payPeriodEnd, setPayPeriodEnd] = useState<Date | undefined>(undefined);
  const [grossPay, setGrossPay] = useState<string>('');
  const [deductions, setDeductions] = useState<string>('');
  const [netPay, setNetPay] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    calculateNetPay();
  }, [grossPay, deductions]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, email')
        .order('full_name', { ascending: true });
    
      if (error) {
        toast({
          title: "Error fetching employees",
          description: error.message || "Failed to fetch employees",
          variant: "destructive",
        });
        console.error('Error fetching employees:', error);
        return;
      }
    
      // Use the array directly instead of trying to convert it to an object
      setEmployees(data || []);
    
      // Set the selected employee to the first one in the list if there are any
      if (data && data.length > 0) {
        setSelectedEmployee(data[0]);
      }
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error fetching employees",
        description: error.message || "Failed to load employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateNetPay = () => {
    const parsedGrossPay = parseFloat(grossPay);
    const parsedDeductions = parseFloat(deductions);

    if (!isNaN(parsedGrossPay) && !isNaN(parsedDeductions)) {
      setNetPay(parsedGrossPay - parsedDeductions);
    } else {
      setNetPay(0);
    }
  };

  const generatePayslip = async () => {
    if (!selectedEmployee || !payPeriodStart || !payPeriodEnd) {
      toast({
        title: "Required Fields Missing",
        description: "Please select an employee and pay period.",
        variant: "destructive",
      });
      return;
    }

    const payslipData = {
      employee_id: selectedEmployee.id,
      pay_period_start: format(payPeriodStart, 'yyyy-MM-dd'),
      pay_period_end: format(payPeriodEnd, 'yyyy-MM-dd'),
      gross_pay: parseFloat(grossPay),
      deductions: parseFloat(deductions),
      net_pay: netPay,
    };

    try {
      const { data, error } = await supabase
        .from('payslips')
        .insert([payslipData]);

      if (error) {
        console.error('Error creating payslip:', error);
        toast({
          title: "Error generating payslip",
          description: "Failed to generate payslip. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payslip Generated",
          description: "Payslip generated successfully!",
        });
      }
    } catch (error: any) {
      console.error('Error generating payslip:', error);
      toast({
        title: "Error generating payslip",
        description: "Failed to generate payslip. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Payslip Generator</h1>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="employee">Employee</Label>
            <Select onValueChange={(value) => setSelectedEmployee(employees.find(emp => emp.id === value) || null)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select an employee" defaultValue={selectedEmployee?.id} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>{employee.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Pay Period Start</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={format(payPeriodStart || new Date(), 'yyyy-MM-dd') + "w-[240px] justify-start text-left font-normal"}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {payPeriodStart ? format(payPeriodStart, "yyyy-MM-dd") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={payPeriodStart}
                    onSelect={setPayPeriodStart}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Pay Period End</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={format(payPeriodEnd || new Date(), 'yyyy-MM-dd') + "w-[240px] justify-start text-left font-normal"}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {payPeriodEnd ? format(payPeriodEnd, "yyyy-MM-dd") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={payPeriodEnd}
                    onSelect={setPayPeriodEnd}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="grossPay">Gross Pay</Label>
            <Input
              type="number"
              id="grossPay"
              value={grossPay}
              onChange={(e) => setGrossPay(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="deductions">Deductions</Label>
            <Input
              type="number"
              id="deductions"
              value={deductions}
              onChange={(e) => setDeductions(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="netPay">Net Pay</Label>
            <Input
              type="number"
              id="netPay"
              value={netPay.toFixed(2)}
              readOnly
            />
          </div>

          <Button onClick={generatePayslip}>Generate Payslip</Button>
        </div>
      )}
    </div>
  );
};

export default PayslipGenerator;
