import React, { useState, useEffect } from 'react';
import {
  Search, PlusCircle, Download, AlertCircle,
  ListFilter, Grid, Edit, Trash, CheckSquare
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui-custom/Button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Checkbox } from '@/components/ui/checkbox';
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
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [isMultiDeleteDialogOpen, setIsMultiDeleteDialogOpen] = useState(false);
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

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .order('full_name', { ascending: true });

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
    setSelectedEmployee(employee);
    setIsDetailsOpen(true);
  };

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedEmployeeIds([]);
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployeeIds(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId) 
        : [...prev, employeeId]
    );
  };

  const handleMultiDeleteConfirm = () => {
    if (selectedEmployeeIds.length > 0) {
      setDeleteConfirmText('');
      setIsMultiDeleteDialogOpen(true);
    }
  };

  const confirmMultiDelete = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .in('id', selectedEmployeeIds);

      if (error) throw error;

      toast({
        title: "Employees Deleted",
        description: `${selectedEmployeeIds.length} employees have been removed.`,
      });

      fetchEmployees();
      setIsMultiDeleteDialogOpen(false);
      setSelectedEmployeeIds([]);
      setDeleteConfirmText('');
      
      setIsMultiSelectMode(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete employees",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your organization's employees</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
          <ImportEmployeesDialog onImportSuccess={fetchEmployees} />
          <Button variant="outline" size="sm" onClick={exportEmployees}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="primary" size="sm" onClick={handleAddEmployee}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleMultiSelectMode}
            className={isMultiSelectMode ? "bg-hrflow-blue text-white hover:bg-hrflow-blue/90" : ""}
          >
            <CheckSquare className="h-4 w-4 mr-2" /> 
            {isMultiSelectMode ? "Exit Selection" : "Select Multiple"}
          </Button>
          
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

      {isMultiSelectMode && (
        <div className="mb-4 p-3 bg-gray-50 border rounded-md flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">{selectedEmployeeIds.length}</span> employees selected
          </div>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleMultiDeleteConfirm}
          >
            <Trash className="h-4 w-4 mr-2" /> Delete Selected
          </Button>
        </div>
      )}

      {viewMode === 'list' ? (
        <div className="border rounded-md overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                {isMultiSelectMode && <TableHead className="w-[40px]"></TableHead>}
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
                  onClick={isMultiSelectMode ? () => toggleEmployeeSelection(emp.id) : () => handleViewDetails(emp)} 
                  className={`cursor-pointer hover:bg-gray-50 ${isMultiSelectMode && selectedEmployeeIds.includes(emp.id) ? 'bg-blue-50' : ''}`}
                >
                  {isMultiSelectMode && (
                    <TableCell className="w-[40px]" onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedEmployeeIds.includes(emp.id)} 
                        onCheckedChange={() => toggleEmployeeSelection(emp.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={emp.profile_photo || emp.profile_picture || undefined} />
                        <AvatarFallback className="bg-hrflow-blue text-white">
                          {emp.full_name?.[0] || '?'}
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
              isMultiSelectMode={isMultiSelectMode}
              isSelected={selectedEmployeeIds.includes(emp.id)}
              onToggleSelect={() => toggleEmployeeSelection(emp.id)}
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

      <AlertDialog open={isMultiDeleteDialogOpen} onOpenChange={setIsMultiDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Employees</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. You are about to delete {selectedEmployeeIds.length} employee records 
              and all their associated data.
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
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMultiDelete}
              disabled={deleteConfirmText !== 'DELETE'}
              className={`${deleteConfirmText !== 'DELETE' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Delete {selectedEmployeeIds.length} Employees
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmployeesPage;
