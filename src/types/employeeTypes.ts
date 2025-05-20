
import { Employee } from './employee';

// Type for inserting data into Supabase
export interface EmployeeInsertData {
  user_id: string;
  email: string;
  full_name: string;
  [key: string]: any;
  
  // Special fields with non-standard types
  gross_salary?: number | null;
  basic_salary?: number | string | null; // Allow both string and number
  allowances?: number | null;
  work_hours?: number | null;
  notice_period?: number | null;
  cpf_contribution?: boolean | null;
  disciplinary_flags?: boolean | null;
  must_clock?: boolean | null;
  all_work_day?: boolean | null;
  freeze_payment?: boolean | null;
  paid_medical_examination_fee?: boolean | null;
  new_graduate?: boolean | null;
  rehire?: boolean | null;
  contract_signed?: boolean | null;
  thirteenth_month_entitlement?: boolean | null;
  annual_bonus_eligible?: number | string | null;  // Allow both string and number
  performance_score?: number | null;
  medical_entitlement?: number | null;
  leave_entitlement?: number | null;
  leave_balance?: number | null;
  allocation_amount?: number | null;
  overtime_rate_of_pay?: number | null;
  mvc_percentage?: number | null;
  salary?: number | null;
  salary_fixed?: number | null;
  salary_gross?: number | null;
  probation_period?: number | null;
  
  // Employee status field to ensure it's always included in updates
  employment_status?: string | null;
}

// Type for Excel imported data
export interface ExcelImportData {
  employee: Partial<Employee>;
}

// Type for employee data conversion mapping
export interface FieldTypeMapping {
  fieldName: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'dropdown';
  options?: string[];
  required?: boolean;
}
