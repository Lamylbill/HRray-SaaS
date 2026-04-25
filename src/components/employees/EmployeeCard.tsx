import React from 'react';
import { Edit, Trash, Eye, Mail, Phone, Building2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Employee } from '@/types/employee';

interface EmployeeCardProps {
  employee: Employee;
  onViewDetails: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  isSelected?: boolean;
  onToggleSelect?: (employee: Employee) => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  Active:    { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'On Leave':{ bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  Resigned:  { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-500'     },
};

const DEFAULT_STATUS = { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' };

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onViewDetails,
  onEdit,
  onDelete,
  isSelected = false,
  onToggleSelect,
}) => {
  const getInitials = (name: string | undefined) =>
    name ? name.split(' ').map(n => n?.[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() : '?';

  const status = employee.employment_status || 'Unknown';
  const statusStyle = STATUS_STYLES[status] ?? DEFAULT_STATUS;

  const handleCardClick = () => {
    if (onToggleSelect) onToggleSelect(employee);
    else onViewDetails(employee);
  };

  return (
    <div
      onClick={handleCardClick}
      className={[
        'group relative flex flex-col bg-white rounded-2xl overflow-hidden cursor-pointer',
        'transition-all duration-200 ease-out',
        isSelected
          ? 'ring-2 ring-blue-600 shadow-lg shadow-blue-100/60'
          : 'border border-gray-100 shadow-md hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/60',
      ].join(' ')}
    >
      {/* Selected check badge */}
      {isSelected && (
        <div className="absolute top-2.5 right-2.5 z-20 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Header band */}
      <div className="h-14 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex-shrink-0" />

      {/* Avatar overlapping band */}
      <div className="flex justify-center -mt-8 px-4">
        <Avatar
          className="h-16 w-16 ring-4 ring-white shadow-md cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onToggleSelect?.(employee); }}
        >
          <AvatarImage src={employee.profile_photo || employee.profile_picture || undefined} alt={employee.full_name} />
          <AvatarFallback className="bg-orange-500 text-white font-semibold text-lg select-none">
            {getInitials(employee.full_name)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Core info */}
      <div className="flex-1 flex flex-col px-4 pt-2 pb-3">
        <div className="text-center mb-3">
          <h3 className="font-semibold text-gray-900 text-base leading-snug truncate">
            {employee.full_name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {employee.job_title || 'No Job Title'}
          </p>
        </div>

        {/* Tags */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap mb-3">
          {employee.department && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[80px]">{employee.department}</span>
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusStyle.dot}`} />
            {status}
          </span>
        </div>

        {/* Contact */}
        <div className="space-y-1 text-xs text-gray-500 min-w-0">
          {employee.email && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Mail className="h-3 w-3 flex-shrink-0 text-gray-400" />
              <span className="truncate">{employee.email}</span>
            </div>
          )}
          {(employee.contact_number || employee.phone_number) && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 flex-shrink-0 text-gray-400" />
              <span>{employee.contact_number || employee.phone_number}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action footer — icons always present, labels slide in on hover */}
      <div className="flex items-center border-t border-gray-100 divide-x divide-gray-100 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onViewDetails(employee); }}
          aria-label="View details"
          className="flex-1 flex items-center justify-center gap-1 py-2.5 text-gray-400
            hover:text-blue-700 hover:bg-blue-50 transition-colors duration-150 cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="text-xs font-medium max-w-0 overflow-hidden whitespace-nowrap
            group-hover:max-w-xs transition-all duration-200 ease-out">
            View
          </span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onEdit(employee); }}
          aria-label="Edit employee"
          className="flex-1 flex items-center justify-center gap-1 py-2.5 text-gray-400
            hover:text-gray-700 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
        >
          <Edit className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="text-xs font-medium max-w-0 overflow-hidden whitespace-nowrap
            group-hover:max-w-xs transition-all duration-200 ease-out">
            Edit
          </span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(employee); }}
          aria-label="Delete employee"
          className="flex-1 flex items-center justify-center gap-1 py-2.5 text-gray-400
            hover:text-red-600 hover:bg-red-50 transition-colors duration-150 cursor-pointer"
        >
          <Trash className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="text-xs font-medium max-w-0 overflow-hidden whitespace-nowrap
            group-hover:max-w-xs transition-all duration-200 ease-out">
            Delete
          </span>
        </button>
      </div>
    </div>
  );
};
