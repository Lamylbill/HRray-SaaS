
import React, { useState, useEffect } from 'react';
import { LeaveRecordsViewProps, LeaveRequest } from './interfaces';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui-custom/Button';
import { Eye, Filter } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const LeaveRecordsView: React.FC<LeaveRecordsViewProps> = ({ 
  selectedLeaveTypes,
  onLeaveTypeFilter
}) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('leave_requests')
          .select(`
            id,
            start_date,
            end_date,
            status,
            half_day,
            half_day_type,
            created_at,
            employee:employees(id, full_name),
            leave_type:leave_types(id, name, color)
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Transform the data into the expected format with proper typing
        const formattedData: LeaveRequest[] = data.map(item => ({
          id: item.id,
          employee: {
            id: item.employee.id,
            full_name: item.employee.full_name
          },
          leave_type: {
            id: item.leave_type.id,
            name: item.leave_type.name,
            color: item.leave_type.color
          },
          start_date: item.start_date,
          end_date: item.end_date,
          // Ensure status is one of the expected enum values
          status: item.status as "Approved" | "Rejected" | "Pending",
          half_day: item.half_day || false,
          half_day_type: item.half_day_type as "AM" | "PM" | null,
          created_at: item.created_at
        }));
        
        setLeaveRequests(formattedData);
      } catch (error) {
        console.error('Error fetching leave requests:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLeaveRequests();
  }, [user]);
  
  // Filter leave requests based on selectedLeaveTypes
  const filteredLeaveRequests = selectedLeaveTypes.length > 0
    ? leaveRequests.filter(req => selectedLeaveTypes.includes(req.leave_type.name))
    : leaveRequests;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getStatusBadge = (status: "Approved" | "Rejected" | "Pending") => {
    switch (status) {
      case 'Approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const calculateDuration = (start: string, end: string, isHalfDay: boolean) => {
    if (isHalfDay) return '0.5 day';
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Leave Records</h2>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onLeaveTypeFilter([])}
            className="flex items-center"
          >
            <Filter className="mr-2 h-4 w-4" />
            {selectedLeaveTypes.length > 0 ? `Filters (${selectedLeaveTypes.length})` : 'Filters'}
          </Button>
        </div>
      </div>
      
      {selectedLeaveTypes.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {selectedLeaveTypes.map(type => (
            <Badge key={type} variant="secondary" className="px-3 py-1">
              {type}
            </Badge>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onLeaveTypeFilter([])}
            className="text-xs"
          >
            Clear filters
          </Button>
        </div>
      )}
      
      {isLoading ? (
        <div className="py-8 text-center">
          <p className="text-gray-500">Loading leave records...</p>
        </div>
      ) : leaveRequests.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-gray-200 rounded-md">
          <p className="text-gray-500">No leave records found</p>
          {selectedLeaveTypes.length > 0 && (
            <p className="text-sm text-gray-400 mt-1">Try removing some filters</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaveRequests.map(request => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.employee.full_name}</TableCell>
                  <TableCell>
                    <div 
                      className="inline-block w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: request.leave_type.color }}
                    ></div>
                    {request.leave_type.name}
                  </TableCell>
                  <TableCell>
                    {formatDate(request.start_date)} 
                    {request.start_date !== request.end_date && ` - ${formatDate(request.end_date)}`}
                    {request.half_day && ` (${request.half_day_type} Half Day)`}
                  </TableCell>
                  <TableCell>
                    {calculateDuration(request.start_date, request.end_date, !!request.half_day)}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
