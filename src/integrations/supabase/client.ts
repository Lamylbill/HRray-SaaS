import { createClient } from '@supabase/supabase-js';
import { getSession } from 'next-auth/react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined in the environment variables.');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in the environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getAuthorizedClient() {
  const session = await getSession();

  if (!session?.supabaseAccessToken) {
    console.warn('No Supabase access token found in session. Using anon key.');
    return supabase;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${session.supabaseAccessToken}`,
      },
    },
  });
}

export async function ensureStorageBucket(bucketName: string): Promise<boolean> {
  try {
    const authorizedClient = getAuthorizedClient();
    const { data, error } = await authorizedClient
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

// Make sure the STORAGE_BUCKET constant is exported
export const STORAGE_BUCKET = 'employee-documents';
