import { Employee, EmployeeFormData } from '@/types/employee';
import { z } from 'zod';

export interface FieldMeta {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'email' | 'dropdown' | 'boolean' | 'textarea' | 'upload';
  category: string;
  isNested?: boolean;
  nestedType?: keyof Omit<EmployeeFormData, 'employee'>;
  example?: string | number;
  isAdvanced?: boolean;
  required?: boolean;
  placeholder?: string;
  options?: string[] | { value: string, label: string }[];
}

export const employeeFormSchema = z.object({
  employee: z.object({
    id: z.string().optional(),
    user_id: z.string().optional(),
    full_name: z.string().min(1, { message: "Full name is required" }),
    email: z.string().email({ message: "Valid email is required" }),
  }).passthrough(),
  allowances: z.array(z.any()).optional(),
  familyMembers: z.array(z.any()).optional(),
  education: z.array(z.any()).optional(),
  workExperience: z.array(z.any()).optional(),
  appraisalRatings: z.array(z.any()).optional(),
  documents: z.array(z.any()).optional(),
});

export const employeeBaseFields: FieldMeta[] = [
  // Personal Info - Basic
  { name: 'full_name', label: 'Full Name', type: 'text', category: 'personal-info', isAdvanced: false, required: true },
  { name: 'gender', label: 'Gender', type: 'dropdown', category: 'personal-info', isAdvanced: false, options: ['Male', 'Female', 'Other'] },
  { name: 'date_of_birth', label: 'Date of Birth', type: 'date', category: 'personal-info', isAdvanced: false },
  { name: 'nationality', label: 'Nationality', type: 'dropdown', category: 'personal-info', isAdvanced: false, options: ['Singapore', 'Malaysia', 'Indonesia', 'Other'] },
  { name: 'contact_number', label: 'Contact Number', type: 'text', category: 'personal-info', isAdvanced: false },
  { name: 'email', label: 'Email Address', type: 'email', category: 'personal-info', isAdvanced: false, required: true },

  // Personal Info - Advanced
  { name: 'marital_status', label: 'Marital Status', type: 'dropdown', category: 'personal-info', isAdvanced: true, options: ['Single', 'Married', 'Divorced', 'Widowed'] },
  { name: 'race', label: 'Race', type: 'dropdown', category: 'personal-info', isAdvanced: true, options: ['Chinese', 'Malay', 'Indian', 'Others'] },
  { name: 'religion', label: 'Religion', type: 'dropdown', category: 'personal-info', isAdvanced: true, options: ['Buddhism', 'Christianity', 'Hinduism', 'Islam', 'Other'] },
  { name: 'nric', label: 'NRIC/FIN', type: 'text', category: 'personal-info', isAdvanced: true },
  { name: 'profile_photo', label: 'Profile Photo', type: 'upload', category: 'personal-info', isAdvanced: true },
  { name: 'personal_info_open_1', label: 'Additional Info', type: 'text', category: 'personal-info', isAdvanced: true },

  // Employment Info - Basic
  { name: 'job_title', label: 'Job Title', type: 'text', category: 'employment-info', isAdvanced: false },
  { name: 'department', label: 'Department', type: 'dropdown', category: 'employment-info', isAdvanced: false },
  { name: 'employment_type', label: 'Employment Type', type: 'dropdown', category: 'employment-info', isAdvanced: false, options: ['Full-time', 'Part-time', 'Contract', 'Intern'] },
  { name: 'date_of_hire', label: 'Date of Hire', type: 'date', category: 'employment-info', isAdvanced: false },
  { name: 'supervisor', label: 'Supervisor', type: 'text', category: 'employment-info', isAdvanced: false },
  { name: 'employment_status', label: 'Employment Status', type: 'dropdown', category: 'employment-info', isAdvanced: false, options: ['Active', 'On Leave', 'Resigned', 'Terminated'] },

  // Employment Info - Advanced
  { name: 'confirmation_date', label: 'Confirmation Date', type: 'date', category: 'employment-info', isAdvanced: true },
  { name: 'probation_end', label: 'Probation End Date', type: 'date', category: 'employment-info', isAdvanced: true },
  { name: 'job_grade', label: 'Job Grade / Level', type: 'text', category: 'employment-info', isAdvanced: true },
  { name: 'employee_code', label: 'Employee Code', type: 'text', category: 'employment-info', isAdvanced: true },
  { name: 'employment_info_open_2', label: 'Additional Info 1', type: 'text', category: 'employment-info', isAdvanced: true },
  { name: 'employment_info_open_3', label: 'Additional Info 2', type: 'text', category: 'employment-info', isAdvanced: true },

  // Contract & Lifecycle - Basic
  { name: 'contract_type', label: 'Contract Type', type: 'dropdown', category: 'contract-lifecycle', isAdvanced: false, options: ['Permanent', 'Contract', 'Freelance'] },
  { name: 'contract_start', label: 'Contract Start Date', type: 'date', category: 'contract-lifecycle', isAdvanced: false },
  { name: 'work_hours', label: 'Work Hours / Week', type: 'number', category: 'contract-lifecycle', isAdvanced: false },
  { name: 'work_pass_type', label: 'Work Pass Type', type: 'dropdown', category: 'contract-lifecycle', isAdvanced: false, options: ['EP', 'SP', 'WP', 'DP', 'LTVP', 'None'] },
  { name: 'work_pass_number', label: 'Work Pass Number', type: 'text', category: 'contract-lifecycle', isAdvanced: false },
  { name: 'work_pass_expiry', label: 'Work Pass Expiry', type: 'date', category: 'contract-lifecycle', isAdvanced: false },

  // Contract & Lifecycle - Advanced
  { name: 'contract_end', label: 'Contract End Date', type: 'date', category: 'contract-lifecycle', isAdvanced: true },
  { name: 'notice_period', label: 'Notice Period (Days)', type: 'number', category: 'contract-lifecycle', isAdvanced: true },
  { name: 'resignation_date', label: 'Resignation Date', type: 'date', category: 'contract-lifecycle', isAdvanced: true },
  { name: 'last_working_day', label: 'Last Working Day', type: 'date', category: 'contract-lifecycle', isAdvanced: true },
  { name: 'exit_reason', label: 'Exit Reason', type: 'text', category: 'contract-lifecycle', isAdvanced: true },
  { name: 'rehire_eligibility', label: 'Rehire Eligibility', type: 'dropdown', category: 'contract-lifecycle', isAdvanced: true, options: ['Yes', 'No'] },

  // Compensation & Benefits - Basic
  { name: 'gross_salary', label: 'Monthly Gross Salary', type: 'number', category: 'compensation-benefits', isAdvanced: false },
  { name: 'basic_salary', label: 'Basic Salary', type: 'number', category: 'compensation-benefits', isAdvanced: false },
  { name: 'cpf_contribution', label: 'CPF Contribution', type: 'boolean', category: 'compensation-benefits', isAdvanced: false },
  { name: 'allowances', label: 'Allowances', type: 'number', category: 'compensation-benefits', isAdvanced: false },
  { name: 'bonus_eligible', label: 'Bonus Eligibility', type: 'dropdown', category: 'compensation-benefits', isAdvanced: false, options: ['Yes', 'No'] },
  { name: 'payroll_cycle', label: 'Payroll Cycle', type: 'dropdown', category: 'compensation-benefits', isAdvanced: false, options: ['Monthly', 'Biweekly'] },

  // Compensation & Benefits - Advanced
  { name: 'bank_account', label: 'Bank Account Number', type: 'text', category: 'compensation-benefits', isAdvanced: true },
  { name: 'bank_name', label: 'Bank Name', type: 'dropdown', category: 'compensation-benefits', isAdvanced: true, options: ['DBS', 'OCBC', 'UOB', 'Other'] },
  { name: 'pay_mode', label: 'Pay Mode', type: 'dropdown', category: 'compensation-benefits', isAdvanced: true, options: ['GIRO', 'Cheque', 'Cash'] },
  { name: 'ot_eligible', label: 'Overtime Eligibility', type: 'dropdown', category: 'compensation-benefits', isAdvanced: true, options: ['Yes', 'No'] },
  { name: 'annual_bonus_eligible', label: 'Annual Bonus Eligibility', type: 'dropdown', category: 'compensation-benefits', isAdvanced: true, options: ['Yes', 'No'] },
  { name: 'benefits_tier', label: 'Benefits Tier', type: 'dropdown', category: 'compensation-benefits', isAdvanced: true, options: ['Tier 1', 'Tier 2', 'Tier 3'] },

  // Compliance - Basic
  { name: 'cpf_status', label: 'CPF Status', type: 'dropdown', category: 'compliance', isAdvanced: false, options: ['Contributing', 'Exempted'] },
  { name: 'tax_file_no', label: 'Income Tax File No.', type: 'text', category: 'compliance', isAdvanced: false },
  { name: 'mom_status', label: 'MOM Work Pass Status', type: 'dropdown', category: 'compliance', isAdvanced: false, options: ['Compliant', 'Non-compliant'] },
  { name: 'ns_status', label: 'NS Status', type: 'dropdown', category: 'compliance', isAdvanced: false, options: ['Not Applicable', 'Completed', 'Reservist', 'Exempted'] },
  { name: 'skillsfuture_eligible', label: 'SkillsFuture Eligible', type: 'dropdown', category: 'compliance', isAdvanced: false, options: ['Yes', 'No'] },
  { name: 'has_dependants', label: 'Dependant Pass', type: 'dropdown', category: 'compliance', isAdvanced: false, options: ['Yes', 'No'] },

  // Compliance - Advanced
  { name: 'tax_residency', label: 'Tax Residency', type: 'dropdown', category: 'compliance', isAdvanced: true, options: ['Resident', 'Non-Resident'] },
  { name: 'ir8a_required', label: 'IR8A Required', type: 'dropdown', category: 'compliance', isAdvanced: true, options: ['Yes', 'No'] },
  { name: 'cpf_submission_number', label: 'CPF Submission Number', type: 'text', category: 'compliance', isAdvanced: true },
  { name: 'cpf_account', label: 'Employer CPF Account', type: 'text', category: 'compliance', isAdvanced: true },
  { name: 'leave_category', label: 'Leave Compliance Category', type: 'dropdown', category: 'compliance', isAdvanced: true, options: ['Category 1', 'Category 2', 'Category 3'] },
  { name: 'disciplinary_flags', label: 'Disciplinary Flags', type: 'boolean', category: 'compliance', isAdvanced: true },

  // Other (for legacy or non-categorized fields)
  { name: 'notes', label: 'Notes', type: 'text', category: 'other', isAdvanced: false },
];

export const nestedFieldMap: Record<keyof Omit<EmployeeFormData, 'employee'>, FieldMeta[]> = {
  allowances: [
    { name: 'allowance_type', label: 'Allowance Type', type: 'text', category: 'Allowances', isNested: true, nestedType: 'allowances' },
    { name: 'amount', label: 'Allowance Amount', type: 'number', category: 'Allowances', isNested: true, nestedType: 'allowances' },
  ],
  familyMembers: [
    { name: 'name', label: 'Family Member Name', type: 'text', category: 'Family', isNested: true, nestedType: 'familyMembers' },
    { name: 'relationship', label: 'Relationship', type: 'text', category: 'Family', isNested: true, nestedType: 'familyMembers' },
  ],
  education: [
    { name: 'institute_name', label: 'Institute', type: 'text', category: 'Education', isNested: true, nestedType: 'education' },
    { name: 'qualification', label: 'Qualification', type: 'text', category: 'Education', isNested: true, nestedType: 'education' },
  ],
  workExperience: [
    { name: 'company_name', label: 'Company Name', type: 'text', category: 'Experience', isNested: true, nestedType: 'workExperience' },
    { name: 'job_title', label: 'Position', type: 'text', category: 'Experience', isNested: true, nestedType: 'workExperience' },
  ],
  appraisalRatings: [
    { name: 'appraisal_type', label: 'Appraisal Type', type: 'text', category: 'Appraisal', isNested: true, nestedType: 'appraisalRatings' },
    { name: 'rating', label: 'Rating', type: 'text', category: 'Appraisal', isNested: true, nestedType: 'appraisalRatings' },
  ],
  documents: [
    { name: 'name', label: 'Document Name', type: 'text', category: 'Documents', isNested: true, nestedType: 'documents' },
    { name: 'type', label: 'Document Type', type: 'text', category: 'Documents', isNested: true, nestedType: 'documents' },
  ],
};

export const getFlatEmployeeFormFields = (): FieldMeta[] => {
  const baseFields = [...employeeBaseFields];
  Object.values(nestedFieldMap).forEach(fieldGroup => {
    baseFields.push(...fieldGroup);
  });
  return baseFields;
};

export const standardizeEmployee = (employee: Partial<Employee>): Employee => {
  const standardized: Partial<Employee> = { ...employee };
  ['gross_salary', 'basic_salary', 'allowances', 'work_hours', 'notice_period'].forEach(field => {
    const value = (employee as any)[field];
    if (value !== undefined && value !== null) {
      if (typeof value === 'string' && !isNaN(Number(value))) {
        (standardized as any)[field] = Number(value);
      }
    }
  });
  ['cpf_contribution', 'disciplinary_flags', 'must_clock', 'all_work_day', 
   'freeze_payment', 'paid_medical_examination_fee', 'new_graduate', 
   'rehire', 'contract_signed', 'thirteenth_month_entitlement'].forEach(field => {
    const value = (employee as any)[field];
    if (value !== undefined) {
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        if (['yes', 'true', '1', 'y', 't'].includes(lowerValue)) {
          (standardized as any)[field] = true;
        } else if (['no', 'false', '0', 'n', 'f'].includes(lowerValue)) {
          (standardized as any)[field] = false;
        }
      }
    }
  });
  return {
    id: '',
    user_id: '',
    email: '',
    full_name: '',
    ...standardized,
  };
};

export const fullEmployeeFieldList = getFlatEmployeeFormFields();

export const getFieldMetaByName = (name: string): FieldMeta | undefined => {
  return getFlatEmployeeFormFields().find(f => f.name === name);
};

export const getEmployeeFieldsByCategory = (category: string): FieldMeta[] => {
  return employeeBaseFields.filter(field => field.category === category);
};

export const getAllCategories = (): string[] => {
  const categories = employeeBaseFields.map(field => field.category);
  return [...new Set(categories)];
};

export const getFieldsByCategory = (category: string): FieldMeta[] => {
  return employeeBaseFields.filter(field => field.category === category);
};

export const convertFieldValue = (field: FieldMeta, rawValue: any): any => {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return null;
  }

  try {
    switch (field.type) {
      case 'number':
        if (typeof rawValue === 'string' && 
            (rawValue.toLowerCase() === 'yes' || 
             rawValue.toLowerCase() === 'no' || 
             rawValue.toLowerCase() === 'true' || 
             rawValue.toLowerCase() === 'false')) {
          return null;
        }
        const num = Number(rawValue);
        return isNaN(num) ? null : num;
      
      case 'boolean':
        if (typeof rawValue === 'boolean') return rawValue;
        if (typeof rawValue === 'string') {
          const lower = rawValue.toLowerCase();
          if (['yes', 'true', '1', 'y'].includes(lower)) return true;
          if (['no', 'false', '0', 'n'].includes(lower)) return false;
        }
        return null;
      
      case 'date':
        if (rawValue instanceof Date) return rawValue.toISOString().split('T')[0];
        try {
          const date = new Date(rawValue);
          return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : null;
        } catch (e) {
          return null;
        }
      
      default:
        return String(rawValue);
    }
  } catch (error) {
    console.error(`Error converting field ${field.name}:`, error);
    return null;
  }
};
