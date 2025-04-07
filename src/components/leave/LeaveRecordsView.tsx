
import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Eye, MoreHorizontal, FileText, AlertCircle, Download, History } from 'lucide-react';
import { PremiumCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-custom/Card';
import { Button } from '@/components/ui-custom/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LeaveRecord {
  id: string;
  employee: {
    id: string;
    name: string;
  };
  leaveType: {
    id: string;
    name: string;
    color: string;
  };
  quota: number;
  taken: number;
  remaining: number;
  adjustment: number;
  resetDate: Date;
}

export const LeaveRecordsView = () => {
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<LeaveRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadLeaveRecords();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredRecords(
        leaveRecords.filter(record => 
          record.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.leaveType.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredRecords(leaveRecords);
    }
  }, [searchTerm, leaveRecords]);

  const loadLeaveRecords = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, we would fetch from Supabase
      // For now, let's use dummy data
      const mockRecords: LeaveRecord[] = [
        {
          id: '1',
          employee: { id: '1', name: 'Sarah Johnson' },
          leaveType: { id: '1', name: 'Annual Leave', color: '#3b82f6' },
          quota: 14,
          taken: 5,
          remaining: 9,
          adjustment: 0,
          resetDate: new Date(new Date().getFullYear(), 0, 1) // Jan 1st of current year
        },
        {
          id: '2',
          employee: { id: '1', name: 'Sarah Johnson' },
          leaveType: { id: '2', name: 'Sick Leave', color: '#ef4444' },
          quota: 14,
          taken: 2,
          remaining: 12,
          adjustment: 0,
          resetDate: new Date(new Date().getFullYear(), 0, 1)
        },
        {
          id: '3',
          employee: { id: '2', name: 'Michael Chen' },
          leaveType: { id: '1', name: 'Annual Leave', color: '#3b82f6' },
          quota: 14,
          taken: 8,
          remaining: 6,
          adjustment: 0,
          resetDate: new Date(new Date().getFullYear(), 0, 1)
        },
        {
          id: '4',
          employee: { id: '3', name: 'Priya Patel' },
          leaveType: { id: '3', name: 'Childcare Leave', color: '#8b5cf6' },
          quota: 6,
          taken: 1,
          remaining: 5,
          adjustment: 0,
          resetDate: new Date(new Date().getFullYear(), 0, 1)
        }
      ];

      setLeaveRecords(mockRecords);
      setFilteredRecords(mockRecords);
    } catch (error) {
      console.error('Error loading leave records:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leave records',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRecord = (recordId: string) => {
    setSelectedRecords(prev => 
      prev.includes(recordId) 
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRecords.length === filteredRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(filteredRecords.map(record => record.id));
    }
  };

  const handleSaveEdit = (recordId: string, field: string, value: number) => {
    // In a real implementation, this would update the database
    setLeaveRecords(prev => 
      prev.map(record => {
        if (record.id === recordId) {
          const updated = { ...record };
          
          if (field === 'quota') {
            updated.quota = value;
            updated.remaining = value - record.taken + record.adjustment;
          } else if (field === 'adjustment') {
            updated.adjustment = value;
            updated.remaining = record.quota - record.taken + value;
          }
          
          return updated;
        }
        return record;
      })
    );
    
    setIsEditing(null);
    
    toast({
      title: 'Updated',
      description: 'Leave record has been updated',
      duration: 3000,
    });
  };

  const handleDelete = (recordIds: string[]) => {
    // In a real implementation, this would delete from the database
    setLeaveRecords(prev => prev.filter(record => !recordIds.includes(record.id)));
    setSelectedRecords(prev => prev.filter(id => !recordIds.includes(id)));
    
    toast({
      title: 'Deleted',
      description: `${recordIds.length} record(s) deleted`,
      duration: 3000,
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-72">
          <Input
            type="text"
            placeholder="Search employees or leave types..."
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

        {selectedRecords.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(selectedRecords)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
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
                        checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0} 
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead className="text-right">Quota</TableHead>
                    <TableHead className="text-right">Taken</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Adjustments</TableHead>
                    <TableHead>Reset Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No leave records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map(record => (
                      <TableRow key={record.id} data-state={selectedRecords.includes(record.id) ? 'selected' : undefined}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedRecords.includes(record.id)}
                            onCheckedChange={() => handleSelectRecord(record.id)}
                          />
                        </TableCell>
                        <TableCell>{record.employee.name}</TableCell>
                        <TableCell>
                          <Badge style={{backgroundColor: record.leaveType.color, color: 'white'}}>
                            {record.leaveType.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing === `${record.id}-quota` ? (
                            <Input 
                              type="number"
                              className="w-20 h-7 text-right"
                              defaultValue={record.quota}
                              min={0}
                              onBlur={(e) => handleSaveEdit(record.id, 'quota', parseInt(e.target.value))}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(record.id, 'quota', parseInt((e.target as HTMLInputElement).value))}
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="cursor-pointer hover:text-blue-500"
                              onClick={() => setIsEditing(`${record.id}-quota`)}
                            >
                              {record.quota}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{record.taken}</TableCell>
                        <TableCell className={`text-right font-medium ${record.remaining < 0 ? 'text-red-600' : record.remaining === 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {record.remaining}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing === `${record.id}-adjustment` ? (
                            <Input 
                              type="number"
                              className="w-20 h-7 text-right"
                              defaultValue={record.adjustment}
                              onBlur={(e) => handleSaveEdit(record.id, 'adjustment', parseInt(e.target.value))}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(record.id, 'adjustment', parseInt((e.target as HTMLInputElement).value))}
                              autoFocus
                            />
                          ) : (
                            <div 
                              className={`cursor-pointer hover:text-blue-500 ${record.adjustment !== 0 ? (record.adjustment > 0 ? 'text-green-600' : 'text-red-600') : ''}`}
                              onClick={() => setIsEditing(`${record.id}-adjustment`)}
                            >
                              {record.adjustment > 0 ? `+${record.adjustment}` : record.adjustment}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(record.resetDate)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setIsEditing(`${record.id}-quota`)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit Quota
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setIsEditing(`${record.id}-adjustment`)}>
                                <PlusCircle className="h-4 w-4 mr-2" /> Add Adjustment
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <History className="h-4 w-4 mr-2" /> View History
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete([record.id])}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
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
