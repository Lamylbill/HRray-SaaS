import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log(`Function "publish_scheduled_posts" is running!`);

serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    const now = new Date().toISOString();

    // Get posts scheduled for publishing
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id')
      .lte('published_at', now)
      .eq('is_published', false);

    if (fetchError) {
      throw new Error(`Error fetching scheduled posts: ${fetchError.message}`);
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return new Response(JSON.stringify({
        message: 'No posts to publish at this time.',
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Extract IDs of posts to update
    const postIds = scheduledPosts.map(post => post.id);

    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ is_published: true })
      .in('id', postIds);

    if (updateError) {
      throw new Error(`Error updating published status: ${updateError.message}`);
    }

    return new Response(JSON.stringify({
      message: 'Posts published successfully.',
      publishedPostIds: postIds,
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in publish_scheduled_posts:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
