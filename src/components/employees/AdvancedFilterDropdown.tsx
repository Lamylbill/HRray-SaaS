
import React, { useState, useEffect, useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui-custom/Button";
import { Check, Filter } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Employee } from '@/types/employee';

const FILTER_CATEGORIES = {
  "Personal": ["gender", "nationality", "marital_status", "race"],
  "Employment": ["department", "job_title", "employment_type", "employment_status"],
  "Contract": ["contract_type", "work_pass_type"],
  "Compensation": ["salary", "ot_eligible", "benefits_tier"],
  "Compliance": ["cpf_status", "tax_residency", "leave_category"]
};

interface AdvancedFilterDropdownProps {
  employees: Employee[];
  onFiltersChange: (filteredEmployees: Employee[]) => void;
}

type FilterValue = {
  field: string;
  value: string | number | boolean | null;
  label: string;
};

export const AdvancedFilterDropdown: React.FC<AdvancedFilterDropdownProps> = ({
  employees,
  onFiltersChange,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<FilterValue[]>([]);
  
  // Get unique values for the selected field
  const fieldValues = useMemo(() => {
    if (!selectedField) return [];
    
    const values = employees
      .map(emp => emp[selectedField as keyof Employee])
      .filter((value, index, self) => 
        value !== undefined && 
        value !== null && 
        self.indexOf(value) === index
      )
      .sort();
      
    return values;
  }, [selectedField, employees]);

  // Apply filters when activeFilters change
  useEffect(() => {
    if (activeFilters.length === 0) {
      onFiltersChange(employees);
      return;
    }
    
    const filtered = employees.filter(employee => {
      return activeFilters.every(filter => {
        const employeeValue = employee[filter.field as keyof Employee];
        return employeeValue === filter.value;
      });
    });
    
    onFiltersChange(filtered);
  }, [activeFilters, employees, onFiltersChange]);

  // Add a filter
  const addFilter = (field: string, value: string | number | boolean | null) => {
    // Don't add duplicate filters
    if (activeFilters.some(f => f.field === field && f.value === value)) {
      return;
    }
    
    const label = value === null ? 'Not specified' : String(value);
    
    setActiveFilters(prev => [...prev, { field, value, label }]);
    setSelectedCategory(null);
    setSelectedField(null);
  };

  // Remove a filter
  const removeFilter = (index: number) => {
    setActiveFilters(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters([]);
    setSelectedCategory(null);
    setSelectedField(null);
  };

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            {activeFilters.length > 0 
              ? `Filters (${activeFilters.length})` 
              : "Filters"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>Filter by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Show categories if no field is selected */}
          {!selectedField && (
            <DropdownMenuGroup>
              {Object.keys(FILTER_CATEGORIES).map(category => (
                <DropdownMenuSub key={category}>
                  <DropdownMenuSubTrigger>
                    <span>{category}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {FILTER_CATEGORIES[category as keyof typeof FILTER_CATEGORIES].map(field => (
                        <DropdownMenuItem 
                          key={field}
                          onClick={() => {
                            setSelectedCategory(category);
                            setSelectedField(field);
                          }}
                        >
                          <span className="capitalize">
                            {field.replace(/_/g, ' ')}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              ))}
            </DropdownMenuGroup>
          )}
          
          {/* Show field values if a field is selected */}
          {selectedField && (
            <>
              <DropdownMenuLabel className="flex justify-between items-center">
                <span className="capitalize">
                  {selectedField.replace(/_/g, ' ')}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"  // Fixed: "xs" is not a valid size
                  className="h-5 text-xs" 
                  onClick={() => {
                    setSelectedField(null);
                    setSelectedCategory(null);
                  }}
                >
                  Back
                </Button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {fieldValues.length > 0 ? (
                fieldValues.map((value, index) => {
                  // Fixed: Ensure value is of the correct type
                  const typedValue = Array.isArray(value) ? value[0] : value;
                  return (
                    <DropdownMenuItem 
                      key={index}
                      onClick={() => addFilter(selectedField, typedValue)}
                      className="flex justify-between"
                    >
                      <span>{String(typedValue)}</span>
                      {activeFilters.some(f => 
                        f.field === selectedField && 
                        f.value === typedValue
                      ) && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                  );
                })
              ) : (
                <DropdownMenuItem disabled>
                  No values found
                </DropdownMenuItem>
              )}
              
              {/* Add option for 'Not specified' */}
              <DropdownMenuItem 
                onClick={() => addFilter(selectedField, null)}
                className="flex justify-between"
              >
                <span>Not specified</span>
                {activeFilters.some(f => 
                  f.field === selectedField && 
                  f.value === null
                ) && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            </>
          )}
          
          {activeFilters.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearFilters}>
                Clear all filters
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Display active filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="outline" className="px-2 py-1">
              <span className="capitalize mr-1">{filter.field.replace(/_/g, ' ')}:</span>
              <span>{filter.label}</span>
              <button 
                className="ml-1 text-xs hover:text-red-500"
                onClick={() => removeFilter(index)}
              >
                ✕
              </button>
            </Badge>
          ))}
          <Badge 
            variant="outline" 
            className="px-2 py-1 cursor-pointer bg-gray-100"
            onClick={clearFilters}
          >
            Clear all
          </Badge>
        </div>
      )}
    </div>
  );
};
