
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeSecret || !webhookSecret) {
    return new Response(
      JSON.stringify({ error: "Stripe secrets not configured" }),
      { status: 500, headers: corsHeaders }
    );
  }

  // Get the raw body and stripe-signature header
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig as string,
      webhookSecret
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Webhook Error: ${err.message}` }),
      { status: 400, headers: corsHeaders }
    );
  }

  // Connect to Supabase as service role
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  // Subscription events to handle: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
  if (
    event.type === "checkout.session.completed" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.created"
  ) {
    const session = event.data.object;
    const customerId = session.customer ?? session.customer_id;
    let userEmail, subscriptionId, plan, planExpiry;
    if (event.type === "checkout.session.completed") {
      userEmail = session.customer_email;
      subscriptionId = session.subscription;
      plan = session.metadata?.plan;
    } else {
      // For customer.subscription.updated/created
      subscriptionId = session.id;
      customerId = session.customer;
      userEmail = session.customer_email || (session.customer && session.customer.email);
      plan = session.items?.data?.[0]?.price?.nickname?.toLowerCase();
    }
    // Determine expiry
    if (session.current_period_end) {
      planExpiry = new Date(session.current_period_end * 1000).toISOString();
    } else if (session.expires_at) {
      planExpiry = new Date(session.expires_at * 1000).toISOString();
    }

    // Determine our plan from price/metadata, require mapping if needed
    let newPlan = "pro";
    if (
      session.metadata?.plan === "plus" ||
      session.items?.data?.[0]?.price.nickname?.toLowerCase().includes("plus")
    ) {
      newPlan = "plus";
    }

    if (userEmail && customerId && subscriptionId) {
      // Upsert to public.subscribers table
      await supabase.from("subscribers").upsert({
        email: userEmail,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        plan: newPlan,
        plan_expiry: planExpiry,
        subscribed: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    const customerId = sub.customer;
    // Set back to free plan
    await supabase.from("subscribers").update({
      plan: "free",
      plan_expiry: null,
      stripe_subscription_id: null,
      subscribed: false,
      updated_at: new Date().toISOString()
    }).eq("stripe_customer_id", customerId);
  }

  return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
});
