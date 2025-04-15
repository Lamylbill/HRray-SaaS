
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label"
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeave } from '@/hooks/use-leave';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { LeaveQuota } from '@/components/leave-calendar/interfaces';

interface AddLeaveFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialDate?: Date;
}

const months = ["January", "February", "March", "April", "May", "June", 
                "July", "August", "September", "October", "November", "December"];

export const AddLeaveForm: React.FC<AddLeaveFormProps> = ({ onSuccess, onCancel, initialDate }) => {
  const today = initialDate || new Date();
  const [startDay, setStartDay] = useState<number>(today.getDate());
  const [startMonth, setStartMonth] = useState<number>(today.getMonth());
  const [startYear, setStartYear] = useState<number>(today.getFullYear());
  
  const [endDay, setEndDay] = useState<number>(today.getDate());
  const [endMonth, setEndMonth] = useState<number>(today.getMonth());
  const [endYear, setEndYear] = useState<number>(today.getFullYear());
  const [leaveTypeId, setLeaveTypeId] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [isHalfDay, setIsHalfDay] = useState<boolean>(false);
  const [halfDayType, setHalfDayType] = useState<'AM' | 'PM'>('AM');
  const [notes, setNotes] = useState<string>('');
  const [quotaLeft, setQuotaLeft] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableQuota, setAvailableQuota] = useState<LeaveQuota | null>(null);
  const [isUnpaidLeave, setIsUnpaidLeave] = useState<boolean>(false);

  const {
    leaveTypes,
    employees,
    isLoadingLeaveTypes,
    isLoadingEmployees,
    isSubmitting,
    fetchLeaveQuota,
    submitLeaveRequest,
  } = useLeave();

  const calculateRequestedDays = (): number => {
    if (!startDay || !startMonth || !startYear || !endDay || !endMonth || !endYear) {
      return 0;
    }
  
    const startDate = new Date(startYear, startMonth, startDay);
    const endDate = new Date(endYear, endMonth, endDay);
  
    if (endDate < startDate) {
      return.0;
    }
  
    let days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
    if (isHalfDay) {
      days -= 0.5;
    }
  
    return days;
  };
  
  const updateQuotaLeft = async () => {
    if (leaveTypeId && employeeId) {
      try {
        // Check if this is an unpaid leave type
        const leaveType = leaveTypes?.find(lt => lt.id === leaveTypeId);
        setIsUnpaidLeave(leaveType?.is_paid === false);
        
        const quotaData = await fetchLeaveQuota(employeeId, leaveTypeId);
        
        if (quotaData) {
          setAvailableQuota(quotaData);
          const requestedDays = calculateRequestedDays();
          const availableQuota = quotaData.quota_days - quotaData.taken_days;
          setQuotaLeft(availableQuota - requestedDays);
        }
      } catch (error) {
        console.error('Error fetching quota:', error);
        setQuotaLeft(null);
      }
    } else {
      setQuotaLeft(null);
      setAvailableQuota(null);
      setIsUnpaidLeave(false);
    }
  };

  useEffect(() => {
    updateQuotaLeft();
  }, [employeeId, leaveTypeId, startDay, startMonth, startYear, endDay, endMonth, endYear, isHalfDay]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!isUnpaidLeave && quotaLeft !== null && quotaLeft < 0) {
      setErrorMessage('Insufficient leave quota.');
      return;
    }
  
    if (
      startDay === null || startMonth === null || startYear === null ||
      endDay === null || endMonth === null || endYear === null ||
      leaveTypeId === '' || employeeId === ''
    ) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
  
    setErrorMessage(null);
  
    const startDate = new Date(startYear, startMonth, startDay);
    const endDate = new Date(endYear, endMonth, endDay);
  
    if (endDate < startDate) {
      setErrorMessage('End date cannot be before start date.');
      return;
    }
  
    setErrorMessage(null);
  
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
      setErrorMessage('An error occurred while submitting the leave request.');
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
                  {availableQuota && leaveTypeId === type.id && !type.is_paid && (
                    <span className="ml-2 text-sm text-gray-500">
                      (Unlimited)
                    </span>
                  )}
                  {availableQuota && leaveTypeId === type.id && type.is_paid && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({availableQuota.quota_days - availableQuota.taken_days} days left)
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
          <Label>Start Date (DDMMYYYY)</Label>
          <div className="flex space-x-2">
            <Select 
              value={String(startDay)} 
              onValueChange={(value) => setStartDay(Number(value))}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Day" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={String(day)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={String(startMonth)} 
              onValueChange={(value) => setStartMonth(Number(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={index} value={String(index)}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={String(startYear)} 
              onValueChange={(value) => setStartYear(Number(value))}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => 2024 + i).map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>End Date (DDMMYYYY)</Label>
          <div className="flex space-x-2">
            <Select 
              value={String(endDay)} 
              onValueChange={(value) => setEndDay(Number(value))}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Day" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={String(day)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={String(endMonth)} 
              onValueChange={(value) => setEndMonth(Number(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={index} value={String(index)}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={String(endYear)} 
              onValueChange={(value) => setEndYear(Number(value))}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => 2024 + i).map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(endYear < startYear || (endYear === startYear && endMonth < startMonth) || (endYear === startYear && endMonth === startMonth && endDay < startDay)) && (<p className="text-red-500 text-sm mt-1">
              End date cannot be before start date.
            </p>
          )}


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
        
        <Button 
          type="submit" 
          disabled={
            isSubmitting || 
            (endYear < startYear || (endYear === startYear && endMonth < startMonth) || (endYear === startYear && endMonth === startMonth && endDay < startDay)) ||
            (!isUnpaidLeave && quotaLeft !== null && quotaLeft < 0)
          }
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit 
        </Button>
      </div>
      
      {!isUnpaidLeave && quotaLeft !== null && quotaLeft < 0 && (
        <p className="text-red-500 text-sm mt-2">
          Insufficient leave quota. You have {availableQuota?.quota_days - availableQuota?.taken_days} days left.
        </p>
      )}
    </form>
  );
};
