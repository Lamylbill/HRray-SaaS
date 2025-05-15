
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined in the environment variables.');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in the environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
