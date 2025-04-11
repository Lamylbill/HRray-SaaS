import React, { useState, useEffect } from 'react';
import {
  Search, PlusCircle, Download, AlertCircle,
  ListFilter, Grid, Edit, Trash, Check, X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui-custom/Button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnimatedSection } from '@/components/ui-custom/AnimatedSection';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent
} from '@/components/ui/dialog';
import { exportEmployeesToExcel } from '@/utils/excelUtils';
import { AddEmployeeForm } from '@/components/employees/AddEmployeeForm';
import { EmployeeDetailsDialog } from '@/components/employees/EmployeeDetailsDialog';
import { Employee } from '@/types/employee';
import { EmployeeCard } from '@/components/employees/EmployeeCard';
import { ImportEmployeesDialog } from '@/components/employees/ImportEmployeesDialog';
import { AdvancedFilterDropdown } from '@/components/employees/AdvancedFilterDropdown';
import { standardizeEmployee } from '@/utils/employeeFieldUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const StatusBadge = ({ status }: { status: string | null | undefined }) => {
  if (!status) return <Badge variant="outline">Unknown</Badge>;

  switch (status) {
    case 'Active':
      return <Badge variant="success" className="font-medium">Active</Badge>;
    case 'On Leave':
      return <Badge variant="warning" className="font-medium">On Leave</Badge>;
    case 'Resigned':
      return <Badge variant="destructive" className="font-medium">Resigned</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const EmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        setError('You must be logged in to view employees');
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('jwt_token');
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .order('full_name', { ascending: true })
        .auth(token);

      if (error) throw error;

      const rawEmployees = data as unknown as Employee[];
      
      const standardizedEmployees = rawEmployees.map(emp => standardizeEmployee(emp)) as Employee[];
      
      setEmployees(standardizedEmployees);
      setFilteredEmployees(standardizedEmployees);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [user]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredEmployees(employees);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      const searchResults = employees.filter(employee =>
        employee.full_name?.toLowerCase().includes(lowerSearch) ||
        employee.email?.toLowerCase().includes(lowerSearch) ||
        employee.job_title?.toLowerCase().includes(lowerSearch)
      );
      setFilteredEmployees(searchResults);
    }
  }, [searchTerm, employees]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const exportEmployees = () => {
    if (employees.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no employees to export.",
        variant: "destructive",
      });
      return;
    }

    exportEmployeesToExcel(employees);
    toast({
      title: "Export Successful",
      description: "Employees exported successfully.",
      duration: 3000,
    });
  };

  const handleFilterChange = (results: Employee[]) => {
    setFilteredEmployees(results);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsAddEmployeeOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDetailsOpen(true);
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteConfirmText('');
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete || deleteConfirmText !== 'DELETE') return;
    
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeToDelete.id);

      if (error) throw error;

      toast({
        title: "Employee Deleted",
        description: `${employeeToDelete.full_name} has been removed.`,
      });

      fetchEmployees();
      setIsDeleteDialogOpen(false);
      setEmployeeToDelete(null);
      setDeleteConfirmText('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete employee",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (employee: Employee) => {
    if (selectedEmployees.length > 0) return;
    
    setSelectedEmployee(employee);
    setIsDetailsOpen(true);
  };

  const toggleSelectEmployee = (employeeId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    } else {
      setSelectedEmployees(prev => [...prev, employeeId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(emp => emp.id));
    }
  };

  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  const showBulkDeleteDialog = () => {
    setDeleteConfirmText('');
    setIsBulkDeleteDialogOpen(true);
  };

  const deleteSelectedEmployees = async () => {
    if (selectedEmployees.length === 0 || deleteConfirmText !== 'DELETE') return;
    
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .in('id', selectedEmployees);

      if (error) throw error;

      toast({
        title: "Employees Deleted",
        description: `${selectedEmployees.length} employees have been removed.`,
      });

      fetchEmployees();
      setSelectedEmployees([]);
      setIsBulkDeleteDialogOpen(false);
      setDeleteConfirmText('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete employees",
        variant: "destructive"
      });
    }
  };

  const isSelected = (employeeId: string) => selectedEmployees.includes(employeeId);
  const allSelected = filteredEmployees.length > 0 && selectedEmployees.length === filteredEmployees.length;

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your organization's employees</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
          {selectedEmployees.length > 0 ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={showBulkDeleteDialog}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Selected ({selectedEmployees.length})
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearSelection}
              >
                <X className="mr-2 h-4 w-4" />
                Clear Selection
              </Button>
            </>
          ) : (
            <>
              <ImportEmployeesDialog onImportSuccess={fetchEmployees} />
              <Button variant="outline" size="sm" onClick={exportEmployees}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="primary" size="sm" onClick={handleAddEmployee}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative w-full sm:w-auto sm:min-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search employees..."
            className="pl-10"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() =>
            setViewMode(prev => prev === 'list' ? 'card' : 'list')
          }>
            {viewMode === 'list' ? <><Grid className="h-4 w-4 mr-2" /> Card View</> : <><ListFilter className="h-4 w-4 mr-2" /> List View</>}
          </Button>

          <AdvancedFilterDropdown
            employees={employees}
            onFiltersChange={handleFilterChange}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
          <AlertCircle className="inline-block mr-2" />
          {error}
        </div>
      )}

      {viewMode === 'list' ? (
        <div className="border rounded-md overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox 
                    checked={allSelected} 
                    onClick={toggleSelectAll}
                    className={allSelected ? "data-[state=checked]:bg-hrflow-blue" : ""}
                  />
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Employment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map(emp => (
                <TableRow 
                  key={emp.id} 
                  onClick={() => handleViewDetails(emp)} 
                  className={`cursor-pointer ${isSelected(emp.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
                    <Checkbox 
                      checked={isSelected(emp.id)} 
                      onClick={(e) => toggleSelectEmployee(emp.id, e)}
                      className={isSelected(emp.id) ? "data-[state=checked]:bg-hrflow-blue" : ""}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar 
                        className={`h-10 w-10 border cursor-pointer ${isSelected(emp.id) ? 'ring-2 ring-hrflow-blue' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectEmployee(emp.id);
                        }}
                      >
                        <AvatarImage src={emp.profile_photo || emp.profile_picture || undefined} />
                        <AvatarFallback className={isSelected(emp.id) ? "bg-hrflow-blue text-white" : "bg-gray-200"}>
                          {isSelected(emp.id) ? <Check className="h-5 w-5" /> : emp.full_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{emp.full_name}</div>
                        <div className="text-sm text-muted-foreground">{emp.job_title || 'No Job Title'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{emp.department || 'N/A'}</TableCell>
                  <TableCell>{emp.email}<br /><span className="text-sm text-muted-foreground">{emp.contact_number || emp.phone_number || 'N/A'}</span></TableCell>
                  <TableCell>{emp.employment_type || 'N/A'}<br /><span className="text-sm text-muted-foreground">{formatDate(emp.date_of_hire)}</span></TableCell>
                  <TableCell><StatusBadge status={emp.employment_status} /></TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      handleEditEmployee(emp);
                    }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEmployee(emp);
                    }}>
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map(emp => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              onViewDetails={handleViewDetails}
              onEdit={handleEditEmployee}
              onDelete={handleDeleteEmployee}
            />
          ))}
        </div>
      )}

      <Dialog
        open={isDetailsOpen || isAddEmployeeOpen}
        onOpenChange={(open) => {
          setIsDetailsOpen(open);
          setIsAddEmployeeOpen(open);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          {selectedEmployee ? (
            <EmployeeDetailsDialog
              employee={selectedEmployee}
              onEdit={() => {
                fetchEmployees();
                setIsDetailsOpen(false);
              }}
              onDelete={() => {
                fetchEmployees();
                setIsDetailsOpen(false);
              }}
            />
          ) : (
            <AddEmployeeForm
              onSuccess={() => {
                fetchEmployees();
                setIsAddEmployeeOpen(false);
              }}
              onCancel={() => {
                setIsAddEmployeeOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {employeeToDelete?.full_name}'s 
              record and all associated data.
              <div className="mt-4">
                <p className="font-medium mb-2">Type DELETE to confirm:</p>
                <Input 
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  className="mt-1"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteConfirmText('');
              setEmployeeToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteEmployee}
              disabled={deleteConfirmText !== 'DELETE'}
              className={`${deleteConfirmText !== 'DELETE' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Delete Employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete multiple employees?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedEmployees.length} employee 
              {selectedEmployees.length > 1 ? 's' : ''} and all associated data.
              <div className="mt-4">
                <p className="font-medium mb-2">Type DELETE to confirm:</p>
                <Input 
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  className="mt-1"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteConfirmText('');
              setIsBulkDeleteDialogOpen(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteSelectedEmployees}
              disabled={deleteConfirmText !== 'DELETE'}
              className={`${deleteConfirmText !== 'DELETE' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Delete Employees
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmployeesPage;
