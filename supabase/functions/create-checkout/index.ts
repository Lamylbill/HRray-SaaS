
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// These are sample price IDs - replace with your actual Stripe price IDs
const PLAN_PRICE_IDS = {
  pro_monthly: "price_1RGp3uQRzDYLKJmR8osAAdlF",
  pro_yearly: "price_1RGp3uQRzDYLKJmR1gKPd0Hs",
  plus_monthly: "price_1RGp3uQRzDYLKJmRCLGDRVkf",
  plus_yearly: "price_1RGp3uQRzDYLKJmR3uv5NJvC"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) {
      console.error("Stripe secret not configured");
      return new Response(
        JSON.stringify({ error: "Stripe secret not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No auth header provided");
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(jwt);
    
    if (!user) {
      console.error("Invalid auth token");
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`User authenticated: ${user.email}`);

    // Parse request body
    const reqBody = await req.json();
    const { plan, billing } = reqBody; // pro/plus, monthly/yearly
    console.log(`Plan: ${plan}, Billing: ${billing}`);

    // Initialize Stripe
    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });
    
    let customerId;
    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log(`Existing customer found: ${customerId}`);
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      console.log(`New customer created: ${customerId}`);
    }

    // Determine price ID based on plan and billing
    let priceId;
    if (plan === "pro" && billing === "monthly") priceId = PLAN_PRICE_IDS.pro_monthly;
    else if (plan === "pro" && billing === "yearly") priceId = PLAN_PRICE_IDS.pro_yearly;
    else if (plan === "plus" && billing === "monthly") priceId = PLAN_PRICE_IDS.plus_monthly;
    else if (plan === "plus" && billing === "yearly") priceId = PLAN_PRICE_IDS.plus_yearly;
    else {
      console.error(`Invalid plan/billing: ${plan}/${billing}`);
      return new Response(
        JSON.stringify({ error: "Invalid plan/billing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Price ID selected: ${priceId}`);

    // Create checkout session
    const origin = req.headers.get("origin") || "http://localhost:8080";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${origin}/settings?checkout=success`,
      cancel_url: `${origin}/settings?checkout=cancel`,
      metadata: {
        plan,
        supabase_user_id: user.id,
      }
    });

    console.log(`Checkout session created: ${session.id}`);
    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
