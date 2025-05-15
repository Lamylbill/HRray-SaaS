
import { createClient } from '@supabase/supabase-js';

// In Vite, we use import.meta.env instead of process.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback to hardcoded values if env variables aren't set (development only)
const fallbackUrl = 'https://ezvdmuahwliqotnbocdd.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dmRtdWFod2xpcW90bmJvY2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMjAzMTksImV4cCI6MjA1Nzc5NjMxOX0.NjZ8o0b71gTScc2B2yoB_dNzDXHZrV8RP1T13WX2I3U';

// Use fallbacks if env variables aren't set
const finalSupabaseUrl = supabaseUrl || fallbackUrl;
const finalSupabaseAnonKey = supabaseAnonKey || fallbackKey;

console.log('Supabase URL:', finalSupabaseUrl);
console.log('Using env variables:', !!supabaseUrl);

export const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey);

// Instead of returning a Promise, we're returning the client directly
export function getAuthorizedClient() {
  // Since we're no longer using next-auth, we'll just use the anon key for now
  return supabase;
}

export async function ensureStorageBucket(bucketName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .storage
      .createBucket(bucketName, { public: false });

    if (error) {
      if (error.message.includes('already exists')) {
        console.warn(`Bucket "${bucketName}" already exists.`);
        return true;
      } else {
        console.error(`Error creating bucket "${bucketName}":`, error);
        return false;
      }
    } else {
      console.log(`Bucket "${bucketName}" created successfully:`, data);
      return true;
    }
  } catch (err) {
    console.error('Error ensuring storage bucket:', err);
    return false;
  }
}

// Storage bucket constants
export const STORAGE_BUCKET = 'employee-documents';
export const AVATAR_BUCKET = 'employee-avatars';
