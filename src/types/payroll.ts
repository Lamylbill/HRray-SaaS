export interface PayrollPeriod {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  payment_date: string;
  status: PayrollPeriodStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type PayrollPeriodStatus = 'Draft' | 'Processing' | 'Completed' | 'Verified';

export interface PayrollItem {
  id: string;
  payroll_period_id: string;
  employee_id: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  employee_cpf: number;
  employer_cpf: number;
  sdl: number;
  sinda: number;
  cdac: number;
  mbmf: number;
  gross_pay: number;
  net_pay: number;
  remarks?: string;
  status: PayrollItemStatus;
  created_at: string;
  updated_at: string;
}

export type PayrollItemStatus = 'Draft' | 'Calculated' | 'Approved' | 'Paid';

export interface PayrollAllowanceItem {
  id: string;
  payroll_item_id: string;
  allowance_type: string;
  amount: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollDeductionItem {
  id: string;
  payroll_item_id: string;
  deduction_type: string;
  amount: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface BankTemplate {
  id: string;
  bank_name: string;
  template_name: string;
  file_path: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollExport {
  id: string;
  payroll_period_id: string;
  export_type: 'Bank' | 'CPF' | 'IRAS';
  file_path: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  full_name: string;
  job_title?: string;
  department?: string;
  email: string;
  basic_salary?: number;
  allowances?: number;
}

export interface CpfContribution {
  employee: number;
  employer: number;
  total: number;
}

export interface BankFileFormat {
  bank: string;
  format: string;
  description: string;
}
