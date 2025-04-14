
import { 
  employeeBaseFields, 
  FieldMeta,
  getFieldMetaByName
} from '@/utils/employeeFieldUtils';
import { Employee } from '@/types/employee';

// Only get fields that have predefined options
export const getFilterableFields = (): FieldMeta[] => {
  return employeeBaseFields.filter(field => 
    field.options !== undefined && 
    Array.isArray(field.options) && 
    field.options.length > 0
  );
};

// Group fields by category for the first dropdown level
export const getFieldCategories = (): string[] => {
  const filterableFields = getFilterableFields();
  const categories = [...new Set(filterableFields.map(field => field.category))];
  return categories;
};

// Get fields for a specific category (second dropdown level)
export const getFieldsByCategory = (category: string): FieldMeta[] => {
  return getFilterableFields().filter(field => field.category === category);
};

// Get the field options as an array of strings (third dropdown level)
export const getFieldOptions = (field: FieldMeta): string[] => {
  if (!field.options) return [];
  
  if (typeof field.options[0] === 'string') {
    return field.options as string[];
  } else {
    return (field.options as { value: string, label: string }[]).map(option => option.value);
  }
};

// Format field names for display
export const formatFieldName = (name: string): string => {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

// Format category names for display
export const formatCategoryName = (category: string): string => {
  return category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

// Apply filters to employee data
export const applyFilters = (
  employees: Employee[],
  filters: Array<{ category: string; field: string; value: string }>
): Employee[] => {
  if (filters.length === 0) return employees;

  return employees.filter(employee => {
    return filters.every(filter => {
      let fieldValue = employee[filter.field as keyof Employee];
      const currentFieldMeta = getFieldMetaByName(filter.field);
      
      // Handle null/undefined values
      if (fieldValue === null || fieldValue === undefined) {
        return false;
      } else if(currentFieldMeta?.isNested){
        const nestedType = currentFieldMeta.nestedType;
        if(!nestedType) return false;
        if (!employee[nestedType] || !Array.isArray(employee[nestedType])) return false;

        //check if any of the nested object has the specified value
        fieldValue = employee[nestedType]?.some(item => item[filter.field as keyof typeof item] === filter.value);
        return fieldValue;
      }

      // Match based on value type
      if (typeof fieldValue === 'string') {
        return fieldValue === filter.value;
      } else if (typeof fieldValue === 'boolean') {
        return String(fieldValue).toLowerCase() === filter.value.toLowerCase();
      } else if (typeof fieldValue === 'number') {
          return fieldValue === Number(filter.value);
      } else if (typeof fieldValue === 'boolean'){
          return fieldValue === Boolean(filter.value);
      } else if (typeof fieldValue === "object") {
          return fieldValue;
      }
      
      return false;
    });
  });
};
