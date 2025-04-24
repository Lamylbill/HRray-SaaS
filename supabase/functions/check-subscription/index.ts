import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Set the CORS headers to allow cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define the serve function that handles incoming requests
serve(async (req) => {
  // Handle CORS preflight requests (OPTIONS method)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the Stripe secret key from environment variables
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) {
      console.error("Stripe secret not configured");
      return new Response(
        JSON.stringify({ error: "Stripe secret not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase clients - one for regular access and one with admin privileges
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } } // Disable session persistence for admin client
    );

    // Authenticate the user using the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No auth header provided");
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(jwt);
    
    if (!user) {
      console.error("Invalid auth token");
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Checking subscription for: ${user.email}`);

    // Initialize Stripe with the secret key
    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });
    
    // Find the Stripe customer associated with the user's email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      console.log("No Stripe customer found");
      
      // Update subscription status in database to free
      const {error} = await supabaseAdmin.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        subscribed: false,
        plan: "free",
        updated_at: new Date().toISOString(),
      }, { onConflict: "email" });

      if (error) {
        console.error("Error creating subscriber:", error);
      }
      
      return new Response(
        JSON.stringify({ 
          subscribed: false,
          plan: "free",
          plan_expiry: null
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const customerId = customers.data[0].id;
    console.log(`Customer found: ${customerId}`);
    
    // Get the user's active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });
    
    let subscribed = false;
    let plan = "free";
    let planExpiry = null;
    
    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      subscribed = true;
      
      // Determine the user's plan from the subscription metadata or set it to pro
      plan = subscription.metadata?.plan || "pro";
      
      // Set the plan expiry date
      planExpiry = subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;
      
      console.log(`Active subscription found: ${subscription.id}, Plan: ${plan}, Expires: ${planExpiry}`);
    } else {
      console.log("No active subscription found");
    }
    
    // Update the subscription status in the database
    const {error} = await supabaseAdmin.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: subscribed,
      plan: plan,
      plan_expiry: planExpiry,
      updated_at: new Date().toISOString(),
    }, { onConflict: "email" });

    if (error) {
      console.error("Error creating subscriber:", error);
    }
    
    // Return the user's subscription status
    return new Response(
      JSON.stringify({ 
        subscribed,
        plan,
        plan_expiry: planExpiry
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    // Handle errors
    console.error("Error checking subscription:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});