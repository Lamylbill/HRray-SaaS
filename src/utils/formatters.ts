// Add any existing formatters from the current file

/**
 * Formats a date object to a string in the format "MM/DD/YYYY"
 */
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    return '';
  }
  
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const year = d.getFullYear();
  
  return `${month}/${day}/${year}`;
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number | string | null | undefined, currency = 'SGD'): string => {
  if (amount === null || amount === undefined || amount === '') {
    return '';
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '';
  }
  
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

/**
 * Converts string representations of boolean values to actual boolean values
 */
export const stringToBoolean = (value: any): boolean | null => {
  // Return null for undefined or null values
  if (value === undefined || value === null) {
    return null;
  }
  
  // If it's already a boolean, return it
  if (typeof value === 'boolean') {
    return value;
  }
  
  // Normalize strings that are "true" or "false" (case insensitive)
  if (typeof value === 'string') {
    const strValue = value.toLowerCase().trim();
    
    // Check for various "true" strings
    if (['yes', 'true', '1', 'y', 't'].includes(strValue)) {
      return true;
    }
    
    // Check for various "false" strings
    if (['no', 'false', '0', 'n', 'f'].includes(strValue)) {
      return false;
    }
  }
  
  // Handle numeric values
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  // Return null for any other values
  return null;
};

/**
 * Returns a string representation of a boolean value
 */
export const booleanToString = (value: boolean | null | undefined): string => {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return '';
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phoneNumber: string | null | undefined): string => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Singapore phone number formatting
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  }
  
  // With country code
  if (cleaned.length > 8) {
    const countryCode = cleaned.slice(0, cleaned.length - 8);
    const mainNumber = cleaned.slice(-8);
    return `+${countryCode} ${mainNumber.slice(0, 4)} ${mainNumber.slice(4)}`;
  }
  
  // For other formats, just return cleaned
  return cleaned;
};

/**
 * Format the employee name with proper title case
 */
export const formatEmployeeName = (name: string | null | undefined): string => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Convert text to title case
 */
export const toTitleCase = (text: string | null | undefined): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Truncate text to a specific length
 */
export const truncateText = (text: string | null | undefined, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format file size in bytes to human-readable format
 */
export const formatFileSize = (bytes: number | null | undefined): string => {
  if (bytes === null || bytes === undefined) return '';
  
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatSalary = (amount: number | string | null | undefined, currency = 'SGD'): string => {
  return formatCurrency(amount, currency);
};

/**
 * Get initials from a name or email
 */
export const getInitials = (nameOrEmail: string | null | undefined): string => {
  if (!nameOrEmail) return '';
  
  // If it looks like an email, get initials from the part before @
  if (nameOrEmail.includes('@')) {
    const emailPart = nameOrEmail.split('@')[0];
    return emailPart.substring(0, 2).toUpperCase();
  }
  
  // Otherwise treat as name and get initials
  const names = nameOrEmail.trim().split(' ');
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase();
  }
  
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};
