
import React from 'react';
import { Edit, Trash, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui-custom/Button';
import { Employee } from '@/types/employee';
import { Checkbox } from '@/components/ui/checkbox';

interface EmployeeCardProps { 
  employee: Employee,
  onViewDetails: (employee: Employee) => void,
  onEdit: (employee: Employee) => void,
  onDelete: (employee: Employee) => void,
  isSelected?: boolean,
  onToggleSelect?: (employee: Employee) => void,
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({ 
  employee,
  onViewDetails,
  onEdit,
  onDelete,
  isSelected = false,
  onToggleSelect
}) => {
  // Generate initials from full name
  const getInitials = (name: string | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n?.[0]).join('').toUpperCase();
  };

  const handleCardClick = () => {
    if (onToggleSelect && isSelected !== undefined) {
      onToggleSelect(employee);
    } else {
      onViewDetails(employee);
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow border p-4 hover:shadow-md transition-shadow cursor-pointer ${
        isSelected ? 'ring-2 ring-hrflow-blue bg-blue-50' : ''
      }`}
      onClick={handleCardClick}
    >
      <div className="flex items-center mb-3">
        <Avatar 
          className={`h-12 w-12 border ${isSelected ? 'ring-2 ring-hrflow-blue' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.(employee);
          }}
        >
          <AvatarImage src={employee.profile_photo || employee.profile_picture} alt={employee.full_name} />
          <AvatarFallback className={isSelected ? "bg-hrflow-blue text-white" : "bg-gray-200"}>
            {isSelected ? <Check className="h-5 w-5" /> : getInitials(employee.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="ml-3">
          <h3 className="font-medium text-base">{employee.full_name}</h3>
          <p className="text-sm text-gray-500">{employee.job_title || 'No Job Title'}</p>
        </div>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="text-sm">
          <span className="text-gray-500">Department:</span> {employee.department || 'N/A'}
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Email:</span> {employee.email}
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Status:</span> <Badge variant={
            employee.employment_status === 'Active' ? 'success' :
            employee.employment_status === 'On Leave' ? 'warning' :
            employee.employment_status === 'Resigned' ? 'destructive' : 'outline'
          }>
            {employee.employment_status || 'Unknown'}
          </Badge>
        </div>
      </div>
      
      <div className="flex justify-end gap-1 border-t pt-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="px-2"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(employee);
          }}
          aria-label="Edit employee"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="px-2 text-red-500 hover:text-red-700"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(employee);
          }}
          aria-label="Delete employee"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
