// src/utils/formatters.ts

// Define a User type that matches the structure from your useAuth() hook
// This is crucial for type safety and clarity
interface User {
  id?: string;
  email?: string;
  user_metadata?: {
    full_name?: string | null;
    avatar_url?: string | null;
    // any other relevant metadata fields
  };
  // any other top-level user properties
}

/**
 * Retrieves the user's avatar URL from user_metadata.
 */
export const getUserAvatar = (user: User | null | undefined): string | null => {
  return user?.user_metadata?.avatar_url || null;
};

/**
 * Generates initials from the user's full name or email.
 * Prioritizes full_name from user_metadata.
 */
export const getUserInitials = (user: User | null | undefined): string => {
  if (user?.user_metadata?.full_name) {
    const fullName = user.user_metadata.full_name.trim();
    if (fullName) {
      const names = fullName.split(' ');
      if (names.length === 1 && names[0].length > 0) { // Single name
        return names[0].substring(0, Math.min(2, names[0].length)).toUpperCase();
      }
      if (names.length >= 2) { // First and Last name
        const firstInitial = names[0][0];
        const lastInitial = names[names.length - 1][0];
        if (firstInitial && lastInitial) {
          return `${firstInitial}${lastInitial}`.toUpperCase();
        }
        if (firstInitial) { // Fallback if last initial is missing (e.g. trailing space made an empty last name)
            return firstInitial.toUpperCase();
        }
      }
    }
  }
  // Fallback to email if full_name is not useful
  if (user?.email) {
    const emailPrefix = user.email.split('@')[0];
    if (emailPrefix.length >= 2) {
      return emailPrefix.substring(0, 2).toUpperCase();
    }
    if (emailPrefix.length === 1) {
        return emailPrefix[0].toUpperCase();
    }
  }
  return 'U'; // Default fallback
};


// Your existing formatters:

/**
 * Formats a date object to a string in the format "MM/DD/YYYY"
 * (Consider if you want to keep this or use the one from LeaveRecordsView: 'en-SG', { month: 'short', ... })
 */
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A'; // Return N/A for clarity if date is missing
  
  let d: Date;
  if (typeof date === 'string') {
    // Attempt to parse ISO strings or common date formats robustly
    d = new Date(date.includes('T') ? date : date.replace(/-/g, '/'));
  } else {
    d = date;
  }
  
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    console.warn("formatDate: Invalid date received", date);
    return 'Invalid Date';
  }
  
  // Using toLocaleDateString for more flexibility and locale-awareness if needed
  // For "MM/DD/YYYY", we can still build it manually for consistency if required.
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
    return ''; // Or 'N/A', or format specific like "$0.00"
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return ''; // Or 'Invalid Amount'
  }
  
  return new Intl.NumberFormat('en-SG', { // Using en-SG as per your location
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
  if (value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const strValue = value.toLowerCase().trim();
    if (['yes', 'true', '1', 'y', 't'].includes(strValue)) return true;
    if (['no', 'false', '0', 'n', 'f'].includes(strValue)) return false;
  }
  if (typeof value === 'number') return value !== 0;
  return null;
};

/**
 * Returns a string representation of a boolean value
 */
export const booleanToString = (value: boolean | null | undefined, trueString = 'Yes', falseString = 'No', nullUndefinedString = ''): string => {
  if (value === true) return trueString;
  if (value === false) return falseString;
  return nullUndefinedString;
};

/**
 * Format phone number for display (Singapore context)
 */
export const formatPhoneNumber = (phoneNumber: string | null | undefined): string => {
  if (!phoneNumber) return '';
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Basic Singapore phone number formatting (8 digits)
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  }
  // With +65 country code
  if (cleaned.startsWith('65') && cleaned.length === 10) {
    const localPart = cleaned.slice(2);
    return `+65 ${localPart.slice(0, 4)} ${localPart.slice(4)}`;
  }
  // If it already has +65 and space
  if (phoneNumber.startsWith('+65 ') && cleaned.length === 10) {
     return phoneNumber; // Assume already formatted
  }
  return phoneNumber; // Return original or cleaned if not matching typical SG formats
};

/**
 * Format the employee name with proper title case (already good)
 */
export const formatEmployeeName = (name: string | null | undefined): string => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Convert text to title case (already good)
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
 * Truncate text to a specific length (already good)
 */
export const truncateText = (text: string | null | undefined, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format file size in bytes to human-readable format (already good)
 */
export const formatFileSize = (bytes: number | null | undefined): string => {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return ''; // Added NaN check
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i < 0 || i >= sizes.length) return bytes + ' Bytes'; // Fallback for very small/large numbers
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};


/**
 * Get initials from a name or email - refined version, can be used as a general utility.
 * getUserInitials above is more specific to the user object structure.
 * You can choose which one to keep or rename getUserInitials to getAuthUserInitials.
 */
export const getInitials = (nameOrEmail: string | null | undefined): string => {
  if (!nameOrEmail || nameOrEmail.trim() === '') return 'U';
  
  const trimmedInput = nameOrEmail.trim();

  if (trimmedInput.includes('@')) {
    const emailPart = trimmedInput.split('@')[0];
    if (emailPart.length >= 2) return emailPart.substring(0, 2).toUpperCase();
    if (emailPart.length === 1) return emailPart[0].toUpperCase();
    return 'U';
  }
  
  const names = trimmedInput.split(' ').filter(Boolean); // Filter out empty strings from multiple spaces
  if (names.length === 0) return 'U';
  if (names.length === 1) {
    return names[0].substring(0, Math.min(2, names[0].length)).toUpperCase();
  }
  // First letter of first name and first letter of last name
  const firstInitial = names[0][0];
  const lastInitial = names[names.length - 1][0];
  if (firstInitial && lastInitial) {
      return `${firstInitial}${lastInitial}`.toUpperCase();
  }
  if (firstInitial) { // Fallback if only one name part somehow (e.g. "John ")
      return firstInitial.toUpperCase();
  }
  return 'U';
};