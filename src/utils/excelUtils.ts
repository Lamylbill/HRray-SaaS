import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  Employee,
  EmployeeFormData,
  EmployeeFamilyMember,
  EmployeeEducation,
  EmployeeWorkExperience,
  EmployeeAppraisalRating
} from '@/types/employee';
import {
  fullEmployeeFieldList,
  getFieldMetaByName
} from './employeeFieldUtils';
import { stringToBoolean } from './formatters';

export const allowedEmployeeFields = fullEmployeeFieldList.filter(field =>
  !field.name.startsWith('allowance_') &&
  !field.name.startsWith('document_') &&
  !field.name.startsWith('family_member_') &&
  !field.name.startsWith('qualification') &&
  !field.name.startsWith('relationship') &&
  !field.name.startsWith('rating') &&
  !field.name.startsWith('company_name') &&
  !field.name.startsWith('institute') &&
  !field.name.startsWith('position') &&
  !field.name.startsWith('appraisal_type')
);

export const exportEmployeesToExcel = async (employees: Employee[]): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Employees');

  worksheet.addRow(allowedEmployeeFields.map(f => f.name));

  for (const employee of employees) {
    const row = allowedEmployeeFields.map(field => (employee as Record<string, unknown>)[field.name] ?? '');
    worksheet.addRow(row);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    'employees.xlsx'
  );
};

export const generateEmployeeTemplate = async (): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Employee Template');

  worksheet.addRow(allowedEmployeeFields.map(f => f.name));

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    'employee_template.xlsx'
  );
};

export const convertFieldValue = (field: Record<string, unknown>, rawValue: unknown): unknown => {
  if (rawValue === undefined || rawValue === null || rawValue === '') return null;

  try {
    switch (field.type) {
      case 'number': {
        if (field.name === 'annual_bonus_eligible') {
          if (typeof rawValue === 'string') {
            const val = rawValue.trim().toLowerCase();
            if (val === 'yes') return 1;
            if (val === 'no') return 0;
            if (!isNaN(Number(val))) return Number(val);
            return null;
          }
          if (typeof rawValue === 'number' && (rawValue === 0 || rawValue === 1)) return rawValue;
          return null;
        }
        if (typeof rawValue === 'string' && ['yes', 'no', 'true', 'false'].includes(rawValue.toLowerCase())) {
          return rawValue;
        }
        const num = Number(rawValue);
        return isNaN(num) ? null : num;
      }

      case 'boolean':
        return stringToBoolean(rawValue as string);

      case 'date':
        // exceljs returns Date objects directly for Excel date cells
        if (rawValue instanceof Date) return rawValue.toISOString().split('T')[0];
        if (typeof rawValue === 'string') {
          const date = new Date(rawValue);
          return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : null;
        }
        return null;

      case 'dropdown':
        return String(rawValue);

      default:
        return String(rawValue);
    }
  } catch (error) {
    console.error(`Error converting value ${String(rawValue)} for field ${String(field.name)}:`, error);
    return null;
  }
};

export const parseEmployeeDataFromExcel = (
  headerRow: unknown[],
  dataRow: unknown[]
): { employee: Partial<Employee> } => {
  const employee: Partial<Employee> = {};

  headerRow.forEach((header, index) => {
    if (!header || typeof header !== 'string') return;
    if (header.includes('---')) return;

    const field = fullEmployeeFieldList.find(f => f.name === header);
    if (field && index < dataRow.length) {
      const rawValue = dataRow[index];
      if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
        try {
          const fieldMeta = getFieldMetaByName(field.name);
          const convertedValue = convertFieldValue(
            (fieldMeta || field) as Record<string, unknown>,
            rawValue
          );
          if (convertedValue !== null) {
            (employee as Record<string, unknown>)[field.name] = convertedValue;
          }
        } catch (error) {
          console.error(`Error converting field ${field.name}:`, error);
        }
      }
    }
  });

  return { employee };
};

export const processEmployeeImport = async (file: File): Promise<{ employee: Partial<Employee> }[]> => {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('Invalid template format or empty file');

  // exceljs row.values is 1-indexed — slice(1) to normalise to 0-indexed
  const rows: unknown[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    rows.push((row.values as unknown[]).slice(1));
  });

  if (rows.length < 2) throw new Error('Invalid template format or empty file');

  const headerRow = rows[0];
  const employeeForms: { employee: Partial<Employee> }[] = [];

  for (let i = 1; i < rows.length; i++) {
    const dataRow = rows[i];
    if (!dataRow?.length || !dataRow.some(cell => cell !== null && cell !== undefined && cell !== '')) {
      continue;
    }

    try {
      const parsed = parseEmployeeDataFromExcel(headerRow, dataRow);
      if (parsed.employee) {
        const fullName = parsed.employee.full_name;
        const email = parsed.employee.email;
        if (typeof fullName === 'string' && fullName.trim() !== '' && typeof email === 'string' && email.trim() !== '') {
          employeeForms.push(parsed);
        } else {
          console.warn(`Skipping row ${i}: missing full_name or email (full_name: ${String(fullName)}, email: ${String(email)})`);
        }
      }
    } catch (error) {
      console.error(`Error processing row ${i}:`, error);
    }
  }

  return employeeForms;
};
