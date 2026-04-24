
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getAuthorizedClient() {
  return supabase;
}

export async function ensureStorageBucket(bucketName: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.createBucket(bucketName, { public: false });
    if (error) {
      if (error.message.includes('already exists')) return true;
      console.error(`Error creating bucket "${bucketName}":`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error ensuring storage bucket:', err);
    return false;
  }
}

export const STORAGE_BUCKET = 'employee-documents';
export const AVATAR_BUCKET = 'employee-avatars';
