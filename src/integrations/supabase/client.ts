
// src/integrations/supabase/client.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase credentials
const SUPABASE_URL = 'https://ezvdmuahwliqotnbocdd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dmRtdWFod2xpcW90bmJvY2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMjAzMTksImV4cCI6MjA1Nzc5NjMxOX0.NjZ8o0b71gTScc2B2yoB_dNzDXHZrV8RP1T13WX2I3U';

// Initialize Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
  },
  global: {
    headers: {
      'x-application-name': 'HRFlow',
    },
  },
});

// Define your storage buckets
export const AVATAR_BUCKET = 'avatars';
export const STORAGE_BUCKET = 'employee-documents'; // Update with your bucket name

// Login function - fetch JWT
export const login = async (email: string, password: string): Promise<string | null> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Error during login:', error);
    return null;
  }

  if (data.session) {
    localStorage.setItem('jwt_token', data.session.access_token);
    return data.session.access_token;
  }

  return null;
};

// Logout
export const logout = () => {
  localStorage.removeItem('jwt_token');
  console.log('User logged out');
};

// Get current user
export const getCurrentUser = () => {
  return supabase.auth.getUser();
};

// Get stored JWT token
export const getJwtToken = () => {
  return localStorage.getItem('jwt_token');
};

// Create a function to get an authorized Supabase client with JWT
export const getAuthorizedClient = () => {
  const token = localStorage.getItem('jwt_token');
  
  if (!token) {
    return supabase; // Return the default client if no token
  }
  
  // Create a new client with the token in the headers for this session
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-application-name': 'HRFlow',
      },
    },
    auth: {
      persistSession: true,
    },
  });
};

// Define a typed helper function for leave requests
export const getLeaveRequestsTable = (client = supabase) => {
  return client.from('leave_requests');
};

// Define a typed helper function for leave requests with employee and leave type info
export const getLeaveRequestsWithEmployeeInfo = (client = supabase) => {
  return client
    .from('leave_requests')
    .select(`
      id,
      employee_id,
      start_date,
      end_date,
      status,
      half_day,
      half_day_type,
      created_at,
      leave_types(id, name, color)
    `);
};

// Fetch protected data example - using proper authorization
export const fetchProtectedData = async () => {
  const authorizedClient = getAuthorizedClient();
  
  const { data, error } = await authorizedClient
    .from('employees_with_documents') // Updated to a known table instead of generic 'your_table'
    .select('*');

  if (error) {
    console.error('Error fetching protected data:', error);
    return null;
  }

  return data;
};

// Ensure storage bucket exists - improved with better error handling and retries
export const ensureStorageBucket = async (bucketName: string): Promise<boolean> => {
  try {
    console.log(`Checking if bucket ${bucketName} exists...`);
    const client = getAuthorizedClient();
    
    // First check if bucket already exists
    const { data: existingBuckets, error: listError } = await client.storage.listBuckets();
    
    if (listError) {
      console.error('Error checking storage buckets:', listError);
      return false;
    }
    
    // Check if our bucket already exists
    const bucketExists = existingBuckets?.some(bucket => bucket.name === bucketName || bucket.id === bucketName);
    
    if (bucketExists) {
      console.log(`Bucket ${bucketName} already exists`);
      return true;
    }
    
    // Try to create the bucket if it doesn't exist
    console.log(`Creating bucket ${bucketName}...`);
    const { data: newBucket, error: createError } = await client.storage.createBucket(bucketName, {
      public: false, // Keep it private for security
      fileSizeLimit: 20971520, // 20MB
      allowedMimeTypes: [
        'image/png', 
        'image/jpeg', 
        'application/pdf', 
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
    });
    
    if (createError) {
      // Check if the error suggests the bucket might actually exist already despite the list call not finding it
      if (createError.message?.includes('already exists')) {
        console.log(`Bucket ${bucketName} apparently already exists despite list not finding it`);
        return true;
      }
      
      console.error('Error creating storage bucket:', createError);
      return false;
    }
    
    console.log(`Successfully created bucket: ${bucketName}`);
    
    // Verify we can access the newly created bucket
    try {
      const { data, error } = await client.storage.from(bucketName).list('', { limit: 1 });
      if (error) {
        console.error('Error accessing new bucket:', error);
        return false;
      }
      console.log('Successfully accessed newly created bucket');
      return true;
    } catch (error) {
      console.error('Error verifying bucket access:', error);
      return false;
    }
  } catch (error) {
    console.error('Unexpected error ensuring storage bucket exists:', error);
    return false;
  }
};
