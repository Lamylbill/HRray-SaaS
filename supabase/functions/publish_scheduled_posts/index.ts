import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log(`Function "publish_scheduled_posts" up and running!`);

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });

    // Get all posts that are scheduled and should be published
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data, error } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('is_published', false)
      .lte('published_at', todayISO);

    if (error) throw error;

    // Update those posts to be published
    const postIdsToUpdate = data.map((post) => post.id);
    if (postIdsToUpdate.length > 0) {
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ is_published: true })
        .in('id', postIdsToUpdate);

      if (updateError) throw updateError;
    }

    return new Response(JSON.stringify({ updated: postIdsToUpdate.length }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});