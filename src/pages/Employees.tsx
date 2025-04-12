import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import {
  Search, UserPlus, Filter, Download, MoreHorizontal,
  SortAsc, SortDesc, Trash, Check
} from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import {
  PremiumCard, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui-custom/Card';
import { Input } from '@/components/ui/input';
import { AnimatedSection } from '@/components/ui-custom/AnimatedSection';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

const Employees = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!user) return;
      const token = localStorage.getItem('jwt_token');

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .order('full_name', { ascending: true })
        .auth(token);

      if (error) {
        console.error('Error fetching employees:', error);
        return;
      }

      setEmployees(data || []);
    };

    fetchEmployees();
  }, [user]);

  const sortFunctions = {
    name: (a, b, dir) => dir === 'asc' ? a.full_name.localeCompare(b.full_name) : b.full_name.localeCompare(a.full_name),
    department: (a, b, dir) => dir === 'asc' ? (a.department || '').localeCompare(b.department || '') : (b.department || '').localeCompare(a.department || ''),
    position: (a, b, dir) => dir === 'asc' ? (a.job_title || '').localeCompare(b.job_title || '') : (b.job_title || '').localeCompare(a.job_title || ''),
    status: (a, b, dir) => dir === 'asc' ? (a.employment_status || '').localeCompare(b.employment_status || '') : (b.employment_status || '').localeCompare(a.employment_status || ''),
    joinDate: (a, b, dir) => dir === 'asc' ? new Date(a.date_of_hire).getTime() - new Date(b.date_of_hire).getTime() : new Date(b.date_of_hire).getTime() - new Date(a.date_of_hire).getTime(),
  };

  const filteredEmployees = employees
    .filter(e =>
      e.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.job_title?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => sortFunctions[sortBy](a, b, sortDirection));

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  const SortIndicator = ({ column }: { column: string }) =>
    sortBy === column ? (sortDirection === 'asc' ? <SortAsc className="inline h-4 w-4 ml-1" /> : <SortDesc className="inline h-4 w-4 ml-1" />) : null;

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
              <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
              <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
              <Button variant="primary" size="sm"><UserPlus className="mr-2 h-4 w-4" /> Add Employee</Button>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <div className="bg-white p-4 rounded-lg mb-4">
            <div className="flex md:justify-between md:flex-row flex-col gap-4">
              <div className="relative w-full md:w-80">
                <Input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
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
                      <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                        Name <SortIndicator column="name" />
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead onClick={() => handleSort('department')} className="cursor-pointer">
                        Department <SortIndicator column="department" />
                      </TableHead>
                      <TableHead onClick={() => handleSort('position')} className="cursor-pointer">
                        Position <SortIndicator column="position" />
                      </TableHead>
                      <TableHead onClick={() => handleSort('status')} className="cursor-pointer">
                        Status <SortIndicator column="status" />
                      </TableHead>
                      <TableHead onClick={() => handleSort('joinDate')} className="cursor-pointer">
                        Join Date <SortIndicator column="joinDate" />
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No employees found. Try adjusting your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map(employee => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.full_name}</TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>{employee.department || 'N/A'}</TableCell>
                          <TableCell>{employee.job_title || 'N/A'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.employment_status)}`}>{employee.employment_status || 'N/A'}</span>
                          </TableCell>
                          <TableCell>{employee.date_of_hire ? new Date(employee.date_of_hire).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
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
