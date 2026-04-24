import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useCallback & useMemo
import { Link, useNavigate } from 'react-router-dom'; // Removed useLocation as it's not used
import {
  Search, PlusCircle, Download, AlertCircle,
  ListFilter, Grid, Edit, Trash, Check, X as CloseIconLucide // Renamed X
} from 'lucide-react';
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
import { getAuthorizedClient } from '@/integrations/supabase/client';
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
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner'; // Added for consistency

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
  const navigate = useNavigate(); // For dialog navigation if needed

  const fetchEmployees = useCallback(async () => { // Wrapped in useCallback
    setIsLoading(true);
    setError(null);
    if (!user) {
      setError('You must be logged in to view employees');
      setIsLoading(false);
      setEmployees([]); // Ensure employees is an empty array
      return;
    }

    try {
      const authorizedClient = getAuthorizedClient();
      const { data, error: fetchErr } = await authorizedClient
        .from('employees_with_documents') // Assuming this is your intended source
        .select('*')
        .eq('user_id', user.id)
        .order('full_name', { ascending: true });

      if (fetchErr) throw fetchErr;

      const rawEmployees = data || []; // Ensure rawEmployees is an array

      // --- MODIFICATION: Deduplication Step ---
      const uniqueEmployeesMap = new Map<string, Employee>();
      if (Array.isArray(rawEmployees)) {
        rawEmployees.forEach(rawEmp => {
          if (rawEmp && rawEmp.id && !uniqueEmployeesMap.has(rawEmp.id)) {
            // Ensure standardizeEmployee returns the correct Employee type
            uniqueEmployeesMap.set(rawEmp.id, standardizeEmployee(rawEmp as any)); 
          }
        });
      }
      const finalUniqueEmployees = Array.from(uniqueEmployeesMap.values());
      // --- End Modification ---
      
      setEmployees(finalUniqueEmployees); // Set the deduplicated list
      // setFilteredEmployees(finalUniqueEmployees); // This will be handled by the useEffect below
    } catch (err: any) {
      console.error("Error fetching employees:", err); // Keep important error logs
      setError(err.message || 'An error occurred.');
      setEmployees([]); // Set to empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [user]); // Removed toast, standardizeEmployee from deps unless they change referentially

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]); // fetchEmployees is memoized

  useEffect(() => {
    let results = [...employees]; // Use the unique 'employees' state
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      results = results.filter(employee =>
        employee.full_name?.toLowerCase().includes(lowerSearch) ||
        employee.email?.toLowerCase().includes(lowerSearch) ||
        employee.job_title?.toLowerCase().includes(lowerSearch)
      );
    }
    setFilteredEmployees(results);
  }, [searchTerm, employees]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const exportEmployees = useCallback(async () => {
    if (filteredEmployees.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no employees matching current filters to export.",
        variant: "destructive",
      });
      return;
    }
    await exportEmployeesToExcel(filteredEmployees);
    toast({
      title: "Export Successful",
      description: "Employees exported successfully.",
      duration: 3000,
    });
  }, [filteredEmployees, toast]); // Dependencies added

  const handleFilterChange = useCallback((results: Employee[]) => {
    setFilteredEmployees(results);
  }, []);

  const formatDate = useCallback((dateString?: string | null) => { // Wrapped in useCallback
    if (!dateString) return 'N/A';
    try {
      // Using 'en-SG' for a more common display, adjust if needed
      return new Date(dateString).toLocaleDateString('en-SG', {year: 'numeric', month: 'short', day: 'numeric'});
    } catch {
      return 'Invalid date';
    }
  }, []);

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

  const confirmDeleteEmployee = useCallback(async () => { // Wrapped in useCallback
    if (!employeeToDelete || deleteConfirmText !== 'DELETE') return;
    try {
      const authorizedClient = getAuthorizedClient();
      // IMPORTANT: Ensure you are deleting from the correct table ('employees' usually, not the view)
      const { error } = await authorizedClient
        .from('employees') // Changed from 'employees_with_documents'
        .delete()
        .eq('id', employeeToDelete.id);

      if (error) throw error;
      toast({ title: "Employee Deleted", description: `${employeeToDelete.full_name} has been removed.`});
      fetchEmployees(); // Refresh list
      setIsDeleteDialogOpen(false);
      setEmployeeToDelete(null);
      setDeleteConfirmText('');
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete employee", variant: "destructive" });
    }
  }, [employeeToDelete, deleteConfirmText, toast, fetchEmployees]); // Dependencies added

  const handleViewDetails = (employee: Employee) => {
    if (selectedEmployees.length > 0) return; // Prevent opening details if in bulk select mode
    setSelectedEmployee(employee);
    setIsDetailsOpen(true);
  };

  const toggleSelectEmployee = useCallback((employeeId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setSelectedEmployees(prev =>
      prev.includes(employeeId) ? prev.filter(id => id !== employeeId) : [...prev, employeeId]
    );
  }, []); // No external dependencies for setSelectedEmployees if only using prev

  const toggleSelectAll = useCallback(() => {
    // Toggle based on filteredEmployees
    setSelectedEmployees(prev =>
      prev.length === filteredEmployees.length ? [] : filteredEmployees.map(emp => emp.id)
    );
  }, [filteredEmployees]); // Dependency on filteredEmployees

  const clearSelection = useCallback(() => {
    setSelectedEmployees([]);
  }, []);

  const showBulkDeleteDialog = () => {
    setDeleteConfirmText('');
    setIsBulkDeleteDialogOpen(true);
  };

  const deleteSelectedEmployees = useCallback(async () => {
    if (selectedEmployees.length === 0 || deleteConfirmText !== 'DELETE') return;
    try {
      const authorizedClient = getAuthorizedClient();
      // IMPORTANT: Ensure you are deleting from the correct table ('employees' usually)
      const { error } = await authorizedClient
        .from('employees') // Changed from 'employees_with_documents'
        .delete()
        .in('id', selectedEmployees);

      if (error) throw error;
      toast({ title: "Employees Deleted", description: `${selectedEmployees.length} employees have been removed.`});
      fetchEmployees(); // Refresh list
      setSelectedEmployees([]);
      setIsBulkDeleteDialogOpen(false);
      setDeleteConfirmText('');
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete selected employees", variant: "destructive" });
    }
  }, [selectedEmployees, deleteConfirmText, toast, fetchEmployees]); // Dependencies added

  const isSelected = useCallback((employeeId: string) => selectedEmployees.includes(employeeId), [selectedEmployees]);
  const allSelected = useMemo(() => filteredEmployees.length > 0 && selectedEmployees.length === filteredEmployees.length, [filteredEmployees, selectedEmployees]);

  // Initial loading state for the whole page
  if (isLoading && employees.length === 0 && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" /> <span className="ml-2">Loading Employees...</span>
      </div>
    );
  }

  return (
    <AnimatedSection className="h-full flex flex-col">
      <div className="min-h-screen bg-gray-50 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-full">
          {/* Header and Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 pt-6">
            <div><h1 className="text-2xl font-bold text-gray-900">Employees</h1><p className="mt-1 text-sm text-gray-600">Manage your organization's employees</p></div>
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
              {selectedEmployees.length > 0 ? ( <><Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 transition" onClick={showBulkDeleteDialog}><Trash className="mr-2 h-4 w-4" /> Delete Selected ({selectedEmployees.length})</Button><Button variant="outline" size="sm" className='transition' onClick={clearSelection}><CloseIconLucide className="mr-2 h-4 w-4" /> Clear Selection</Button></> )
               : ( <><ImportEmployeesDialog onImportSuccess={fetchEmployees} /><Button variant="outline" size="sm" className='transition' onClick={exportEmployees}><Download className="mr-2 h-4 w-4" />Export</Button><Button variant="primary" size="sm" className='transition' onClick={handleAddEmployee}><PlusCircle className="mr-2 h-4 w-4" />Add Employee</Button></> )}
            </div>
          </div>
          {/* Search and View Toggle */}
          <div className="mb-6 flex flex-wrap gap-3 items-center justify-between">
            <div className="relative w-full sm:w-auto sm:min-w-[300px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" /><Input placeholder="Search employees..." className="pl-10" value={searchTerm} onChange={handleSearchChange}/></div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className='transition' onClick={() => setViewMode(prev => prev === 'list' ? 'card' : 'list')}>{viewMode === 'list' ? <><Grid className="h-4 w-4 mr-2" /> Card View</> : <><ListFilter className="h-4 w-4 mr-2" /> List View</>}</Button>
              <AdvancedFilterDropdown employees={employees} onFiltersChange={handleFilterChange}/>
            </div>
          </div>
          {error && !isLoading && ( <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md"><AlertCircle className="inline-block mr-2" />{error}</div> )}

          {/* Main Content: Table or Cards */}
          {viewMode === 'list' ? (
            <div className="border rounded-md overflow-hidden bg-white shadow-sm">
              {/* Compacted JSX for Table */}
              <Table><TableHeader><TableRow>
                    <TableHead className="w-10 p-2"><Checkbox checked={allSelected} onClick={toggleSelectAll} className={allSelected ? "data-[state=checked]:bg-hrflow-blue" : ""} /></TableHead>
                    <TableHead className="p-2">Employee</TableHead><TableHead className="p-2">Department</TableHead><TableHead className="p-2">Contact</TableHead><TableHead className="p-2">Employment</TableHead><TableHead className="p-2">Status</TableHead><TableHead className="text-right p-2">Actions</TableHead>
              </TableRow></TableHeader><TableBody>
                  {isLoading && filteredEmployees.length === 0 && employees.length > 0 ? ( <TableRow><TableCell colSpan={7} className="h-24 text-center p-2"><LoadingSpinner/> Applying filters...</TableCell></TableRow> )
                   : !isLoading && filteredEmployees.length === 0 ? ( <TableRow><TableCell colSpan={7} className="h-24 text-center p-2">No employees found{searchTerm || selectedEmployees.length > 0 ? ' matching your criteria' : ''}.</TableCell></TableRow> )
                   : ( filteredEmployees.map(emp => (
                    <TableRow key={emp.id} onClick={() => handleViewDetails(emp)} className={`cursor-pointer ${isSelected(emp.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <TableCell onClick={(e) => e.stopPropagation()} className="w-10 p-2"><Checkbox checked={isSelected(emp.id)} onClick={(e) => toggleSelectEmployee(emp.id, e)} className={isSelected(emp.id) ? "data-[state=checked]:bg-hrflow-blue" : ""}/></TableCell>
                      <TableCell className="p-2"><div className="flex items-center gap-2"><Avatar className={`h-10 w-10 border cursor-pointer ${isSelected(emp.id) ? 'ring-2 ring-hrflow-blue' : ''}`} onClick={(e) => {e.stopPropagation(); toggleSelectEmployee(emp.id);}}><AvatarImage src={emp.profile_photo || emp.profile_picture || undefined} /><AvatarFallback className={isSelected(emp.id) ? "bg-hrflow-blue text-white" : "bg-gray-200"}>{isSelected(emp.id) ? <Check className="h-5 w-5" /> : emp.full_name?.[0]?.toUpperCase() || '?'}</AvatarFallback></Avatar><div><div className="font-medium">{emp.full_name}</div><div className="text-sm text-muted-foreground">{emp.job_title || 'No Job Title'}</div></div></div></TableCell>
                      <TableCell className="p-2">{emp.department || 'N/A'}</TableCell>
                      <TableCell className="p-2">{emp.email}<br /><span className="text-sm text-muted-foreground">{emp.contact_number || emp.phone_number || 'N/A'}</span></TableCell>
                      <TableCell className="p-2">{emp.employment_type || 'N/A'}<br /><span className="text-sm text-muted-foreground">{formatDate(emp.date_of_hire)}</span></TableCell>
                      <TableCell className="p-2"><StatusBadge status={emp.employment_status} /></TableCell>
                      <TableCell className="text-right p-2" onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="sm" className='transition' onClick={(e) => { e.stopPropagation(); handleEditEmployee(emp); }}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="sm" className='transition' onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp); }}><Trash className="h-4 w-4 text-red-500" /></Button></TableCell>
                    </TableRow>
                  )))}
              </TableBody></Table>
            </div>
          ) : ( /* Card View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {isLoading && filteredEmployees.length === 0 && employees.length > 0 ? ( <div className="col-span-full h-24 text-center flex items-center justify-center"><LoadingSpinner/> Applying filters...</div> )
               : !isLoading && filteredEmployees.length === 0 ? ( <div className="col-span-full h-24 text-center">No employees found{searchTerm ? ' matching your search' : ''}.</div> )
               : ( filteredEmployees.map(emp => ( <EmployeeCard key={emp.id} employee={emp} onViewDetails={handleViewDetails} onEdit={handleEditEmployee} onDelete={handleDeleteEmployee} /> )))}
            </div>
          )}

          {/* Dialogs for Add/Edit */}
          <Dialog open={isDetailsOpen || isAddEmployeeOpen} onOpenChange={(open) => { if (!open) { setIsDetailsOpen(false); setIsAddEmployeeOpen(false); setSelectedEmployee(null); }}}>
            <DialogContent className="max-w-screen-2xl w-full">
              {/* DialogHeader, Title, Description are now expected inside children components */}
              {selectedEmployee ? (
                <EmployeeDetailsDialog employee={selectedEmployee} onEdit={() => { fetchEmployees(); setIsDetailsOpen(false); setSelectedEmployee(null); }} onDelete={() => { fetchEmployees(); setIsDetailsOpen(false); setSelectedEmployee(null); }} />
              ) : (
                <AddEmployeeForm onSuccess={() => { fetchEmployees(); setIsAddEmployeeOpen(false); }} onCancel={() => { setIsAddEmployeeOpen(false); }} />
              )}
            </DialogContent>
          </Dialog>

          {/* AlertDialog for Single Delete */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent> <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription> This action cannot be undone. This will permanently delete {employeeToDelete?.full_name}'s record. <div className="mt-4"> <p className="font-medium mb-2">Type DELETE to confirm:</p> <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="Type DELETE here" className="mt-1" /> </div> </AlertDialogDescription></AlertDialogHeader> <AlertDialogFooter> <AlertDialogCancel onClick={() => { setDeleteConfirmText(''); setEmployeeToDelete(null); setIsDeleteDialogOpen(false);}}> Cancel </AlertDialogCancel> <AlertDialogAction onClick={confirmDeleteEmployee} disabled={deleteConfirmText !== 'DELETE'} className={`${deleteConfirmText !== 'DELETE' ? 'opacity-50 cursor-not-allowed' : ''}`}> Delete Employee </AlertDialogAction> </AlertDialogFooter> </AlertDialogContent>
          </AlertDialog>

          {/* AlertDialog for Bulk Delete */}
          <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
            <AlertDialogContent> <AlertDialogHeader><AlertDialogTitle>Delete multiple employees?</AlertDialogTitle><AlertDialogDescription> This action cannot be undone. This will permanently delete {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''}. <div className="mt-4"> <p className="font-medium mb-2">Type DELETE to confirm:</p> <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="Type DELETE here" className="mt-1" /> </div> </AlertDialogDescription></AlertDialogHeader> <AlertDialogFooter> <AlertDialogCancel onClick={() => { setDeleteConfirmText(''); setIsBulkDeleteDialogOpen(false); }}> Cancel </AlertDialogCancel> <AlertDialogAction onClick={deleteSelectedEmployees} disabled={deleteConfirmText !== 'DELETE'} className={`${deleteConfirmText !== 'DELETE' ? 'opacity-50 cursor-not-allowed' : ''}`}> Delete Employees </AlertDialogAction> </AlertDialogFooter> </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default EmployeesPage;