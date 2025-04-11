import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ezvdmuahwliqotnbocdd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dmRtdWFod2xpcW90bmJvY2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMjAzMTksImV4cCI6MjA1Nzc5NjMxOX0.NjZ8o0b71gTScc2B2yoB_dNzDXHZrV8RP1T13WX2I3U";

// Initialize Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true, // Keep the session persistent
  },
  global: {
    headers: {
      'x-application-name': 'HRFlow', // Optional: Set a custom header
    },
  },
});

// Login function to get JWT token
export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Error logging in:", error.message);
    return null;
  }

  return data?.session?.access_token;  // Return the JWT token
};

// Logout function
export const logout = async () => {
  await supabase.auth.signOut();
};

// Function to fetch protected data with JWT token
export const fetchProtectedData = async (jwt: string) => {
  const { data, error } = await supabase
    .from("your_table") // Replace "your_table" with your table name
    .select("*")
    .single()
    .auth(jwt); // Attach the JWT token to the request

  if (error) {
    console.error("Error fetching protected data:", error.message);
    return null;
  }

  return data;
};

// Example function to use the JWT and fetch data
export const fetchDataWithJwt = async () => {
  const jwt = await login("email@example.com", "password"); // Replace with actual login credentials

  if (!jwt) {
    console.error("Failed to retrieve JWT");
    return;
  }

  const result = await fetchProtectedData(jwt);
  console.log("Protected data:", result);
};
