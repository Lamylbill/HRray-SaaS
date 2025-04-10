
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface LeaveType {
  id: string;
  name: string;
  color: string;
}

interface Employee {
  id: string;
  full_name: string;
}

interface AddLeaveFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialDate?: Date;
}

export const AddLeaveForm: React.FC<AddLeaveFormProps> = ({ onSuccess, onCancel, initialDate }) => {
  const [startDate, setStartDate] = useState<Date | undefined>(initialDate || new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(initialDate || new Date());
  const [leaveTypeId, setLeaveTypeId] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isHalfDay, setIsHalfDay] = useState<boolean>(false);
  const [halfDayType, setHalfDayType] = useState<string>('AM');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch leave types and employees
  useEffect(() => {
    const fetchLeaveTypesAndEmployees = async () => {
      setIsLoading(true);
      try {
        // Fetch leave types
        const { data: leaveTypesData, error: leaveTypesError } = await supabase
          .from('leave_types')
          .select('*')
          .order('name');
        
        if (leaveTypesError) throw leaveTypesError;
        setLeaveTypes(leaveTypesData || []);
        
        // Fetch employees
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('id, full_name')
          .order('full_name');
        
        if (employeesError) throw employeesError;
        setEmployees(employeesData || []);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load leave types and employees",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLeaveTypesAndEmployees();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate || !leaveTypeId || !employeeId) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: employeeId,
          leave_type_id: leaveTypeId,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          half_day: isHalfDay,
          half_day_type: isHalfDay ? halfDayType : null,
          notes: notes || null,
          status: 'Pending'
        })
        .select();
      
      if (error) throw error;
      
      onSuccess();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast({
        title: "Error",
        description: "Failed to create leave request",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-hrflow-blue" />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="employee">Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId} required>
              <SelectTrigger id="employee">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leave-type">Leave Type</Label>
            <Select value={leaveTypeId} onValueChange={setLeaveTypeId} required>
              <SelectTrigger id="leave-type">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center">
                      <span 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: type.color }} 
                      />
                      {type.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="end-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => 
                      startDate ? date < startDate : false
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="half-day"
              checked={isHalfDay}
              onChange={(e) => setIsHalfDay(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="half-day" className="cursor-pointer">Half Day</Label>
            
            {isHalfDay && (
              <Select value={halfDayType} onValueChange={setHalfDayType}>
                <SelectTrigger id="half-day-type" className="w-24">
                  <SelectValue placeholder="AM/PM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional information"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </div>
        </>
      )}
    </form>
  );
};
