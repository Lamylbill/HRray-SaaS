
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useLeave } from '@/hooks/use-leave';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';

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
  const [isHalfDay, setIsHalfDay] = useState<boolean>(false);
  const [halfDayType, setHalfDayType] = useState<'AM' | 'PM'>('AM');
  const [notes, setNotes] = useState<string>('');
  const [quotaLeft, setQuotaLeft] = useState<number | null>(null);

  const {
    leaveTypes,
    employees,
    isLoadingLeaveTypes,
    isLoadingEmployees,
    isSubmitting,
    fetchLeaveQuota,
    submitLeaveRequest,
  } = useLeave();

  useEffect(() => {
    const updateQuota = async () => {
      if (employeeId && leaveTypeId) {
        try {
          const quota = await fetchLeaveQuota(employeeId, leaveTypeId);
          setQuotaLeft(quota ? quota.quota_days - quota.taken_days : null);
        } catch (error) {
          console.error('Error fetching quota:', error);
          setQuotaLeft(null);
        }
      }
    };

    updateQuota();
  }, [employeeId, leaveTypeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate || !leaveTypeId || !employeeId) {
      return;
    }
    
    try {
      await submitLeaveRequest({
        employeeId,
        leaveTypeId,
        startDate,
        endDate,
        notes,
        isHalfDay,
        halfDayType: isHalfDay ? halfDayType : undefined,
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  if (isLoadingLeaveTypes || isLoadingEmployees) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="employee">Employee</Label>
        <Select value={employeeId} onValueChange={setEmployeeId} required>
          <SelectTrigger id="employee">
            <SelectValue placeholder="Select employee" />
          </SelectTrigger>
          <SelectContent>
            {employees?.map((employee) => (
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
            {leaveTypes?.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                <div className="flex items-center">
                  <span 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: type.color }} 
                  />
                  {type.name}
                  {quotaLeft !== null && leaveTypeId === type.id && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({quotaLeft} days left)
                    </span>
                  )}
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
          <Select value={halfDayType} onValueChange={(value: 'AM' | 'PM') => setHalfDayType(value)}>
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
    </form>
  );
};
