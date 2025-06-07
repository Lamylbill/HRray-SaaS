import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LeaveRequest, LeaveType } from './interfaces';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui-custom/Button';
import { Eye, Filter, ArrowUpDown, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAuthorizedClient, supabase } from '@/integrations/supabase/client';
import { LeaveActionButtons } from './LeaveActionButtons';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const STATUS_OPTIONS = ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Past'] as const;
type Status = typeof STATUS_OPTIONS[number];
type SortableColumn = 'employee.full_name' | 'leave_type.name' | 'start_date' | 'chargeable_duration' | 'status';

type LeaveRecordsViewProps = {
  availableLeaveTypes: LeaveType[];
  onlyPending?: boolean;
  title?: string;
};

const LeaveRecordsView: React.FC<LeaveRecordsViewProps> = ({ availableLeaveTypes, onlyPending = false, title = 'Leave Records' }) => {
  const [allLeaveRequests, setAllLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filterLeaveTypeIds, setFilterLeaveTypeIds] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<Status[]>([]);
  const [filterEmployeeIds, setFilterEmployeeIds] = useState<string[]>([]);
  const [employeeList, setEmployeeList] = useState<{ id: string, full_name: string }[]>([]);
  const [isStaffFilterOpen, setIsStaffFilterOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortableColumn | null; direction: 'ascending' | 'descending' }>({ key: null, direction: 'ascending' });

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
      setEmployeeList(employees || []);

      const now = new Date();
      const formatted: LeaveRequest[] = leaveRequestsData.map(lr => {
        const endDate = new Date(lr.end_date);
        const isPast = lr.status === 'Approved' && endDate < now;
        return {
          ...lr,
          status: isPast ? 'Past' : lr.status,
          employee: employeeMap.get(lr.employee_id) || { id: lr.employee_id, full_name: 'Unknown Employee' },
          leave_type: Array.isArray(lr.leave_type) ? lr.leave_type[0] : lr.leave_type || { id: '', name: 'Unknown', color: '#808080', is_paid: true },
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

  const handleActionComplete = useCallback(() => {
    fetchAndFormatLeaveRequests();
  }, [fetchAndFormatLeaveRequests]);

  const requestSort = (key: SortableColumn) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const map = {
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Cancelled: 'bg-blue-100 text-blue-800',
      Past: 'bg-gray-200 text-gray-700'
    };
    return <Badge className={map[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const filteredRequests = useMemo(() => {
    let result = [...allLeaveRequests];

    if (onlyPending) {
      result = result.filter(r => r.status === 'Pending');
    }
    if (filterLeaveTypeIds.length > 0) {
      result = result.filter(r => filterLeaveTypeIds.includes(r.leave_type.id));
    }
    if (filterStatuses.length > 0) {
      result = result.filter(r => filterStatuses.includes(r.status as Status));
    }
    if (filterEmployeeIds.length > 0) {
      result = result.filter(r => filterEmployeeIds.includes(r.employee.id));
    }

    const statusOrder = { 'Pending': 1, 'Approved': 2, 'Rejected': 3, 'Cancelled': 4, 'Past': 5 };
    const direction = sortConfig.direction === 'ascending' ? 1 : -1;

    result.sort((a, b) => {
      let aVal, bVal;
      if (sortConfig.key === 'status') {
        aVal = statusOrder[a.status] || 99;
        bVal = statusOrder[b.status] || 99;
      } else if (sortConfig.key === 'employee.full_name') {
        aVal = a.employee.full_name.toLowerCase();
        bVal = b.employee.full_name.toLowerCase();
      } else if (sortConfig.key === 'leave_type.name') {
        aVal = a.leave_type.name.toLowerCase();
        bVal = b.leave_type.name.toLowerCase();
      } else if (sortConfig.key === 'start_date') {
        aVal = new Date(a.start_date).getTime();
        bVal = new Date(b.start_date).getTime();
      } else if (sortConfig.key === 'chargeable_duration') {
        aVal = a.chargeable_duration ?? 0;
        bVal = b.chargeable_duration ?? 0;
      } else {
        aVal = statusOrder[a.status] || 99;
        bVal = statusOrder[b.status] || 99;
      }

      if (aVal < bVal) return -1 * direction;
      if (aVal > bVal) return 1 * direction;

      const aStart = new Date(a.start_date).getTime();
      const bStart = new Date(b.start_date).getTime();
      return direction * (aStart - bStart);
    });

    return result;
  }, [allLeaveRequests, filterLeaveTypeIds, filterStatuses, filterEmployeeIds, sortConfig, onlyPending]);

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-2">
          <Popover open={isStaffFilterOpen} onOpenChange={setIsStaffFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" /> Staff Selection ({filterEmployeeIds.length} selected)
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 max-h-60 overflow-y-auto">
              {employeeList.map(emp => (
                <div key={emp.id} className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id={`emp-${emp.id}`}
                    checked={filterEmployeeIds.includes(emp.id)}
                    onCheckedChange={(checked) => {
                      setFilterEmployeeIds(prev =>
                        checked ? [...prev, emp.id] : prev.filter(id => id !== emp.id)
                      );
                    }}
                  />
                  <Label htmlFor={`emp-${emp.id}`} className="text-sm cursor-pointer">{emp.full_name}</Label>
                </div>
              ))}
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={() => setIsFilterDialogOpen(true)} title="Filter leave records">
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="text-sm">
              <TableHead>Employee</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
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
