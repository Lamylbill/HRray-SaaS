import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Ensure interfaces include LeaveType with is_paid and LeaveRequest with chargeable_duration
import { LeaveRequest, LeaveType } from './interfaces';
// Verify all Shadcn UI and custom component paths are correct for your project
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui-custom/Button'; // Verify path
import { Eye, Filter, ArrowUpDown } from 'lucide-react'; // Ensure lucide-react is installed
import { useAuth } from '@/context/AuthContext'; // Verify path
import { getAuthorizedClient, supabase } from '@/integrations/supabase/client'; // Verify path
import { LeaveActionButtons } from './LeaveActionButtons'; // Verify path relative to this file
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner'; // Verify path
// Import Dialog components (assuming Shadcn UI)
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
// Import Checkbox and Label for the form inside the dialog
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Define possible statuses for filtering
const STATUS_OPTIONS = ["Pending", "Approved", "Rejected"] as const;
type StatusTuple = typeof STATUS_OPTIONS;
type Status = StatusTuple[number];

// Define Props Interface
interface LeaveRecordsViewProps {
  availableLeaveTypes: LeaveType[]; // Receive leave types as prop from parent
}

// Define Sortable Columns type
type SortableColumn = 'employee.full_name' | 'leave_type.name' | 'start_date' | 'chargeable_duration' | 'status';

const LeaveRecordsView: React.FC<LeaveRecordsViewProps> = ({ availableLeaveTypes }) => {
  // State for all fetched records
  const [allLeaveRequests, setAllLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // State for Filtering using Dialog
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filterLeaveTypeIds, setFilterLeaveTypeIds] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<Status[]>([]);

  // State for Sorting (Default to Status, Pending first)
  const [sortConfig, setSortConfig] = useState<{ key: SortableColumn | null; direction: 'ascending' | 'descending' }>({
    key: 'status',
    direction: 'ascending',
  });

  // --- Fetching Logic ---
  const fetchAndFormatLeaveRequests = useCallback(async () => {
    if (!user) { setIsLoading(false); setAllLeaveRequests([]); return; };
    setIsLoading(true);
    try {
      const authorizedClient = getAuthorizedClient();
      // Fetch using is_paid for the related leave type
      const { data: leaveRequestsData, error: leaveRequestsError } = await authorizedClient
        .from('leave_requests')
        .select(`
          id, employee_id, start_date, end_date, status, half_day,
          half_day_type, created_at, chargeable_duration,
          leave_type:leave_type_id(id, name, color, is_paid)
        `) // Select is_paid
        .order('created_at', { ascending: false });

      if (leaveRequestsError) {
          console.error("Supabase error fetching leave requests:", leaveRequestsError);
          throw leaveRequestsError;
      }
      if (!leaveRequestsData) {
        setAllLeaveRequests([]); setIsLoading(false); return;
      }

      const employeeIds = [...new Set(leaveRequestsData.map(lr => lr.employee_id))].filter(id => id);
      if (employeeIds.length === 0) { setAllLeaveRequests([]); setIsLoading(false); return; }

      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, full_name')
        .in('id', employeeIds);

      if (employeesError) {
        console.error("Supabase error fetching employees:", employeesError);
        throw employeesError;
      }
      const employeeMap = new Map(employees?.map((e) => [e.id, e]) || []);

      // Format data
      const formattedData: LeaveRequest[] = leaveRequestsData.map(lr => {
        const employee = employeeMap.get(lr.employee_id) || { id: lr.employee_id, full_name: 'Unknown Employee' };
        const leaveTypeData = lr.leave_type as any;
        const leaveType = leaveTypeData || { id: '', name: 'Unknown Type', color: '#808080', is_paid: true }; // Default to paid

        // Ensure the structure matches the LeaveRequest interface
        return {
          id: lr.id,
          employee: { id: employee.id, full_name: employee.full_name },
          // Ensure this matches LeaveType structure in your interface
          leave_type: {
              id: leaveType.id,
              name: leaveType.name,
              color: leaveType.color,
              is_paid: leaveType.is_paid ?? true, // Use is_paid now
          },
          start_date: lr.start_date,
          end_date: lr.end_date,
          status: lr.status as Status, // Cast, ensure DB values match Status type exactly
          half_day: lr.half_day ?? false,
          half_day_type: lr.half_day_type as "AM" | "PM" | null,
          created_at: lr.created_at,
          chargeable_duration: lr.chargeable_duration, // This is the value we need
        };
      });
      setAllLeaveRequests(formattedData);
    } catch (error) {
      console.error('Error fetching or processing leave requests:', error);
      setAllLeaveRequests([]); // Clear data on error to avoid displaying stale info
    } finally {
      setIsLoading(false);
    }
  }, [user]); // Dependency: user

  useEffect(() => {
    fetchAndFormatLeaveRequests(); // Fetch on initial mount and when user changes
  }, [fetchAndFormatLeaveRequests]);

  // Handler to refresh data when an action (approve/reject) is done in child component
  const handleActionComplete = useCallback(() => {
    fetchAndFormatLeaveRequests();
  }, [fetchAndFormatLeaveRequests]);


  // --- Filtering and Sorting Logic ---
  const processedLeaveRequests = useMemo(() => {
    let filtered = [...allLeaveRequests]; // Start with all fetched requests
    if (filterLeaveTypeIds.length > 0) {
        filtered = filtered.filter(req => req.leave_type?.id && filterLeaveTypeIds.includes(req.leave_type.id));
    }
    if (filterStatuses.length > 0) {
        filtered = filtered.filter(req => filterStatuses.includes(req.status));
    }

    const customStatusOrder: Record<Status, number> = { 'Pending': 1, 'Approved': 2, 'Rejected': 3 };
    let sortedFiltered = [...filtered]; // Create a mutable copy before sorting
    if (sortConfig.key !== null) {
        sortedFiltered.sort((a, b) => {
            const key = sortConfig.key!; // Not null here
            let aValue: any, bValue: any;

            if (key === 'status') { aValue = customStatusOrder[a.status] || 99; bValue = customStatusOrder[b.status] || 99; }
            else if (key === 'employee.full_name') { aValue = a.employee?.full_name?.toLowerCase() || ''; bValue = b.employee?.full_name?.toLowerCase() || ''; }
            else if (key === 'leave_type.name') { aValue = a.leave_type?.name?.toLowerCase() || ''; bValue = b.leave_type?.name?.toLowerCase() || ''; }
            else if (key === 'start_date') { aValue = a.start_date ? new Date(a.start_date).getTime() : 0; bValue = b.start_date ? new Date(b.start_date).getTime() : 0; }
            else { aValue = a[key]; bValue = b[key]; } // Handles chargeable_duration

            // Comparison logic with null/undefined handling
            const valA = aValue ?? (typeof aValue === 'string' ? '' : (typeof aValue === 'number' ? -Infinity : 0));
            const valB = bValue ?? (typeof bValue === 'string' ? '' : (typeof bValue === 'number' ? -Infinity : 0));

            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;

            // Secondary sort by date descending if primary values are equal
            if (key !== 'start_date') {
               const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
               const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
               return dateB - dateA; // Newest first
            }
            return 0;
          });
    }
    return sortedFiltered; // Return sorted/filtered array
  }, [allLeaveRequests, filterLeaveTypeIds, filterStatuses, sortConfig]);


  // --- Sorting Handler ---
  const requestSort = useCallback((key: SortableColumn) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]); // Depends on current sortConfig

  // --- Filter Apply Handler ---
  const handleApplyFilters = useCallback((selectedTypes: string[], selectedStatuses: Status[]) => {
    setFilterLeaveTypeIds(selectedTypes);
    setFilterStatuses(selectedStatuses);
    setIsFilterDialogOpen(false); // Close dialog after applying
  }, []); // No dependencies needed as it only uses setters

  // --- Formatting Functions ---
  const formatDate = useCallback((dateString: string | null | undefined): string => {
    if (!dateString || isNaN(new Date(dateString).getTime())) return 'N/A';
    try { return new Date(dateString).toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch (e) { console.error("Error formatting date:", dateString, e); return 'Invalid Date'; }
  }, []);

  const getStatusBadge = useCallback((status: Status | string | null | undefined) => {
      const defaultStyle = "bg-gray-100 text-gray-800";
      const statusMap: Record<string, string> = { Approved: "bg-green-100 text-green-800", Rejected: "bg-red-100 text-red-800", Pending: "bg-yellow-100 text-yellow-800" };
      const className = status ? (statusMap[status] || defaultStyle) : defaultStyle;
      // Ensure Badge component can handle null/undefined children if status is unknown
      return <Badge className={className}>{status || 'Unknown'}</Badge>;
  }, []);

  // --- Helper to render sortable table headers ---
  const renderSortableHeader = useCallback((label: string, columnKey: SortableColumn, className?: string) => (
    <TableHead className={`${className} p-2`}> {/* Added p-2 */}
      <Button
        variant="ghost"
        onClick={() => requestSort(columnKey)}
        className="px-1 py-1 h-auto hover:bg-transparent font-semibold text-left" // Align left, adjusted padding/height
        title={`Sort by ${label}`}
      >
        {label}
        {/* Icon indicates sort status */}
        <ArrowUpDown className={`ml-1 h-3 w-3 inline-block ${sortConfig.key === columnKey ? 'opacity-100' : 'opacity-30 transition-opacity'}`} />
      </Button>
    </TableHead>
  ), [sortConfig, requestSort]); // Include dependencies


  // --- Render Component ---
  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6"> {/* Slightly reduced padding */}
      {/* Header and Filters Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Leave Records</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterDialogOpen(true)} // Open dialog
            className="flex items-center"
            title="Filter leave records"
          >
              <Filter className="mr-2 h-4 w-4" /> Filters
              {(filterLeaveTypeIds.length > 0 || filterStatuses.length > 0) &&
                <span className="ml-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {filterLeaveTypeIds.length + filterStatuses.length}
                </span>
              }
          </Button>
        </div>
      </div>
      {/* Active Filters Display */}
      {(filterLeaveTypeIds.length > 0 || filterStatuses.length > 0) && ( <div className="mb-4 flex flex-wrap gap-2 items-center"> <span className="text-sm text-gray-600">Active Filters:</span> {filterLeaveTypeIds.map(id => { const type = availableLeaveTypes?.find(lt => lt.id === id); return type ? <Badge key={id} variant="secondary" className="px-2 py-0.5">{type.name}</Badge> : null; })} {filterStatuses.map(status => (<Badge key={status} variant="secondary" className="px-2 py-0.5">{status}</Badge> ))} <Button variant="link" size="sm" onClick={() => { setFilterLeaveTypeIds([]); setFilterStatuses([]); }} className="text-xs text-blue-600 hover:text-blue-800 h-auto p-0"> Clear all </Button> </div> )}

      {/* Table Display */}
      {isLoading ? ( <div className="py-8 text-center flex justify-center items-center"><LoadingSpinner className="mr-2" /><p className="text-gray-500">Loading leave records...</p></div> )
       : allLeaveRequests.length === 0 ? ( <div className="py-8 text-center border border-dashed border-gray-200 rounded-md"><p className="text-gray-500">No leave records found.</p></div> )
       : (
         <div className="overflow-x-auto">
           {/* Layout adjustments for scrolling */}
           <Table className="w-full table-fixed">
             <TableHeader>
               <TableRow>
                 {/* Adjusted example widths - TUNE THESE AS NEEDED! */}
                 {renderSortableHeader('Employee', 'employee.full_name', "w-[28%]")}
                 {renderSortableHeader('Leave Type', 'leave_type.name', "w-[18%]")}
                 {renderSortableHeader('Period Start', 'start_date', "w-[18%]")}
                 {renderSortableHeader('Duration', 'chargeable_duration', "w-[10%]")}
                 {renderSortableHeader('Status', 'status', "w-[11%]")}
                 {/* Ensure header padding matches cell padding */}
                 <TableHead className="text-right w-[15%] p-2">Actions</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {processedLeaveRequests.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center text-gray-500 p-2"> No records match the current filters. </TableCell></TableRow>
               ) : (
                   processedLeaveRequests.map(request => {
                      const durationValue = request.chargeable_duration;
                      const durationDisplay = durationValue !== null && durationValue !== undefined && typeof durationValue === 'number' ? `${durationValue} ${durationValue === 1 ? 'day' : 'days'}` : 'N/A';
                      return (<TableRow key={request.id}>
                         {/* Added truncate and title, reduced padding */}
                         <TableCell className="p-2 truncate" title={request.employee?.full_name || ''}>{request.employee?.full_name || 'N/A'}</TableCell>
                         <TableCell className="p-2"><div className="flex items-center">{request.leave_type?.color && <div className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: request.leave_type.color }}></div>}{request.leave_type?.name || 'N/A'}</div></TableCell>
                         {/* Added wrapping and reduced padding */}
                         <TableCell className="p-2 whitespace-normal">{formatDate(request.start_date)}{request.start_date !== request.end_date && ` - ${formatDate(request.end_date)}`}{request.half_day && ` (${request.half_day_type || ''} Half Day)`}</TableCell>
                         <TableCell className="p-2">{durationDisplay}</TableCell>
                         <TableCell className="p-2">{getStatusBadge(request.status)}</TableCell>
                         <TableCell className="text-right p-2">{request.status === 'Pending' && user ? (<LeaveActionButtons leaveId={request.id} onActionComplete={handleActionComplete}/>) : (<Button variant="ghost" size="icon" title="View Details" disabled className="h-8 w-8"><Eye className="h-4 w-4" /></Button>)}</TableCell>
                       </TableRow>);
                   })
               )}
             </TableBody>
           </Table>
         </div>
       )}

      {/* Filter Dialog - Wider */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        {/* Increased max width */}
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Filter Leave Records</DialogTitle>
            <DialogDescription>Select leave types and statuses to view specific records.</DialogDescription>
          </DialogHeader>
          <LeaveFilterForm
            availableLeaveTypes={availableLeaveTypes || []}
            currentTypeIds={filterLeaveTypeIds}
            currentStatuses={filterStatuses}
            onApplyFilters={handleApplyFilters}
            onCancel={() => setIsFilterDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};


// --- Separate component for the Filter Form within the Dialog ---
interface LeaveFilterFormProps {
    availableLeaveTypes: LeaveType[];
    currentTypeIds: string[];
    currentStatuses: Status[];
    onApplyFilters: (selectedTypes: string[], selectedStatuses: Status[]) => void;
    onCancel: () => void;
}

const LeaveFilterForm: React.FC<LeaveFilterFormProps> = ({
    availableLeaveTypes, currentTypeIds, currentStatuses, onApplyFilters, onCancel
}) => {
    // Local state for selections within the form before applying
    const [selectedTypes, setSelectedTypes] = useState<string[]>(currentTypeIds);
    const [selectedStatuses, setSelectedStatuses] = useState<Status[]>(currentStatuses);

    // Use useCallback for handlers passed to inputs
    const handleTypeChange = useCallback((typeId: string, checked: boolean | string) => {
        setSelectedTypes(prev =>
            checked === true ? [...prev, typeId] : prev.filter(id => id !== typeId)
        );
    }, []);

    const handleStatusChange = useCallback((status: Status, checked: boolean | string) => {
        setSelectedStatuses(prev =>
            checked === true ? [...prev, status] : prev.filter(s => s !== status)
        );
    }, []);

    // Apply the locally selected filters to the parent component's state
    const handleApply = () => {
        onApplyFilters(selectedTypes, selectedStatuses);
    };

    // Clear local selections
    const handleClear = () => {
        setSelectedTypes([]);
        setSelectedStatuses([]);
    };

    return (
        <div className="grid gap-4 py-4">
             {/* Leave Type Filters */}
            <div>
                <Label className="font-semibold mb-2 block">Leave Types</Label>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2 border rounded-md p-2">
                    {/* Defensive check */}
                    {Array.isArray(availableLeaveTypes) && availableLeaveTypes.length > 0 ? (
                        availableLeaveTypes.map(type => (
                            <div key={type.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`dialog-type-${type.id}`} // Ensure unique ID
                                    checked={selectedTypes.includes(type.id)}
                                    onCheckedChange={(checked) => handleTypeChange(type.id, checked)}
                                />
                                <Label htmlFor={`dialog-type-${type.id}`} className="text-sm font-normal cursor-pointer flex items-center flex-1">
                                    {type.color && <span className="w-3 h-3 rounded-full mr-2 inline-block flex-shrink-0" style={{ backgroundColor: type.color }} />}
                                    <span className="flex-grow">{type.name}</span>
                                    {/* Use !type.is_paid for Unpaid tag */}
                                    {!type.is_paid && <span className="text-xs text-gray-500 ml-1">(Unpaid)</span>}
                                </Label>
                            </div>
                        ))
                    ) : ( <p className="text-sm text-gray-500 italic">No leave types found to filter.</p> )}
                </div>
            </div>
            {/* Status Filters */}
            <div>
                <Label className="font-semibold mb-2 block">Statuses</Label>
                 <div className="space-y-2 border rounded-md p-2">
                     {STATUS_OPTIONS.map(status => (
                        <div key={status} className="flex items-center space-x-2">
                            <Checkbox
                                id={`dialog-status-${status}`} // Ensure unique ID
                                checked={selectedStatuses.includes(status)}
                                onCheckedChange={(checked) => handleStatusChange(status, checked)}
                            />
                            <Label htmlFor={`dialog-status-${status}`} className="text-sm font-normal cursor-pointer">
                                {status}
                            </Label>
                        </div>
                     ))}
                 </div>
            </div>
            {/* Footer with Actions - Cleaned Up Layout */}
            <DialogFooter className="mt-4 sm:justify-end gap-2"> {/* Default right alignment + gap */}
                 <Button type="button" variant="ghost" onClick={handleClear} className="mr-auto sm:mr-0">Clear Selections</Button>
                 <div className="flex gap-2"> {/* Group Cancel/Apply */}
                     <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                     <Button type="button" onClick={handleApply}>Apply Filters</Button>
                 </div>
            </DialogFooter>
        </div>
    );
};

export default LeaveRecordsView;