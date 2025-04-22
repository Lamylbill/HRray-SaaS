
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_PRICE_IDS = {
  pro_monthly: "price_1RGp3uQRzDYLKJmR8osAAdlF",
  pro_yearly: "price_1RGp3uQRzDYLKJmR1gKPd0Hs",
  plus_monthly: "price_1RGp3uQRzDYLKJmRCLGDRVkf",
  plus_yearly: "price_1RGp3uQRzDYLKJmR3uv5NJvC"
};
// Update the above with your actual Stripe price IDs.

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeSecret) {
    return new Response(
      JSON.stringify({ error: "Stripe secret not configured" }),
      { status: 500, headers: corsHeaders }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  // Authenticate user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: corsHeaders,
    });
  }
  const jwt = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(jwt);
  if (!user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const reqBody = await req.json();
  const { plan, billing } = reqBody; // pro/plus, monthly/yearly

  // Find or create Stripe customer
  const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });
  let customerId;
  // Find by email
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  if (customers.data.length > 0) {
    customerId = customers.data[0].id;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
  }

  // Pick price ID
  let priceId;
  if (plan === "pro" && billing === "monthly") priceId = PLAN_PRICE_IDS.pro_monthly;
  else if (plan === "pro" && billing === "yearly") priceId = PLAN_PRICE_IDS.pro_yearly;
  else if (plan === "plus" && billing === "monthly") priceId = PLAN_PRICE_IDS.plus_monthly;
  else if (plan === "plus" && billing === "yearly") priceId = PLAN_PRICE_IDS.plus_yearly;
  else return new Response(JSON.stringify({ error: "Invalid plan/billing" }), { status: 400, headers: corsHeaders });

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    customer_email: user.email,
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    success_url: `${req.headers.get("origin")}/settings?checkout=success`,
    cancel_url: `${req.headers.get("origin")}/settings?checkout=cancel`,
    metadata: {
      plan,
      supabase_user_id: user.id,
    }
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
