
import React, { useState, useEffect } from 'react';
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
import { FieldMeta } from '@/utils/employeeFieldUtils';
import { 
  getFieldCategories, 
  getFieldsByCategory, 
  getFieldOptions,
  formatFieldName,
  formatCategoryName,
  applyFilters 
} from '@/utils/filterUtils';
import { useToast } from '@/hooks/use-toast';

interface AdvancedFilterDropdownProps {
  employees: Employee[];
  onFiltersChange: (filteredEmployees: Employee[]) => void;
}

type FilterSelection = {
  category: string;
  field: string;
  fieldName: string;
  value: string;
  valueName: string;
};

export const AdvancedFilterDropdown: React.FC<AdvancedFilterDropdownProps> = ({
  employees,
  onFiltersChange,
}) => {
  // State for tracking filter selection at each level
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<FieldMeta | null>(null);
  const [activeFilters, setActiveFilters] = useState<FilterSelection[]>([]);
  const { toast } = useToast();
  
  // Cache the categories and fields for better performance
  const categories = getFieldCategories();
  
  // Apply filters when activeFilters change
  useEffect(() => {
    console.log('Active filters changed:', activeFilters);
    
    if (activeFilters.length === 0) {
      onFiltersChange(employees);
      return;
    }
    
    const filterParams = activeFilters.map(filter => ({
      category: filter.category,
      field: filter.field,
      value: filter.value
    }));
    
    const filtered = applyFilters(employees, filterParams);
    console.log('Filtered employees:', filtered.length);
    onFiltersChange(filtered);
  }, [activeFilters, employees, onFiltersChange]);

  // Add a filter
  const addFilter = (value: string, displayValue: string) => {
    if (!selectedCategory || !selectedField) return;
    
    // Don't add duplicate filters
    if (activeFilters.some(f => 
      f.category === selectedCategory && 
      f.field === selectedField.name && 
      f.value === value)
    ) {
      return;
    }
    
    const newFilter: FilterSelection = {
      category: selectedCategory,
      field: selectedField.name,
      fieldName: selectedField.label,
      value: value,
      valueName: displayValue
    };
    
    console.log('Adding filter:', newFilter);
    setActiveFilters(prev => [...prev, newFilter]);
    
    // Show toast to confirm filter applied
    toast({
      title: "Filter Applied",
      description: `${selectedField.label}: ${displayValue}`,
    });
    
    // Reset selection
    setSelectedField(null);
    setSelectedCategory(null);
  };

  // Remove a filter
  const removeFilter = (index: number) => {
    const filterToRemove = activeFilters[index];
    console.log('Removing filter:', filterToRemove);
    setActiveFilters(prev => prev.filter((_, i) => i !== index));
    
    toast({
      title: "Filter Removed",
      description: `${filterToRemove.fieldName}: ${filterToRemove.valueName}`,
    });
  };

  // Clear all filters
  const clearFilters = () => {
    console.log('Clearing all filters');
    setActiveFilters([]);
    setSelectedCategory(null);
    setSelectedField(null);
    
    toast({
      title: "Filters Cleared",
      description: "All filters have been removed",
    });
  };

  // Get display value for an option (handling both string and object options)
  const getDisplayValue = (value: string, field: FieldMeta): string => {
    if (!field.options) return value;
    
    if (typeof field.options[0] === 'string') {
      return value;
    } else {
      const option = (field.options as { value: string, label: string }[])
        .find(opt => opt.value === value);
      return option ? option.label : value;
    }
  };

  return (
    <div >
      <DropdownMenu >
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
          >
            <Filter className="mr-2 h-4 w-4" />
            {activeFilters.length > 0 
              ? `Filters (${activeFilters.length})` 
              : "Filters"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent className="w-56 z-50 bg-white" align="end">

          <DropdownMenuLabel>Filter by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {!selectedCategory && (
            // First level - Categories
            <DropdownMenuGroup>
              {categories.map(category => (
                <DropdownMenuItem 
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                >
                  <span>{formatCategoryName(category)}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
          
          {selectedCategory && !selectedField && (
            // Second level - Fields
            <>
              <DropdownMenuLabel className="flex justify-between items-center">
                <span>{formatCategoryName(selectedCategory)}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-5 text-xs" 
                  onClick={() => setSelectedCategory(null)}
                >
                  Back
                </Button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {getFieldsByCategory(selectedCategory).map(field => (
                <DropdownMenuItem 
                  key={field.name}
                  onClick={() => setSelectedField(field)}
                >
                  <span>{field.label}</span>
                </DropdownMenuItem>
              ))}
            </>
          )}
          
          {selectedCategory && selectedField && (
            // Third level - Values
            <>
              <DropdownMenuLabel className="flex justify-between items-center">
                <span>{selectedField.label}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-5 text-xs" 
                  onClick={() => setSelectedField(null)}
                >
                  Back
                </Button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {getFieldOptions(selectedField).map((value, index) => {
                const displayValue = getDisplayValue(value, selectedField);
                const isSelected = activeFilters.some(f => 
                  f.category === selectedCategory && 
                  f.field === selectedField.name && 
                  f.value === value
                );
                
                return (
                  <DropdownMenuItem 
                    key={index}
                    onClick={() => addFilter(value, displayValue)}
                    className="flex justify-between"
                  >
                    <span>{displayValue}</span>
                    {isSelected && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>
                );
              })}
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
        </DropdownMenuPortal>
      </DropdownMenu>
      
      {/* Display active filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="outline" className="px-2 py-1">
              <span className="font-medium mr-1">{filter.fieldName}:</span>
              <span>{filter.valueName}</span>
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
