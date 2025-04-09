
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Calendar,
  Download,
  Filter,
  AlertCircle,
  Check,
  X,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  FileSpreadsheet,
  ChevronsUpDown
} from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { LeaveRequest, LeaveType } from './interfaces';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LeaveQuota {
  id: string;
  employee_id: string;
  leave_type_id: string;
  quota_days: number;
  taken_days: number;
  adjustment_days: number;
  employee?: {
    id: string;
    full_name: string;
  };
  leave_type?: {
    id: string;
    name: string;
    color: string;
  };
}

interface EmployeeQuotaSummary {
  employee_id: string;
  employee_name: string;
  quotas: {
    [leaveTypeId: string]: {
      id: string;
      name: string;
      color: string;
      quota: number;
      taken: number;
      remaining: number;
    }
  }
}

export const LeaveRecordsView = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string | null>(null);
  const [leaveQuotas, setLeaveQuotas] = useState<LeaveQuota[]>([]);
  const [employeeQuotaSummaries, setEmployeeQuotaSummaries] = useState<EmployeeQuotaSummary[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [employeeLeaveHistory, setEmployeeLeaveHistory] = useState<LeaveRequest[]>([]);
  const [isEmployeeDetailOpen, setIsEmployeeDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'summary' | 'requests'>('summary');
  const { toast } = useToast();
  
  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveTypes();
    fetchLeaveQuotas();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, leaveRequests, leaveTypeFilter]);

  useEffect(() => {
    if (leaveQuotas.length > 0 && leaveTypes.length > 0) {
      processLeaveQuotas();
    }
  }, [leaveQuotas, leaveTypes]);

  const processLeaveQuotas = () => {
    // Group by employee
    const employeeSummaries: { [key: string]: EmployeeQuotaSummary } = {};
    
    leaveQuotas.forEach(quota => {
      if (!quota.employee) return;
      
      const employeeId = quota.employee.id;
      const employeeName = quota.employee.full_name;
      
      if (!employeeSummaries[employeeId]) {
        employeeSummaries[employeeId] = {
          employee_id: employeeId,
          employee_name: employeeName,
          quotas: {}
        };
      }
      
      if (quota.leave_type) {
        const leaveTypeId = quota.leave_type.id;
        employeeSummaries[employeeId].quotas[leaveTypeId] = {
          id: leaveTypeId,
          name: quota.leave_type.name,
          color: quota.leave_type.color,
          quota: quota.quota_days + quota.adjustment_days,
          taken: quota.taken_days,
          remaining: (quota.quota_days + quota.adjustment_days) - quota.taken_days
        };
      }
    });
    
    // Convert to array for easier rendering
    setEmployeeQuotaSummaries(Object.values(employeeSummaries));
  };

  const fetchLeaveQuotas = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_quotas')
        .select(`
          id, 
          quota_days,
          taken_days,
          adjustment_days,
          employee_id,
          leave_type_id,
          employee:employee_id (id, full_name),
          leave_type:leave_type_id (id, name, color)
        `);
      
      if (error) throw error;
      setLeaveQuotas(data || []);
    } catch (err: any) {
      console.error('Error fetching leave quotas:', err);
      toast({
        title: 'Error',
        description: 'Failed to load leave quotas',
        variant: 'destructive',
      });
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_types')
        .select('id, name, color')
        .order('name');
        
      if (error) throw error;
      setLeaveTypes(data || []);
    } catch (err: any) {
      console.error('Error fetching leave types:', err);
      toast({
        title: 'Error',
        description: 'Failed to load leave types',
        variant: 'destructive',
      });
    }
  };
  
  const fetchLeaveRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          id, start_date, end_date, status, half_day, half_day_type, created_at,
          employees:employee_id (id, full_name),
          leave_types:leave_type_id (id, name, color)
        `)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      const formattedData = data?.map(item => ({
        id: item.id,
        employee: item.employees || { id: '', full_name: 'Unknown' },
        leave_type: item.leave_types || { id: '', name: 'Unknown', color: '#999' },
        start_date: item.start_date,
        end_date: item.end_date,
        status: item.status as 'Pending' | 'Approved' | 'Rejected',
        half_day: item.half_day || false,
        half_day_type: (item.half_day_type === 'AM' || item.half_day_type === 'PM') ? item.half_day_type : null,
        created_at: item.created_at
      })) as LeaveRequest[];
      
      setLeaveRequests(formattedData);
      setFilteredRequests(formattedData);
    } catch (err: any) {
      console.error('Error fetching leave requests:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to load leave records',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchEmployeeLeaveHistory = async (employeeId: string) => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          id, start_date, end_date, status, half_day, half_day_type, created_at,
          employees:employee_id (id, full_name),
          leave_types:leave_type_id (id, name, color)
        `)
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      
      const formattedData = data?.map(item => ({
        id: item.id,
        employee: item.employees || { id: '', full_name: 'Unknown' },
        leave_type: item.leave_types || { id: '', name: 'Unknown', color: '#999' },
        start_date: item.start_date,
        end_date: item.end_date,
        status: item.status as 'Pending' | 'Approved' | 'Rejected',
        half_day: item.half_day || false,
        half_day_type: (item.half_day_type === 'AM' || item.half_day_type === 'PM') ? item.half_day_type : null,
        created_at: item.created_at
      })) as LeaveRequest[];
      
      setEmployeeLeaveHistory(formattedData);
    } catch (err: any) {
      console.error('Error fetching employee leave history:', err);
      toast({
        title: 'Error',
        description: 'Failed to load employee leave history',
        variant: 'destructive',
      });
    }
  };
  
  const applyFilters = () => {
    let filtered = [...leaveRequests];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(request => 
        request.employee.full_name.toLowerCase().includes(term) ||
        request.leave_type.name.toLowerCase().includes(term)
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(request => request.status === statusFilter);
    }
    
    if (leaveTypeFilter) {
      filtered = filtered.filter(request => request.leave_type.id === leaveTypeFilter);
    }
    
    setFilteredRequests(filtered);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleStatusFilterChange = (status: string | null) => {
    setStatusFilter(status === 'all' ? null : status);
  };

  const handleLeaveTypeFilterChange = (typeId: string) => {
    setLeaveTypeFilter(typeId === 'all' ? null : typeId);
  };
  
  const toggleSelectRequest = (id: string) => {
    setSelectedRequests(prev => 
      prev.includes(id) ? 
      prev.filter(requestId => requestId !== id) : 
      [...prev, id]
    );
  };
  
  const toggleSelectAll = () => {
    if (selectedRequests.length === filteredRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(filteredRequests.map(req => req.id));
    }
  };
  
  const handleBulkAction = async () => {
    if (!bulkAction || selectedRequests.length === 0) return;
    
    try {
      if (bulkAction === 'approve' || bulkAction === 'reject') {
        const status = bulkAction === 'approve' ? 'Approved' : 'Rejected';
        
        const { error } = await supabase
          .from('leave_requests')
          .update({ status })
          .in('id', selectedRequests);
        
        if (error) throw error;
        
        toast({
          title: `Requests ${status}`,
          description: `Successfully ${status.toLowerCase()} ${selectedRequests.length} request(s).`,
        });
        
        fetchLeaveRequests();
        fetchLeaveQuotas(); // Refresh quotas as approval changes them
      } else if (bulkAction === 'export') {
        exportSelectedRequests();
      }
      
      setSelectedRequests([]);
      setBulkAction(null);
    } catch (err: any) {
      console.error(`Error performing bulk action ${bulkAction}:`, err);
      toast({
        title: 'Error',
        description: `Failed to ${bulkAction} requests. ${err.message}`,
        variant: 'destructive',
      });
    }
  };
  
  const exportSelectedRequests = () => {
    const selectedData = leaveRequests.filter(request => 
      selectedRequests.includes(request.id)
    );
    
    const dataToExport = selectedData.map(request => ({
      'Employee': request.employee.full_name,
      'Leave Type': request.leave_type.name,
      'Start Date': request.start_date,
      'End Date': request.end_date,
      'Status': request.status,
      'Half Day': request.half_day ? (request.half_day_type || 'Yes') : 'No',
      'Created On': new Date(request.created_at).toLocaleDateString()
    }));
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Leave Requests');
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `leave_requests_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: 'Export Complete',
      description: `Successfully exported ${selectedData.length} leave request(s).`,
    });
  };
  
  const exportAllRequests = () => {
    const dataToExport = leaveRequests.map(request => ({
      'Employee': request.employee.full_name,
      'Leave Type': request.leave_type.name,
      'Start Date': request.start_date,
      'End Date': request.end_date,
      'Status': request.status,
      'Half Day': request.half_day ? (request.half_day_type || 'Yes') : 'No',
      'Created On': new Date(request.created_at).toLocaleDateString()
    }));
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    XLSX.utils.book_append_sheet(wb, ws, 'All Leave Requests');
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `all_leave_requests_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: 'Export Complete',
      description: `Successfully exported all ${leaveRequests.length} leave request(s).`,
    });
  };
  
  const exportQuotaSummary = () => {
    const dataToExport = employeeQuotaSummaries.flatMap(summary => 
      Object.values(summary.quotas).map(quota => ({
        'Employee': summary.employee_name,
        'Leave Type': quota.name,
        'Quota': quota.quota,
        'Taken': quota.taken,
        'Remaining': quota.remaining,
        'Usage %': quota.quota > 0 ? Math.round((quota.taken / quota.quota) * 100) : 0
      }))
    );
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Leave Quotas');
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `leave_quotas_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: 'Export Complete',
      description: `Successfully exported leave quotas for ${employeeQuotaSummaries.length} employee(s).`,
    });
  };
  
  const clearSelection = () => {
    setSelectedRequests([]);
  };

  const viewEmployeeDetails = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    fetchEmployeeLeaveHistory(employeeId);
    setIsEmployeeDetailOpen(true);
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Approved':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>;
      case 'Rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      case 'Pending':
        return <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200"><Clock className="h-3 w-3" /> Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const computeLeaveDuration = (request: LeaveRequest) => {
    const start = new Date(request.start_date);
    const end = new Date(request.end_date);
    const diffInDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    if (diffInDays === 1 && request.half_day) {
      return `0.5 day (${request.half_day_type})`;
    }
    
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''}`;
  };

  const handleApproveReject = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: `Leave ${status}`,
        description: `Leave request has been ${status.toLowerCase()}`,
        duration: 3000,
      });
      
      // Refresh data
      fetchLeaveRequests();
      fetchLeaveQuotas();
      
      // If we're viewing employee details, refresh that employee's history
      if (selectedEmployee) {
        fetchEmployeeLeaveHistory(selectedEmployee);
      }
    } catch (err) {
      console.error(`Error ${status.toLowerCase()}ing leave:`, err);
      toast({
        title: "Error",
        description: `Failed to ${status.toLowerCase()} leave request`,
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Render quota summary for employees
  const renderQuotaSummary = () => {
    return (
      <div className="border rounded-md overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Leave Quotas</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : employeeQuotaSummaries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No leave quotas found.
                </TableCell>
              </TableRow>
            ) : (
              employeeQuotaSummaries.map((summary) => (
                <TableRow key={summary.employee_id}>
                  <TableCell className="font-medium">{summary.employee_name}</TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {Object.values(summary.quotas).map(quota => (
                        <div key={quota.id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: quota.color }} 
                              />
                              <span>{quota.name}</span>
                            </div>
                            <div>
                              <span className="font-medium">{quota.remaining}</span>
                              <span className="text-gray-500"> / {quota.quota}</span>
                              <span className="text-xs text-gray-500 ml-1">days remaining</span>
                            </div>
                          </div>
                          <Progress 
                            value={quota.quota > 0 ? (quota.taken / quota.quota) * 100 : 0} 
                            className="h-2" 
                            indicatorColor={quota.remaining < 0 ? "bg-red-500" : undefined}
                          />
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewEmployeeDetails(summary.employee_id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  // Render leave requests table
  const renderLeaveRequests = () => {
    return (
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0} 
                  onClick={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Date Range</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No leave records found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.id} className={selectedRequests.includes(request.id) ? 'bg-blue-50' : ''}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedRequests.includes(request.id)} 
                      onClick={() => toggleSelectRequest(request.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{request.employee.full_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: request.leave_type.color }} 
                      />
                      {request.leave_type.name}
                    </div>
                  </TableCell>
                  <TableCell>{computeLeaveDuration(request)}</TableCell>
                  <TableCell>
                    {format(new Date(request.start_date), 'dd MMM yyyy')}
                    {' - '}
                    {format(new Date(request.end_date), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => viewEmployeeDetails(request.employee.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {request.status === 'Pending' && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleApproveReject(request.id, 'Approved')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleApproveReject(request.id, 'Rejected')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'summary' | 'requests')} className="w-full">
          <TabsList>
            <TabsTrigger value="summary">Leave Quotas</TabsTrigger>
            <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === 'summary' ? (
        <>
          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={exportQuotaSummary}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Quotas
            </Button>
          </div>
          {renderQuotaSummary()}
        </>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-3 justify-between">
            <div className="flex-1 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Search by employee or leave type..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-8"
                />
                <Calendar className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              </div>
              
              <Select value={statusFilter || 'all'} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" /> 
                    {leaveTypeFilter ? 'Type: ' + leaveTypes.find(t => t.id === leaveTypeFilter)?.name : 'Filter Types'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Filter by Leave Type</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleLeaveTypeFilterChange('all')}>
                    All Types
                    {!leaveTypeFilter && <Check className="ml-2 h-4 w-4" />}
                  </DropdownMenuItem>
                  {leaveTypes.map((type) => (
                    <DropdownMenuItem key={type.id} onClick={() => handleLeaveTypeFilterChange(type.id)}>
                      <span className="flex items-center">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: type.color }} />
                        {type.name}
                      </span>
                      {leaveTypeFilter === type.id && <Check className="ml-2 h-4 w-4" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex gap-2">
              {selectedRequests.length > 0 ? (
                <>
                  <Select value={bulkAction || ''} onValueChange={setBulkAction}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Bulk Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">Approve Selected</SelectItem>
                      <SelectItem value="reject">Reject Selected</SelectItem>
                      <SelectItem value="export">Export Selected</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    disabled={!bulkAction} 
                    onClick={handleBulkAction}
                  >
                    Apply
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={clearSelection}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear ({selectedRequests.length})
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={exportAllRequests}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export All
                </Button>
              )}
            </div>
          </div>
          
          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}
          
          {renderLeaveRequests()}
        </>
      )}

      {/* Employee Detail Sheet */}
      <Sheet open={isEmployeeDetailOpen} onOpenChange={setIsEmployeeDetailOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Employee Leave Details</SheetTitle>
            <SheetDescription>
              {employeeQuotaSummaries.find(s => s.employee_id === selectedEmployee)?.employee_name || "Employee"}'s leave information
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {/* Quota Section */}
            <div>
              <h3 className="font-medium text-lg mb-3">Leave Quotas</h3>
              <div className="space-y-3">
                {selectedEmployee && 
                  employeeQuotaSummaries
                    .find(s => s.employee_id === selectedEmployee)
                    ?.quotas && 
                  Object.values(employeeQuotaSummaries
                    .find(s => s.employee_id === selectedEmployee)!
                    .quotas
                  ).map(quota => (
                    <div key={quota.id} className="p-3 border rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: quota.color }} 
                          />
                          <span className="font-medium">{quota.name}</span>
                        </div>
                        <Badge 
                          variant={quota.remaining < 0 ? "destructive" : (quota.remaining === 0 ? "outline" : "success")}
                        >
                          {quota.remaining} days left
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Total: {quota.quota} days</span>
                        <span>Used: {quota.taken} days ({quota.quota > 0 ? Math.round((quota.taken / quota.quota) * 100) : 0}%)</span>
                      </div>
                      <Progress 
                        value={quota.quota > 0 ? (quota.taken / quota.quota) * 100 : 0} 
                        className="h-2"
                        indicatorColor={quota.remaining < 0 ? "bg-red-500" : undefined}
                      />
                    </div>
                  ))
                }
              </div>
            </div>
            
            {/* History Section */}
            <div>
              <h3 className="font-medium text-lg mb-3">Leave History</h3>
              <div className="space-y-3">
                {employeeLeaveHistory.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 border rounded-md">
                    <h4 className="font-medium">No leave history</h4>
                    <p className="text-sm">This employee has no leave records.</p>
                  </div>
                ) : (
                  employeeLeaveHistory.map(leave => (
                    <div key={leave.id} className="p-3 border rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: leave.leave_type.color }} 
                            />
                            <span className="font-medium">{leave.leave_type.name}</span>
                          </div>
                          <div className="text-sm mt-1">
                            {format(new Date(leave.start_date), 'dd MMM yyyy')}
                            {' - '}
                            {format(new Date(leave.end_date), 'dd MMM yyyy')}
                          </div>
                        </div>
                        {getStatusBadge(leave.status)}
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        {computeLeaveDuration(leave)} • Requested on {format(new Date(leave.created_at), 'dd MMM yyyy')}
                      </div>
                      {leave.status === 'Pending' && (
                        <div className="mt-3 flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleApproveReject(leave.id, 'Rejected')}
                          >
                            Reject
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleApproveReject(leave.id, 'Approved')}
                          >
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
