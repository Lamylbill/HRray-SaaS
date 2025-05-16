import React, { useEffect, useState } from 'react';
import {
  Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue
} from '@/components/ui/select';
import { DOCUMENT_CATEGORY_OPTIONS_ARRAY, DOCUMENT_TYPES, DocumentCategoryKey, DOCUMENT_CATEGORIES_MAP } from './DocumentCategoryTypes';

interface DocumentTypeOption {
  value: string;
  label: string;
  description?: string;
}

interface DocumentSelectorProps {
  id?: string;
  type: 'category' | 'documentType';
  value: string; // For category, this will be the KEY. For documentType, it's the value of the specific type.
  categoryValue?: DocumentCategoryKey | ''; // KEY of the selected category, used for dependent documentType
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  id,
  type,
  value,
  categoryValue,
  onChange,
  disabled = false,
  className
}) => {
  const [options, setOptions] = useState<DocumentTypeOption[]>([]);

  useEffect(() => {
    if (type === 'category') {
      setOptions(
        DOCUMENT_CATEGORY_OPTIONS_ARRAY.map(catOpt => ({
          value: catOpt.key,   // The value stored/returned will be the KEY
          label: catOpt.label  // The text displayed will be the LABEL
        }))
      );
    } else if (type === 'documentType' && categoryValue && DOCUMENT_CATEGORIES_MAP[categoryValue]) {
      // Use the category KEY to find the LABEL from DOCUMENT_CATEGORIES_MAP
      const categoryLabel = DOCUMENT_CATEGORIES_MAP[categoryValue];
      // Then use the LABEL to find types in DOCUMENT_TYPES
      if (categoryLabel && DOCUMENT_TYPES[categoryLabel]) {
        setOptions(DOCUMENT_TYPES[categoryLabel]);
      } else {
        setOptions([]);
      }
    } else {
      setOptions([]);
    }
  }, [type, categoryValue]);

  return (
    <div className={className}>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={
          disabled || (type === 'documentType' && (!categoryValue || options.length === 0))
        }
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue
            placeholder={
              type === 'category'
                ? 'Select category*'
                : !categoryValue ? 'Select category first' : 'Select type*'
            }
          />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
            {options.length === 0 && type === 'documentType' && categoryValue && (
                 <div className="px-2 py-1.5 text-sm text-muted-foreground">No types defined for this category.</div>
            )}
             {options.length === 0 && type === 'category' && (
                 <div className="px-2 py-1.5 text-sm text-muted-foreground">No categories defined.</div>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};