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
  const { session, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Error during login:', error);
    return null;
  }

  if (session) {
    localStorage.setItem('jwt_token', session.access_token);
    return session.access_token;
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

// Fetch protected data example
export const fetchProtectedData = async (jwt: string) => {
  const { data, error } = await supabase
    .from('your_table') // Replace with your table
    .select('*')
    .auth(jwt);

  if (error) {
    console.error('Error fetching protected data:', error);
    return null;
  }

  return data;
};

// Ensure storage bucket exists
export const ensureStorageBucket = async (bucketName: string) => {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);
    if (error) throw error;

    if (!data) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
      });
      if (createError) throw createError;
    }

    return true;
  } catch (error) {
    console.error('Error ensuring storage bucket:', error);
    return false;
  }
};
