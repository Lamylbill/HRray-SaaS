import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase project URL and Service Role key
const supabase = createClient(
  'https://ezvdmuahwliqotnbocdd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dmRtdWFod2xpcW90bmJvY2RkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjIyMDMxOSwiZXhwIjoyMDU3Nzk2MzE5fQ.5nPqDgKT70h0wpt0D8IbsnQoJ_ousw4k9Qpa6Lo2Cf0'
);

const targetUID = 'b17956a5-afbc-405b-af67-b02a93afc787';

async function updateUserMetadata() {
  const { data, error } = await supabase.auth.admin.updateUserById(targetUID, {
    user_metadata: { isBlogEditor: true },
  });

  if (error) {
    console.error('❌ Failed to update user metadata:', error.message);
  } else {
    console.log('✅ User metadata updated successfully:', data.user.user_metadata);
  }
}

updateUserMetadata();
