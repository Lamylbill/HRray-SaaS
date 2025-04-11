import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Your Supabase URL and Public Key
const SUPABASE_URL = 'https://ezvdmuahwliqotnbocdd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dmRtdWFod2xpcW90bmJvY2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMjAzMTksImV4cCI6MjA1Nzc5NjMxOX0.NjZ8o0b71gTScc2B2yoB_dNzDXHZrV8RP1T13WX2I3U'; // Replace with actual key

// Initialize the Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true, // Keep session across browser refresh
  },
  global: {
    headers: {
      'x-application-name': 'HRFlow',
    },
  },
});

// Define and export the storage bucket name
export const STORAGE_BUCKET = 'your-bucket-name'; // Replace 'your-bucket-name' with your actual bucket name

// User login function to fetch JWT
export const login = async (email: string, password: string): Promise<string | null> => {
  const { user, session, error } = await supabase.auth.signIn({
    email,
    password,
  });

  if (error) {
    console.error('Error during login:', error);
    return null;
  }

  // Store JWT token (session.access_token)
  if (session) {
    localStorage.setItem('jwt_token', session.access_token); // Storing JWT in localStorage
    return session.access_token;
  }
  return null;
};

// Fetch protected data using JWT token
export const fetchProtectedData = async (jwt: string) => {
  const { data, error } = await supabase
    .from('your_table') // Replace with your actual table
    .select('*')
    .auth(jwt);

  if (error) {
    console.error('Error fetching protected data:', error);
    return null;
  }

  return data;
};

// Logout function to clear JWT token
export const logout = () => {
  localStorage.removeItem('jwt_token'); // Clear JWT from storage
  console.log('User logged out');
};

// Get currently authenticated user
export const getCurrentUser = () => {
  return supabase.auth.user();
};

// Get the JWT token (if any) from localStorage
export const getJwtToken = () => {
  return localStorage.getItem('jwt_token');
};

// Function to ensure the storage bucket exists
export const ensureStorageBucket = async (bucketName: string) => {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);
    if (error) throw error;

    if (!data) {
      const { error: createError } = await supabase.storage.createBucket(bucketName);
      if (createError) throw createError;
    }
    return true;
  } catch (error) {
    console.error('Error ensuring storage bucket:', error);
    return false;
  }
};

export { ensureStorageBucket };
