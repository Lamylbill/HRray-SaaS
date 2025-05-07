import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeave } from '@/hooks/use-leave';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { LeaveQuota, LeaveType, Employee } from '@/components/leave-calendar/interfaces';
import { fetchPublicHolidays as fetchHolidaysService } from '@/services/holiday.service';

interface AddLeaveFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialDate?: Date;
}

const months = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];

export const AddLeaveForm: React.FC<AddLeaveFormProps> = ({ onSuccess, onCancel, initialDate }) => {
  const today = initialDate || new Date();
  // Date States
  const [startDay, setStartDay] = useState<number>(today.getDate());
  const [startMonth, setStartMonth] = useState<number>(today.getMonth());
  const [startYear, setStartYear] = useState<number>(today.getFullYear());
  const [endDay, setEndDay] = useState<number>(today.getDate());
  const [endMonth, setEndMonth] = useState<number>(today.getMonth());
  const [endYear, setEndYear] = useState<number>(today.getFullYear());

  // Form Input States
  const [leaveTypeId, setLeaveTypeId] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [isHalfDay, setIsHalfDay] = useState<boolean>(false);
  const [halfDayType, setHalfDayType] = useState<'AM' | 'PM' | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');

  // Data & Calculation States
  const [publicHolidays, setPublicHolidays] = useState<string[]>([]);
  const [calculatedChargeableDays, setCalculatedChargeableDays] = useState<number>(0);
  const [currentSelectedLeaveTypeQuota, setCurrentSelectedLeaveTypeQuota] = useState<LeaveQuota | null>(null); 
  const [isUnpaidLeave, setIsUnpaidLeave] = useState<boolean>(false);
  
  // UI Display States
  const [isQuotaLoading, setIsQuotaLoading] = useState(false);
  const [selectedLeaveTypeBalance, setSelectedLeaveTypeBalance] = useState<number | null>(null); 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Loading States from Hook
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
  const {
    leaveTypes,
    employees,
    isLoadingLeaveTypes,
    isLoadingEmployees,
    isSubmitting,
    fetchLeaveQuota,
    submitLeaveRequest,
  } = useLeave();

  // Effect to fetch Public Holidays
  useEffect(() => {
    if (startYear && endYear && startYear <= endYear) {
        setIsLoadingHolidays(true);
        fetchHolidaysService(Math.min(startYear, endYear), Math.max(startYear, endYear))
            .then(fetchedHolidays => setPublicHolidays([...new Set(fetchedHolidays.map(h => h.date))]))
            .catch(() => setPublicHolidays([]))
            .finally(() => setIsLoadingHolidays(false));
    } else {
        setPublicHolidays([]);
    }
  }, [startYear, endYear]);

  // Memoized function to calculate chargeable days
  const calculateChargeableDaysInternal = useCallback((sDate: Date, eDate: Date, holidays: string[], isHalf: boolean): number => {
    if (sDate > eDate) return 0;
    let chargeableDays = 0;
    let currentDate = new Date(sDate);
    while (currentDate <= eDate) {
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const currentDateStr = format(currentDate, 'yyyy-MM-dd');
      const isHoliday = holidays.includes(currentDateStr);
      if (!isWeekend && !isHoliday) chargeableDays++;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    if (isHalf && sDate.toDateString() === eDate.toDateString()) {
        const sDateStr = format(sDate, 'yyyy-MM-dd');
        if (! (sDate.getDay() === 0 || sDate.getDay() === 6) && !holidays.includes(sDateStr) ) return 0.5;
        else if (chargeableDays > 0) return 0;
    }
    return chargeableDays;
  }, []);

  // Simplified Effect to clear state when employee changes
  useEffect(() => {
      setLeaveTypeId('');
      setCurrentSelectedLeaveTypeQuota(null);
      setSelectedLeaveTypeBalance(null);
      setIsQuotaLoading(false);
      setErrorMessage(null);
      setCalculatedChargeableDays(0); 
      setIsUnpaidLeave(false);
  }, [employeeId]);

  // Main Effect for calculations based on selected leave type and dates
  useEffect(() => {
    let isActive = true;
    const sDate = new Date(startYear, startMonth, startDay);
    const eDate = new Date(endYear, endMonth, endDay);
    let currentSyncErrorMessage: string | null = null;

    // --- 1. Synchronous Validations and Calculations ---
    if (sDate > eDate) {
        currentSyncErrorMessage = "End date cannot be before start date.";
        setCalculatedChargeableDays(0);
        setCurrentSelectedLeaveTypeQuota(null); 
        setSelectedLeaveTypeBalance(null);
        setIsUnpaidLeave(false);
    } else {
      // Calculate chargeable days (only if dates are valid)
      // We use the state setter here, and read 'calculatedChargeableDays' later
      // Using a local variable 'chargeable' here might lead to using stale value in async checks
      setCalculatedChargeableDays(calculateChargeableDaysInternal(sDate, eDate, publicHolidays, isHalfDay));
    }

    // --- 2. Handle Sync Errors ---
    if (currentSyncErrorMessage) {
        setErrorMessage(currentSyncErrorMessage);
        setCurrentSelectedLeaveTypeQuota(null); 
        setSelectedLeaveTypeBalance(null);
        setIsQuotaLoading(false);
        return () => { isActive = false; };
    }

    // If no sync error, clear previous errors
    setErrorMessage(null); 

    // --- 3. Fetch Quota and Check Insufficiency ---
    const selectedLeaveTypeInfo = leaveTypes?.find(lt => lt.id === leaveTypeId);

    if (selectedLeaveTypeInfo?.is_unpaid) {
        setIsUnpaidLeave(true);
        setSelectedLeaveTypeBalance(null); 
        setCurrentSelectedLeaveTypeQuota(null);
        setIsQuotaLoading(false); // Not loading quota for unpaid
    } else {
        setIsUnpaidLeave(false);
        if (employeeId && leaveTypeId && selectedLeaveTypeInfo) {
            setIsQuotaLoading(true); 
            setSelectedLeaveTypeBalance(null); 
            setCurrentSelectedLeaveTypeQuota(null);

            fetchLeaveQuota(employeeId, leaveTypeId)
                .then(detailedQuota => {
                    if (!isActive) return;
                    setCurrentSelectedLeaveTypeQuota(detailedQuota); 
                    let balance = 0;
                    let isInsufficient = false;
                    let specificAsyncErrorMessage: string | null = null; 

                    if (detailedQuota) {
                        balance = (detailedQuota.quota_days || 0) + (detailedQuota.adjustment_days || 0) - (detailedQuota.taken_days || 0);
                        setSelectedLeaveTypeBalance(balance); 
                        
                        // IMPORTANT: Read the latest calculatedChargeableDays state value for the check
                        // To do this reliably inside async, read it via the state setter's functional update form
                        // or trigger another effect dependent on calculatedChargeableDays.
                        // Easier approach: Use the value calculated synchronously IF it's guaranteed not to be stale here.
                        // Let's assume calculateChargeableDaysInternal result stored in state is sufficient for this check.
                        const currentChargeableDays = calculateChargeableDaysInternal(sDate, eDate, publicHolidays, isHalfDay); // Recalculate with current scope's values
                        const remaining = balance - currentChargeableDays; 
                        
                        if (remaining < 0 && currentChargeableDays > 0) {
                            isInsufficient = true;
                        }
                    } else {
                        setSelectedLeaveTypeBalance(0); 
                        const currentChargeableDays = calculateChargeableDaysInternal(sDate, eDate, publicHolidays, isHalfDay); // Recalculate
                        if (currentChargeableDays > 0) { // Only error if trying to take days
                             specificAsyncErrorMessage = 'Leave quota not defined for this type.';
                        }
                    }
                    
                    // Set the main errorMessage based on the flag or other errors
                    if (isInsufficient) {
                         setErrorMessage(`Insufficient leave quota. Requested: ${calculateChargeableDaysInternal(sDate, eDate, publicHolidays, isHalfDay).toFixed(1)}, Available: ${balance.toFixed(1)}`);
                    } else {
                         setErrorMessage(specificAsyncErrorMessage); // This will set "Not defined" or null
                    }
                })
                .catch((error) => {
                    if (!isActive) return;
                    console.error("Error in fetchLeaveQuota promise:", error)
                    setErrorMessage('Could not retrieve quota details.');
                    setSelectedLeaveTypeBalance(null); 
                    setCurrentSelectedLeaveTypeQuota(null);
                })
                .finally(() => {
                   if (isActive) setIsQuotaLoading(false); 
                });
        } else { 
            setIsQuotaLoading(false); 
            setSelectedLeaveTypeBalance(null); 
            setCurrentSelectedLeaveTypeQuota(null);
        }
    }
    
    return () => { isActive = false; };
  }, [
    startDay, startMonth, startYear, endDay, endMonth, endYear,
    isHalfDay, leaveTypeId, employeeId, publicHolidays, 
    fetchLeaveQuota, leaveTypes, calculateChargeableDaysInternal 
    // Note: removed calculatedChargeableDays from here to avoid potential loop, 
    // recalculated it inside the effect where needed for the async check.
  ]);

  // --- Handle Submit ---
   const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Perform all validations first and collect potential error message
    let validationErrorMessage: string | null = null;

    if (!employeeId || !leaveTypeId) validationErrorMessage = 'Please select an employee and a leave type.';
    const startDateObj = new Date(startYear, startMonth, startDay);
    const endDateObj = new Date(endYear, endMonth, endDay);
    if (endDateObj < startDateObj) validationErrorMessage = 'End date cannot be before start date.';
    if (calculatedChargeableDays <= 0 && isHalfDay) validationErrorMessage = "Half-day can only be applied to a single chargeable day.";

    // Quota check
    if (!isUnpaidLeave && !validationErrorMessage) { // Only check quota if other validations pass
        if (currentSelectedLeaveTypeQuota) {
            const currentBalance = (currentSelectedLeaveTypeQuota.quota_days || 0) + (currentSelectedLeaveTypeQuota.adjustment_days || 0) - (currentSelectedLeaveTypeQuota.taken_days || 0);
            const remainingAfterRequest = currentBalance - calculatedChargeableDays;
            if (remainingAfterRequest < 0 && calculatedChargeableDays > 0) {
                validationErrorMessage = `Insufficient leave quota. Requested: ${calculatedChargeableDays.toFixed(1)}, Available: ${currentBalance.toFixed(1)}`;
            }
        } else if (!isQuotaLoading && calculatedChargeableDays > 0) { // Quota object not available, wasn't loading, not unpaid, but requesting days
             const currentSelectedLeaveTypeInfo = leaveTypes?.find(lt => lt.id === leaveTypeId);
             if (currentSelectedLeaveTypeInfo && !currentSelectedLeaveTypeInfo.is_unpaid) {
                 validationErrorMessage = `Leave quota not defined or couldn't be loaded. Cannot request ${calculatedChargeableDays.toFixed(1)} days.`;
             }
        }
    }

    // If any validation error was found, set it and stop.
    if (validationErrorMessage) {
        setErrorMessage(validationErrorMessage);
        return;
    }

    // If an "Insufficient quota" error persists from the useEffect async check, also stop.
     if (errorMessage && errorMessage.toLowerCase().includes("insufficient leave quota")) {
        return; 
    }

    // All checks passed, clear errors and proceed
    setErrorMessage(null); 

    try {
      await submitLeaveRequest({
        employee_id: employeeId, leave_type_id: leaveTypeId,
        start_date: format(startDateObj, 'yyyy-MM-dd'), end_date: format(endDateObj, 'yyyy-MM-dd'),
        notes, half_day: isHalfDay, half_day_type: isHalfDay ? halfDayType : undefined,
        chargeable_duration: calculatedChargeableDays, status: 'Pending'
      });
      onSuccess();
    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred while submitting the leave request.');
    }
  };

  // --- Loading State ---
  if (isLoadingLeaveTypes || isLoadingEmployees) {
    return ( <div className="flex justify-center items-center p-8"><LoadingSpinner size="lg" /><span>Loading initial data...</span></div> );
  }

  // --- Date Array Generation ---
  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  let startDaysArray: number[] = [];
  if (typeof startMonth === 'number' && !isNaN(startMonth) && typeof startYear === 'number' && !isNaN(startYear)) {
    startDaysArray = Array.from({ length: daysInMonth(startMonth, startYear) }, (_, i) => i + 1);
  }
  let endDaysArray: number[] = [];
  if (typeof endMonth === 'number' && !isNaN(endMonth) && typeof endYear === 'number' && !isNaN(endYear)) {
    endDaysArray = Array.from({ length: daysInMonth(endMonth, endYear) }, (_, i) => i + 1);
  }
  const currentFiscalYear = new Date().getFullYear();
  const yearsArray = Array.from({ length: 5 }, (_, i) => currentFiscalYear - 2 + i);
  
  const getSelectedLeaveTypeName = () => leaveTypes.find(lt => lt.id === leaveTypeId)?.name || '';

  // --- Render Form ---
  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-1">
      {/* Employee Select */}
      <div className="space-y-2">
        <Label htmlFor="employee">Employee</Label>
        <Select value={employeeId} onValueChange={setEmployeeId} required>
          <SelectTrigger id="employee"><SelectValue placeholder="Select employee" /></SelectTrigger>
          <SelectContent>{employees?.map(e => (<SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>))}</SelectContent>
        </Select>
      </div>

      {/* Leave Type Select */}
      <div className="space-y-2">
        <Label htmlFor="leave-type">Leave Type</Label>
        <Select value={leaveTypeId} onValueChange={setLeaveTypeId} required disabled={!employeeId}>
          <SelectTrigger id="leave-type">
            <SelectValue placeholder={!employeeId ? "Select employee first" : "Select leave type"}>
              {leaveTypeId ? (
                <div className="flex items-center">
                   {leaveTypes.find(lt => lt.id === leaveTypeId)?.color && <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: leaveTypes.find(lt => lt.id === leaveTypeId)?.color }} />}
                   {getSelectedLeaveTypeName()}
                   {isQuotaLoading && <Loader2 className="ml-2 h-3 w-3 animate-spin" />}
                   {!isQuotaLoading && selectedLeaveTypeBalance !== null && !isUnpaidLeave && (<span className="ml-1 text-gray-500 text-xs">({selectedLeaveTypeBalance.toFixed(1)} days left)</span>)}
                   {!isQuotaLoading && isUnpaidLeave && (<span className="ml-1 text-gray-500 text-xs">(Unpaid)</span>)}
                </div>
              ) : null }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>{leaveTypes?.map(type => (<SelectItem key={type.id} value={type.id}><div className="flex items-center">{type.color && <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: type.color }} />} {type.name} {type.is_unpaid && <span className="ml-1 text-gray-500 text-xs">(Unpaid)</span>}</div></SelectItem>))}</SelectContent>
        </Select>
      </div>

      {/* Date Pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Date */}
        <div className="space-y-2"><Label>Start Date</Label><div className="flex space-x-2"><Select value={String(startDay)} onValueChange={(v) => setStartDay(Number(v))}><SelectTrigger className="w-1/3"><SelectValue /></SelectTrigger><SelectContent>{startDaysArray.map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}</SelectContent></Select><Select value={String(startMonth)} onValueChange={(v) => setStartMonth(Number(v))}><SelectTrigger className="w-1/2"><SelectValue /></SelectTrigger><SelectContent>{months.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent></Select><Select value={String(startYear)} onValueChange={(v) => setStartYear(Number(v))}><SelectTrigger className="w-1/3"><SelectValue /></SelectTrigger><SelectContent>{yearsArray.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select></div></div>
        {/* End Date */}
        <div className="space-y-2"><Label>End Date</Label><div className="flex space-x-2"><Select value={String(endDay)} onValueChange={(v) => setEndDay(Number(v))}><SelectTrigger className="w-1/3"><SelectValue /></SelectTrigger><SelectContent>{endDaysArray.map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}</SelectContent></Select><Select value={String(endMonth)} onValueChange={(v) => setEndMonth(Number(v))}><SelectTrigger className="w-1/2"><SelectValue /></SelectTrigger><SelectContent>{months.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent></Select><Select value={String(endYear)} onValueChange={(v) => setEndYear(Number(v))}><SelectTrigger className="w-1/3"><SelectValue /></SelectTrigger><SelectContent>{yearsArray.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select></div></div>
      </div>
      
      {/* Half Day Checkbox */}
      <div className="flex items-center space-x-2"><input type="checkbox" id="half-day-checkbox" checked={isHalfDay} onChange={(e)=>{const chk=e.target.checked;setIsHalfDay(chk);if(!chk)setHalfDayType(undefined);else{if(!halfDayType)setHalfDayType('AM');setEndDay(startDay);setEndMonth(startMonth);setEndYear(startYear);}}} className="h-4 w-4"/><Label htmlFor="half-day-checkbox" className="cursor-pointer text-sm">Half Day</Label>{isHalfDay && (<Select value={halfDayType||'AM'} onValueChange={(v:'AM'|'PM')=>setHalfDayType(v)}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="AM">AM</SelectItem><SelectItem value="PM">PM</SelectItem></SelectContent></Select>)}</div>

      {/* Calculated Days & Specific Error */}
      <div className="space-y-1">
        <div className="text-sm text-gray-700">Calculated Chargeable Days: {calculatedChargeableDays.toFixed(1)}</div>
        {errorMessage && errorMessage.toLowerCase().includes("insufficient leave quota") && (<p className="text-sm text-red-500">{errorMessage}</p>)}
      </div>

      {/* Notes */}
      <div className="space-y-2"><Label htmlFor="notes">Notes (Optional)</Label><Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any additional information"/></div>

      {/* General Errors */}
      {errorMessage && !errorMessage.toLowerCase().includes("insufficient leave quota") && (<p className="text-sm text-red-500 mt-2">{errorMessage}</p>)}

      {/* Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button 
          type="submit" 
          disabled={ isSubmitting || isLoadingHolidays || isLoadingLeaveTypes || isLoadingEmployees || isQuotaLoading || !!errorMessage } 
          className="bg-blue-700 text-white hover:bg-blue-800" // <<< Changed to blue-700
        >
          {(isSubmitting || isQuotaLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </div>
    </form>
  );
};