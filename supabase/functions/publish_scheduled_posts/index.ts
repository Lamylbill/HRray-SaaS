import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log(`Function "publish_scheduled_posts" up and running!`);\n
serve(async (req) => {\n
  try {\n
    // Get the Supabase URL and Service Role Key from the environment\n
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';\n
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';\n

    // Create a Supabase client with the Service Role Key\n
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {\n
      auth: {\n
        persistSession: false,\n
      },\n
    });\n

    // Get the current time to compare with the publish_at time\n
    const now = new Date();\n

    // Query the scheduled_posts table for posts to publish\n
    const { data: scheduledPosts, error: selectError } = await supabase\n
      .from('scheduled_posts')\n
      .select('*')\n
      .lte('publish_at', now.toISOString())\n
      .eq('published', false);\n

    if (selectError) {\n
      throw new Error(`Error fetching scheduled posts: ${selectError.message}`);\n
    }\n

    if (!scheduledPosts || scheduledPosts.length === 0) {\n
      return new Response(\n
        JSON.stringify({ message: 'No posts to publish at this time.' }),\n
        {\n
          headers: { 'Content-Type': 'application/json' },\n
          status: 200,\n
        }\n
      );\n
    }\n

    // Array to store the published post IDs\n
    const publishedPostIds: any[] = [];\n

    // Process each post to publish\n
    for (const post of scheduledPosts) {\n
      const { error: insertError } = await supabase.from('posts').insert({\n+        title: post.title,\n+        content: post.content,\n+        author_id: post.author_id,\n+        // Add other fields as needed, mapping them from the scheduled_posts table\n+      });\n+
      if (insertError) {\n
        throw new Error(`Error inserting post: ${insertError.message}`);\n
      }\n

      const { error: updateError } = await supabase\n
        .from('scheduled_posts')\n
        .update({ published: true })\n
        .eq('id', post.id);\n

      if (updateError) {\n
        throw new Error(`Error updating scheduled post: ${updateError.message}`);\n
      }\n

      publishedPostIds.push(post.id);\n
    }\n

    // Return a success response with the published post IDs\n
    return new Response(\n
      JSON.stringify({\n
        message: 'Posts published successfully.',\n
        publishedPostIds,\n
      }),\n
      {\n
        headers: { 'Content-Type': 'application/json' },\n+        status: 200,\n+      }\n+    );\n+  } catch (error) {\n+    // Handle errors\n+    console.error('Error in publish_scheduled_posts:', error);\n+    return new Response(\n+      JSON.stringify({ error: error.message }),\n+      {\n+        headers: { 'Content-Type': 'application/json' },\n+        status: 500,\n+      }\n+    );\n+  }\n+});

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey,{auth: {persistSession: false,},});
