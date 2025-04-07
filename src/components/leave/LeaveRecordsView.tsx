
import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Eye, MoreHorizontal, FileText, AlertCircle, Download, History } from 'lucide-react';
import { PremiumCard, CardContent } from '@/components/ui-custom/Card';
import { Button } from '@/components/ui-custom/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Employee {
  id: string;
  full_name: string;
  email: string;
}

interface LeaveQuota {
  id: string;
  leave_type_id: string;
  leave_type_name?: string;
  quota_days: number;
  taken_days: number;
  adjustment_days: number;
  reset_date: Date;
  color?: string;
}

export const LeaveRecordsView = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveQuotas, setLeaveQuotas] = useState<{ [employeeId: string]: LeaveQuota[] }>({});
  const [leaveTypes, setLeaveTypes] = useState<{ [id: string]: { name: string, color: string } }>({});
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState<{ employeeId: string, leaveTypeId: string, field: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadEmployeesAndQuotas();
  }, []);

  const loadEmployeesAndQuotas = async () => {
    setIsLoading(true);
    try {
      // Fetch all employees from Supabase
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, full_name, email')
        .order('full_name');
      
      if (employeesError) throw employeesError;
      
      // Fetch all leave types
      const { data: leaveTypesData, error: leaveTypesError } = await supabase
        .from('leave_types')
        .select('id, name, color');
        
      if (leaveTypesError) throw leaveTypesError;
      
      // Create a map of leave types for easier reference
      const leaveTypesMap = leaveTypesData.reduce((acc, type) => {
        acc[type.id] = { name: type.name, color: type.color };
        return acc;
      }, {});
      
      setLeaveTypes(leaveTypesMap);
      
      // Fetch all leave quotas
      const { data: quotasData, error: quotasError } = await supabase
        .from('leave_quotas')
        .select('*');
        
      if (quotasError) throw quotasError;
      
      // Organize quotas by employee
      const quotasByEmployee = {};
      
      // Ensure each employee has at least the default leave types
      for (const employee of employeesData) {
        quotasByEmployee[employee.id] = [];
        
        // Add default quotas for main leave types if not exists
        for (const leaveType of leaveTypesData) {
          // Find if quota exists
          const existingQuota = quotasData.find(q => 
            q.employee_id === employee.id && q.leave_type_id === leaveType.id
          );
          
          if (existingQuota) {
            quotasByEmployee[employee.id].push({
              ...existingQuota,
              leave_type_name: leaveType.name,
              color: leaveType.color,
              reset_date: new Date(existingQuota.reset_date)
            });
          } else {
            // Create default quota
            const defaultQuota = {
              id: `temp-${employee.id}-${leaveType.id}`,
              employee_id: employee.id,
              leave_type_id: leaveType.id,
              leave_type_name: leaveType.name,
              quota_days: leaveType.name === 'Annual Leave' ? 14 : 
                         leaveType.name === 'Sick Leave' ? 14 : 
                         leaveType.name === 'Childcare Leave' ? 6 : 0,
              taken_days: 0,
              adjustment_days: 0,
              reset_date: new Date(new Date().getFullYear(), 0, 1), // Jan 1st of current year
              color: leaveType.color
            };
            
            quotasByEmployee[employee.id].push(defaultQuota);
            
            // Save this default quota to database
            await supabase
              .from('leave_quotas')
              .insert({
                employee_id: employee.id,
                leave_type_id: leaveType.id,
                quota_days: defaultQuota.quota_days,
                taken_days: 0,
                adjustment_days: 0,
                reset_date: defaultQuota.reset_date.toISOString().split('T')[0]
              });
          }
        }
      }
      
      setEmployees(employeesData);
      setLeaveQuotas(quotasByEmployee);
      
    } catch (error) {
      console.error('Error loading employees and leave quotas:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leave records',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(employee => employee.id));
    }
  };

  const handleSaveEdit = async (employeeId: string, leaveTypeId: string, field: string, value: number) => {
    try {
      // Find the quota object
      const quotas = [...leaveQuotas[employeeId]];
      const quotaIndex = quotas.findIndex(q => q.leave_type_id === leaveTypeId);
      
      if (quotaIndex === -1) {
        throw new Error('Leave quota not found');
      }
      
      // Update the quota
      const updatedQuota = { ...quotas[quotaIndex] };
      if (field === 'quota_days') {
        updatedQuota.quota_days = value;
      } else if (field === 'adjustment_days') {
        updatedQuota.adjustment_days = value;
      }
      
      // Update in Supabase
      const { error } = await supabase
        .from('leave_quotas')
        .update({ [field]: value })
        .eq('employee_id', employeeId)
        .eq('leave_type_id', leaveTypeId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      quotas[quotaIndex] = updatedQuota;
      setLeaveQuotas(prev => ({
        ...prev,
        [employeeId]: quotas
      }));
      
      setIsEditing(null);
      
      toast({
        title: 'Updated',
        description: 'Leave quota has been updated',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating leave quota:', error);
      toast({
        title: 'Error',
        description: 'Failed to update leave quota',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (employeeIds: string[]) => {
    try {
      // In a real implementation, we would handle deletion properly
      // For now, just remove from local state and show toast
      toast({
        title: 'Not Implemented',
        description: 'Deletion functionality will be added soon',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete selected records',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee => 
    employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRemainingDays = (quota: LeaveQuota) => {
    return quota.quota_days - quota.taken_days + quota.adjustment_days;
  };

  // For each employee, find their Annual Leave quota
  const getAnnualLeave = (employeeId: string) => {
    if (!leaveQuotas[employeeId]) return null;
    
    return leaveQuotas[employeeId].find(quota => {
      const leaveType = leaveTypes[quota.leave_type_id];
      return leaveType && leaveType.name === 'Annual Leave';
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-72">
          <Input
            type="text"
            placeholder="Search employees..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {selectedEmployees.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(selectedEmployees)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedEmployees([])}
            >
              Clear Selection
            </Button>
          </div>
        )}
      </div>

      <PremiumCard>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0} 
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Annual Leave Quota</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Last Reset</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No employees found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map(employee => {
                      const annualLeave = getAnnualLeave(employee.id);
                      const isExpanded = expandedEmployee === employee.id;
                      
                      return (
                        <React.Fragment key={employee.id}>
                          <TableRow 
                            data-state={selectedEmployees.includes(employee.id) ? 'selected' : undefined}
                            className={`cursor-pointer ${isExpanded ? 'bg-gray-50' : ''}`}
                            onClick={() => setExpandedEmployee(isExpanded ? null : employee.id)}
                          >
                            <TableCell onClick={(e) => { e.stopPropagation(); }}>
                              <Checkbox 
                                checked={selectedEmployees.includes(employee.id)}
                                onCheckedChange={() => handleSelectEmployee(employee.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="h-9 w-9 rounded-full bg-hrflow-blue/10 flex items-center justify-center text-hrflow-blue font-medium mr-2">
                                  {employee.full_name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <div className="font-medium">{employee.full_name}</div>
                                  <div className="text-xs text-gray-500">{employee.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {annualLeave && (
                                <div 
                                  className="cursor-pointer hover:text-blue-500"
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setIsEditing({
                                      employeeId: employee.id,
                                      leaveTypeId: annualLeave.leave_type_id,
                                      field: 'quota_days'
                                    });
                                  }}
                                >
                                  {isEditing && 
                                   isEditing.employeeId === employee.id && 
                                   isEditing.leaveTypeId === annualLeave.leave_type_id && 
                                   isEditing.field === 'quota_days' ? (
                                    <Input 
                                      type="number"
                                      className="w-20 h-7 text-right"
                                      defaultValue={annualLeave.quota_days}
                                      min={0}
                                      autoFocus
                                      onClick={e => e.stopPropagation()}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSaveEdit(
                                            employee.id, 
                                            annualLeave.leave_type_id, 
                                            'quota_days', 
                                            parseInt((e.target as HTMLInputElement).value)
                                          );
                                        }
                                        e.stopPropagation();
                                      }}
                                      onBlur={(e) => handleSaveEdit(
                                        employee.id, 
                                        annualLeave.leave_type_id, 
                                        'quota_days', 
                                        parseInt(e.target.value)
                                      )}
                                    />
                                  ) : (
                                    annualLeave.quota_days
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {annualLeave?.taken_days || 0}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${
                              annualLeave ? (
                                getRemainingDays(annualLeave) < 0 ? 'text-red-600' : 
                                getRemainingDays(annualLeave) === 0 ? 'text-orange-600' : 
                                'text-green-600'
                              ) : ''
                            }`}>
                              {annualLeave ? getRemainingDays(annualLeave) : 0}
                            </TableCell>
                            <TableCell className="text-right">
                              {annualLeave ? formatDate(annualLeave.reset_date) : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => setExpandedEmployee(isExpanded ? null : employee.id)}>
                                      <Eye className="h-4 w-4 mr-2" /> View All Leave Types
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <History className="h-4 w-4 mr-2" /> View Leave History
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          {/* Expanded view showing all leave types */}
                          {isExpanded && leaveQuotas[employee.id] && (
                            <TableRow className="bg-gray-50">
                              <TableCell colSpan={7} className="py-0">
                                <div className="py-4 px-4">
                                  <h4 className="text-sm font-medium mb-2">All Leave Types</h4>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Leave Type</TableHead>
                                        <TableHead className="text-right">Quota</TableHead>
                                        <TableHead className="text-right">Taken</TableHead>
                                        <TableHead className="text-right">Adjustments</TableHead>
                                        <TableHead className="text-right">Remaining</TableHead>
                                        <TableHead className="text-right">Reset Date</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {leaveQuotas[employee.id].map((quota) => (
                                        <TableRow key={quota.leave_type_id}>
                                          <TableCell>
                                            <Badge style={{backgroundColor: quota.color, color: 'white'}}>
                                              {leaveTypes[quota.leave_type_id]?.name || 'Unknown Type'}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <div 
                                              className="cursor-pointer hover:text-blue-500"
                                              onClick={() => setIsEditing({
                                                employeeId: employee.id,
                                                leaveTypeId: quota.leave_type_id,
                                                field: 'quota_days'
                                              })}
                                            >
                                              {isEditing && 
                                               isEditing.employeeId === employee.id && 
                                               isEditing.leaveTypeId === quota.leave_type_id && 
                                               isEditing.field === 'quota_days' ? (
                                                <Input 
                                                  type="number"
                                                  className="w-20 h-7 text-right"
                                                  defaultValue={quota.quota_days}
                                                  min={0}
                                                  autoFocus
                                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(
                                                    employee.id, 
                                                    quota.leave_type_id, 
                                                    'quota_days', 
                                                    parseInt((e.target as HTMLInputElement).value)
                                                  )}
                                                  onBlur={(e) => handleSaveEdit(
                                                    employee.id, 
                                                    quota.leave_type_id, 
                                                    'quota_days', 
                                                    parseInt(e.target.value)
                                                  )}
                                                />
                                              ) : (
                                                quota.quota_days
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {quota.taken_days}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <div 
                                              className={`cursor-pointer hover:text-blue-500 ${
                                                quota.adjustment_days !== 0 ? (
                                                  quota.adjustment_days > 0 ? 'text-green-600' : 'text-red-600'
                                                ) : ''
                                              }`}
                                              onClick={() => setIsEditing({
                                                employeeId: employee.id,
                                                leaveTypeId: quota.leave_type_id,
                                                field: 'adjustment_days'
                                              })}
                                            >
                                              {isEditing && 
                                               isEditing.employeeId === employee.id && 
                                               isEditing.leaveTypeId === quota.leave_type_id && 
                                               isEditing.field === 'adjustment_days' ? (
                                                <Input 
                                                  type="number"
                                                  className="w-20 h-7 text-right"
                                                  defaultValue={quota.adjustment_days}
                                                  autoFocus
                                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(
                                                    employee.id, 
                                                    quota.leave_type_id, 
                                                    'adjustment_days', 
                                                    parseInt((e.target as HTMLInputElement).value)
                                                  )}
                                                  onBlur={(e) => handleSaveEdit(
                                                    employee.id, 
                                                    quota.leave_type_id, 
                                                    'adjustment_days', 
                                                    parseInt(e.target.value)
                                                  )}
                                                />
                                              ) : (
                                                quota.adjustment_days > 0 ? `+${quota.adjustment_days}` : quota.adjustment_days
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell className={`text-right font-medium ${
                                            getRemainingDays(quota) < 0 ? 'text-red-600' : 
                                            getRemainingDays(quota) === 0 ? 'text-orange-600' : 
                                            'text-green-600'
                                          }`}>
                                            {getRemainingDays(quota)}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {formatDate(quota.reset_date)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </PremiumCard>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="mt-4" variant="outline">
            <Download className="h-4 w-4 mr-2" /> Export Leave Data
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Leave Records</DialogTitle>
            <DialogDescription>
              Download employee leave data in your preferred format.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Button variant="outline" className="flex flex-col items-center justify-center h-24">
              <FileText className="h-8 w-8 mb-2" />
              Export as CSV
            </Button>
            <Button variant="outline" className="flex flex-col items-center justify-center h-24">
              <FileText className="h-8 w-8 mb-2" />
              Export as Excel
            </Button>
          </div>
          <div className="mt-4 flex items-center p-3 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              The export will include all leave records, including any filters currently applied.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
