
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui-custom/Button';
import { Input } from '@/components/ui/input';
import { Check, ChevronsUpDown, Filter, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Employee } from '@/types/employee';
import { Badge } from '@/components/ui/badge';

interface AdvancedFilterDropdownProps {
  employees: Employee[];
  onFiltersChange: (filteredEmployees: Employee[]) => void;
}

type EmployeeCategory = {
  name: string;
  fields: {
    name: string;
    key: keyof Employee;
  }[];
};

const employeeCategories: EmployeeCategory[] = [
  {
    name: 'Personal Info',
    fields: [
      { name: 'Name', key: 'full_name' },
      { name: 'Gender', key: 'gender' },
      { name: 'Nationality', key: 'nationality' },
      { name: 'Email', key: 'email' },
      { name: 'Contact Number', key: 'contact_number' },
      { name: 'Marital Status', key: 'marital_status' },
      { name: 'NRIC', key: 'nric' },
    ]
  },
  {
    name: 'Employment',
    fields: [
      { name: 'Job Title', key: 'job_title' },
      { name: 'Department', key: 'department' },
      { name: 'Employment Type', key: 'employment_type' },
      { name: 'Employment Status', key: 'employment_status' },
      { name: 'Date of Hire', key: 'date_of_hire' },
      { name: 'Supervisor', key: 'supervisor' },
      { name: 'Contract Type', key: 'contract_type' },
    ]
  },
  {
    name: 'Compensation',
    fields: [
      { name: 'Gross Salary', key: 'gross_salary' },
      { name: 'Basic Salary', key: 'basic_salary' },
      { name: 'CPF Contribution', key: 'cpf_contribution' },
      { name: 'Payroll Cycle', key: 'payroll_cycle' },
      { name: 'Bank Name', key: 'bank_name' },
    ]
  },
  {
    name: 'Compliance',
    fields: [
      { name: 'CPF Status', key: 'cpf_status' },
      { name: 'Work Pass Type', key: 'work_pass_type' },
      { name: 'Tax File Number', key: 'tax_file_no' },
      { name: 'NS Status', key: 'ns_status' },
    ]
  }
];

export const AdvancedFilterDropdown: React.FC<AdvancedFilterDropdownProps> = ({
  employees,
  onFiltersChange,
}) => {
  const [activeFilters, setActiveFilters] = useState<{
    category?: EmployeeCategory,
    field?: { name: string; key: keyof Employee },
    value?: string
  }>({});
  
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [fieldOpen, setFieldOpen] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  const [filterOptions, setFilterOptions] = useState<string[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<{
    field: { name: string; key: keyof Employee },
    value: string
  }[]>([]);

  // When category or field changes, update the available filter options
  useEffect(() => {
    if (!activeFilters.field) return;
    
    // Get all unique values for the selected field
    const fieldKey = activeFilters.field.key;
    const uniqueValues = [...new Set(
      employees
        .map(emp => emp[fieldKey])
        .filter(Boolean)
        .map(val => String(val))
    )].sort();
    
    setFilterOptions(uniqueValues);
  }, [activeFilters.field, employees]);

  // Filtering logic
  const applyFilters = () => {
    if (!activeFilters.field || !filterValue) return;
    
    const newFilter = {
      field: activeFilters.field,
      value: filterValue
    };
    
    setAppliedFilters([...appliedFilters, newFilter]);
    resetActiveFilters();
    
    // Apply all filters to the employee list
    filterEmployees([...appliedFilters, newFilter]);
  };

  const filterEmployees = (filters: { field: { key: keyof Employee }, value: string }[]) => {
    if (filters.length === 0) {
      onFiltersChange(employees);
      return;
    }
    
    const filteredEmployees = employees.filter(employee => {
      // An employee must match ALL applied filters
      return filters.every(filter => {
        const fieldValue = employee[filter.field.key];
        if (fieldValue === null || fieldValue === undefined) return false;
        
        // Handle different types of data
        if (typeof fieldValue === 'boolean') {
          return fieldValue.toString() === filter.value;
        } else if (fieldValue instanceof Date) {
          return fieldValue.toISOString().includes(filter.value);
        } else {
          return String(fieldValue).toLowerCase().includes(filter.value.toLowerCase());
        }
      });
    });
    
    onFiltersChange(filteredEmployees);
  };

  const removeFilter = (indexToRemove: number) => {
    const newFilters = appliedFilters.filter((_, i) => i !== indexToRemove);
    setAppliedFilters(newFilters);
    
    if (newFilters.length === 0) {
      onFiltersChange(employees); // Reset to show all employees
    } else {
      filterEmployees(newFilters);
    }
  };

  const resetActiveFilters = () => {
    setActiveFilters({});
    setFilterValue('');
    setFieldOpen(false);
    setCategoryOpen(false);
  };

  const clearAllFilters = () => {
    setAppliedFilters([]);
    resetActiveFilters();
    onFiltersChange(employees);
  };

  const handleCategorySelect = (category: EmployeeCategory) => {
    setActiveFilters({ category });
    setCategoryOpen(false);
    setFieldOpen(true);
  };
  
  const handleFieldSelect = (field: { name: string; key: keyof Employee }) => {
    setActiveFilters({ ...activeFilters, field });
    setFieldOpen(false);
  };

  return (
    <div className="relative">
      <Popover open={categoryOpen || fieldOpen} onOpenChange={(open) => {
        // Only allow closing through explicit actions, not by clicking outside
        if (!open) return;
        setCategoryOpen(open);
      }}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn(
            appliedFilters.length > 0 && "border-blue-500 text-blue-600"
          )}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
            {appliedFilters.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-blue-100">
                {appliedFilters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="grid gap-3 p-4">
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Filter Employees</h4>
              <p className="text-xs text-muted-foreground">
                Select a category and field to filter by
              </p>
            </div>
            
            <div className="grid gap-2">
              {/* Category selection */}
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className="justify-between"
                  >
                    {activeFilters.category ? activeFilters.category.name : "Select category..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search categories..." />
                    <CommandEmpty>No category found.</CommandEmpty>
                    <CommandGroup>
                      {employeeCategories.map((category) => (
                        <CommandItem
                          key={category.name}
                          onSelect={() => handleCategorySelect(category)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              activeFilters.category?.name === category.name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {category.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              
              {/* Field selection */}
              {activeFilters.category && (
                <Popover open={fieldOpen} onOpenChange={setFieldOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={fieldOpen}
                      className="justify-between"
                    >
                      {activeFilters.field ? activeFilters.field.name : "Select field..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search fields..." />
                      <CommandEmpty>No field found.</CommandEmpty>
                      <CommandGroup>
                        {activeFilters.category.fields.map((field) => (
                          <CommandItem
                            key={String(field.key)}
                            onSelect={() => handleFieldSelect(field)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                activeFilters.field?.key === field.key ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {field.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              
              {/* Value input */}
              {activeFilters.field && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Filter by {activeFilters.field.name}:
                  </label>
                  {filterOptions.length > 0 ? (
                    <div className="grid gap-2 max-h-32 overflow-auto border p-2 rounded">
                      {filterOptions.map(option => (
                        <div key={option} className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-left justify-start h-auto py-1 w-full"
                            onClick={() => setFilterValue(option)}
                          >
                            <div className="flex w-full items-center">
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filterValue === option ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">{option}</span>
                            </div>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Input
                      placeholder="Enter filter value..."
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                    />
                  )}
                </div>
              )}
              
              {/* Applied filters */}
              {appliedFilters.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Applied Filters:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-8 px-2 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {appliedFilters.map((filter, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        <span>{filter.field.name}: {filter.value}</span>
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeFilter(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    resetActiveFilters();
                    setCategoryOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  disabled={!activeFilters.field || !filterValue}
                  onClick={applyFilters}
                >
                  Apply Filter
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
