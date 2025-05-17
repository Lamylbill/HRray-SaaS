import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LeaveRequest, LeaveType, LeaveRecordsViewProps } from './interfaces';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui-custom/Button';
import { Eye, Filter, ArrowUpDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAuthorizedClient, supabase } from '@/integrations/supabase/client';
import { LeaveActionButtons } from './LeaveActionButtons';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const STATUS_OPTIONS = ['Pending', 'Approved', 'Rejected'] as const;
type Status = typeof STATUS_OPTIONS[number];
type SortableColumn = 'employee.full_name' | 'leave_type.name' | 'start_date' | 'chargeable_duration' | 'status';

const LeaveRecordsView: React.FC<LeaveRecordsViewProps> = ({ 
  availableLeaveTypes,
  onlyPending = false,
  title = 'Leave Records',
  selectedLeaveTypes = [],
  onLeaveTypeFilter
}) => {
  const [allLeaveRequests, setAllLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filterLeaveTypeIds, setFilterLeaveTypeIds] = useState<string[]>(selectedLeaveTypes);
  const [filterStatuses, setFilterStatuses] = useState<Status[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortableColumn | null; direction: 'ascending' | 'descending' }>({ key: 'status', direction: 'ascending' });

  const fetchAndFormatLeaveRequests = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const authorizedClient = getAuthorizedClient();
      const { data: leaveRequestsData, error } = await authorizedClient
        .from('leave_requests')
        .select(`id, employee_id, start_date, end_date, status, half_day, half_day_type, created_at, chargeable_duration, leave_type:leave_type_id(id, name, color, is_paid)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const employeeIds = [...new Set(leaveRequestsData.map(lr => lr.employee_id))];
      const { data: employees } = await supabase.from('employees').select('id, full_name').in('id', employeeIds);
      const employeeMap = new Map(employees?.map((e) => [e.id, e]));

      // Correctly format the leave requests and ensure proper typing
      const formatted: LeaveRequest[] = leaveRequestsData.map(lr => {
        // Ensure leave_type is treated as a single LeaveType object, not an array
        const leaveTypeData = lr.leave_type;
        const leaveType: LeaveType = {
          id: leaveTypeData.id,
          name: leaveTypeData.name,
          color: leaveTypeData.color,
          is_paid: leaveTypeData.is_paid
        };
        
        return {
          ...lr,
          employee: employeeMap.get(lr.employee_id) || { id: lr.employee_id, full_name: 'Unknown Employee' },
          leave_type: leaveType
        };
      });

      setAllLeaveRequests(formatted);
    } catch (err) {
      console.error(err);
      setAllLeaveRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAndFormatLeaveRequests();
  }, [fetchAndFormatLeaveRequests]);
  
  // Sync filterLeaveTypeIds with selectedLeaveTypes prop
  useEffect(() => {
    if (selectedLeaveTypes) {
      setFilterLeaveTypeIds(selectedLeaveTypes);
    }
  }, [selectedLeaveTypes]);

  const handleActionComplete = useCallback(() => {
    fetchAndFormatLeaveRequests();
  }, [fetchAndFormatLeaveRequests]);

  const requestSort = (key: SortableColumn) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  };

  // Update parent component when filters change (if callback provided)
  useEffect(() => {
    if (onLeaveTypeFilter && filterLeaveTypeIds.length) {
      onLeaveTypeFilter(filterLeaveTypeIds);
    }
  }, [filterLeaveTypeIds, onLeaveTypeFilter]);

  // Create the filteredRequests using useMemo to avoid recalculation on every render
  const filteredRequests = useMemo(() => {
    // Apply filters
    let filtered = [...allLeaveRequests];
    
    // Filter by status if specified
    if (filterStatuses.length > 0) {
      filtered = filtered.filter(request => filterStatuses.includes(request.status as Status));
    }
    
    // Filter by leave type if specified
    if (filterLeaveTypeIds.length > 0) {
      filtered = filtered.filter(request => filterLeaveTypeIds.includes(request.leave_type.id));
    }
    
    // Apply "onlyPending" filter if specified
    if (onlyPending) {
      filtered = filtered.filter(request => request.status === 'Pending');
    }
    
    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        // Handle nested properties
        if (sortConfig.key === 'employee.full_name') {
          aValue = a.employee.full_name;
          bValue = b.employee.full_name;
        } else if (sortConfig.key === 'leave_type.name') {
          aValue = a.leave_type.name;
          bValue = b.leave_type.name;
        } else {
          // Handle direct properties
          aValue = a[sortConfig.key as keyof LeaveRequest];
          bValue = b[sortConfig.key as keyof LeaveRequest];
        }
        
        // Convert to string if not already for comparison
        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        } else {
          // Handle numeric or date comparison
          return sortConfig.direction === 'ascending' 
            ? (aValue > bValue ? 1 : -1) 
            : (bValue > aValue ? 1 : -1);
        }
      });
    }
    
    return filtered;
  }, [allLeaveRequests, filterStatuses, filterLeaveTypeIds, onlyPending, sortConfig]);

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Pending: 'bg-yellow-100 text-yellow-800',
    };
    return <Badge className={map[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const renderSortableHeader = (label: string, columnKey: SortableColumn, className?: string) => (
    <TableHead className={`${className} px-2`}>
      <Button variant="ghost" onClick={() => requestSort(columnKey)} className="px-1 py-1 h-auto hover:bg-transparent font-semibold text-left" title={`Sort by ${label}`}>
        {label}
        <ArrowUpDown className={`ml-1 h-3 w-3 inline-block ${sortConfig.key === columnKey ? 'opacity-100' : 'opacity-30 transition-opacity'}`} />
      </Button>
    </TableHead>
  );

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Button variant="outline" size="sm" onClick={() => setIsFilterDialogOpen(true)} title="Filter leave records">
          <Filter className="mr-2 h-4 w-4" /> Filters
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="text-sm">
              {renderSortableHeader('Employee', 'employee.full_name', 'w-[22%]')}
              {renderSortableHeader('Leave Type', 'leave_type.name', 'w-[20%]')}
              {renderSortableHeader('Period', 'start_date', 'w-[20%]')}
              {renderSortableHeader('Duration', 'chargeable_duration', 'w-[15%]')}
              {renderSortableHeader('Status', 'status', 'w-[13%]')}
              <TableHead className="text-center w-[10%] px-2">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6}><LoadingSpinner className="mx-auto" /></TableCell></TableRow>
            ) : filteredRequests.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-gray-500">No leave records found.</TableCell></TableRow>
            ) : (
              filteredRequests.map(request => (
                <TableRow key={request.id} className="text-sm">
                  <TableCell>{request.employee.full_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {request.leave_type.color && (
                        <span className="w-3 h-3 rounded-full mr-2 inline-block" style={{ backgroundColor: request.leave_type.color }}></span>
                      )}
                      {request.leave_type.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDate(request.start_date)}{request.start_date !== request.end_date && ` - ${formatDate(request.end_date)}`}
                    {request.half_day && ` (${request.half_day_type || ''} Half Day)`}
                  </TableCell>
                  <TableCell>
                    {typeof request.chargeable_duration === 'number' ? `${request.chargeable_duration} ${request.chargeable_duration === 1 ? 'day' : 'days'}` : 'N/A'}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="text-center">
                    {request.status === 'Pending' ? (
                      <LeaveActionButtons leaveId={request.id} onActionComplete={handleActionComplete} />
                    ) : (
                      <Button variant="ghost" size="icon" disabled title="View Details"><Eye className="h-4 w-4" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Filter Leave Records</DialogTitle>
            <DialogDescription>Select leave types and statuses to filter records.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label className="font-semibold mb-2 block">Leave Types</Label>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-2 border rounded-md p-2">
                {availableLeaveTypes.map(type => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`filter-type-${type.id}`}
                      checked={filterLeaveTypeIds.includes(type.id)}
                      onCheckedChange={(checked) => {
                        setFilterLeaveTypeIds(prev =>
                          checked ? [...prev, type.id] : prev.filter(id => id !== type.id)
                        );
                      }}
                    />
                    <Label htmlFor={`filter-type-${type.id}`} className="text-sm font-normal cursor-pointer">
                      {type.name} {type.is_paid === false && <span className="text-xs text-gray-500 ml-1">(Unpaid)</span>}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="font-semibold mb-2 block">Statuses</Label>
              <div className="space-y-2 border rounded-md p-2">
                {STATUS_OPTIONS.map(status => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`filter-status-${status}`}
                      checked={filterStatuses.includes(status)}
                      onCheckedChange={(checked) => {
                        setFilterStatuses(prev =>
                          checked ? [...prev, status] : prev.filter(s => s !== status)
                        );
                      }}
                    />
                    <Label htmlFor={`filter-status-${status}`} className="text-sm font-normal cursor-pointer">
                      {status}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4 sm:justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => {
              setFilterLeaveTypeIds([]);
              setFilterStatuses([]);
              setIsFilterDialogOpen(false);
            }}>Clear All Filters</Button>
            <Button type="button" variant="outline" onClick={() => setIsFilterDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={() => setIsFilterDialogOpen(false)}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveRecordsView;
