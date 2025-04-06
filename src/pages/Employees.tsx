// src/pages/Employees.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle, Search, UserPlus, Filter, Download, MoreHorizontal,
  SortAsc, SortDesc
} from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import {
  PremiumCard, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui-custom/Card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { AnimatedSection } from '@/components/ui-custom/AnimatedSection';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Checkbox } from '@/components/ui/checkbox';

const employees = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah.j@example.com', department: 'Marketing', position: 'Marketing Director', status: 'Active', joinDate: '2021-05-12' },
  { id: 2, name: 'Michael Chen', email: 'michael.c@example.com', department: 'Engineering', position: 'Senior Developer', status: 'Active', joinDate: '2022-01-15' },
  { id: 3, name: 'Priya Patel', email: 'priya.p@example.com', department: 'HR', position: 'HR Manager', status: 'Active', joinDate: '2020-11-03' },
  { id: 4, name: 'David Kim', email: 'david.k@example.com', department: 'Finance', position: 'Financial Analyst', status: 'On Leave', joinDate: '2022-03-22' },
  { id: 5, name: 'Lisa Wong', email: 'lisa.w@example.com', department: 'Sales', position: 'Sales Representative', status: 'Active', joinDate: '2021-08-07' },
  { id: 6, name: 'James Wilson', email: 'james.w@example.com', department: 'Operations', position: 'Operations Manager', status: 'Inactive', joinDate: '2019-12-10' }
];

const sortFunctions = {
  name: (a, b, dir) => dir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
  department: (a, b, dir) => dir === 'asc' ? a.department.localeCompare(b.department) : b.department.localeCompare(a.department),
  position: (a, b, dir) => dir === 'asc' ? a.position.localeCompare(b.position) : b.position.localeCompare(a.position),
  status: (a, b, dir) => dir === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status),
  joinDate: (a, b, dir) => dir === 'asc' ? new Date(a.joinDate) - new Date(b.joinDate) : new Date(b.joinDate) - new Date(a.joinDate)
};

const Employees = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
  }, [isAuthenticated, isLoading, navigate]);

  const filteredEmployees = employees
    .filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.position.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => sortFunctions[sortBy](a, b, sortDirection));

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  const handleCheckboxChange = (id: number) => {
    setSelectedEmployees(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(emp => emp.id));
    }
  };

  const handleDeleteSelected = () => {
    alert(`Delete: ${selectedEmployees.join(', ')}`);
  };

  const SortIndicator = ({ column }: { column: string }) => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc'
      ? <SortAsc className="inline h-4 w-4 ml-1" />
      : <SortDesc className="inline h-4 w-4 ml-1" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'On Leave': return 'bg-yellow-100 text-yellow-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <AnimatedSection>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
              <p className="mt-1 text-gray-600">Manage your employee directory</p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
              >
                {isMultiSelectMode ? "Exit Selection" : "Select Multiple"}
              </Button>
              {isMultiSelectMode && (
                <>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>Select All</Button>
                  <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>Delete Selected</Button>
                </>
              )}
              <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
              <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
              <Button variant="primary" size="sm"><UserPlus className="mr-2 h-4 w-4" /> Add Employee</Button>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <PremiumCard className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search employees..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </PremiumCard>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <PremiumCard>
            <CardHeader className="pb-0">
              <CardTitle>Employee Directory</CardTitle>
              <CardDescription>{filteredEmployees.length} employees found</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 px-4">
                        <Checkbox
                          checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead onClick={() => handleSort('name')} className="cursor-pointer">Name <SortIndicator column="name" /></TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead onClick={() => handleSort('department')} className="cursor-pointer">Department <SortIndicator column="department" /></TableHead>
                      <TableHead onClick={() => handleSort('position')} className="cursor-pointer">Position <SortIndicator column="position" /></TableHead>
                      <TableHead onClick={() => handleSort('status')} className="cursor-pointer">Status <SortIndicator column="status" /></TableHead>
                      <TableHead onClick={() => handleSort('joinDate')} className="cursor-pointer">Join Date <SortIndicator column="joinDate" /></TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No employees found. Try adjusting your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map(employee => (
                        <TableRow key={employee.id} data-state={selectedEmployees.includes(employee.id) ? 'selected' : undefined}>
                          <TableCell className="w-12 px-4">
                            <Checkbox
                              checked={selectedEmployees.includes(employee.id)}
                              onCheckedChange={() => handleCheckboxChange(employee.id)}
                              className="border-gray-300"
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div className="h-9 w-9 rounded-full bg-hrflow-blue/10 flex items-center justify-center text-hrflow-blue font-medium mr-2">
                                {employee.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              {employee.name}
                            </div>
                          </TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>{employee.position}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>{employee.status}</span>
                          </TableCell>
                          <TableCell>{new Date(employee.joinDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Change Status</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">Deactivate</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </PremiumCard>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default Employees;
