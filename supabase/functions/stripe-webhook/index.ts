
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the signature from the headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("No Stripe signature in request");
      return new Response(
        JSON.stringify({ error: "No Stripe signature found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!webhookSecret || !stripeSecretKey) {
      console.error("Stripe secrets not configured");
      return new Response(
        JSON.stringify({ error: "Stripe secrets not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the body as text for signature verification
    const body = await req.text();
    
    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    
    let event;
    try {
      // Verify and construct the webhook event
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log(`✅ Webhook event verified: ${event.type}`);
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed:`, err);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Connect to Supabase using service role key to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("✅ Checkout completed:", session.id);
        
        // Get customer information and update subscribers table
        const customerId = session.customer;
        const userEmail = session.customer_details?.email;
        const subscriptionId = session.subscription;
        
        if (customerId && userEmail && subscriptionId) {
          // Update subscriber record
          await supabase.from("subscribers").upsert({
            email: userEmail,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscribed: true,
            plan: session.metadata?.plan || "pro", // Default to "pro" if not specified
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email' });
          
          console.log(`✅ Updated subscription for ${userEmail}`);
        }
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Get current end date
        const currentPeriodEnd = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;
        
        // Get customer email
        const { data: customerData } = await stripe.customers.retrieve(
          customerId as string
        );
        
        // Check for deleted customers
        if (customerData && "deleted" in customerData && customerData.deleted) {
          console.log(`Customer ${customerId} has been deleted`);
          break;
        }
        
        const email = "email" in customerData ? customerData.email : null;
        
        if (email) {
          await supabase.from("subscribers").upsert({
            email: email,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            subscribed: subscription.status === "active",
            plan: subscription.status === "active" ? (subscription.metadata?.plan || "pro") : "free",
            plan_expiry: currentPeriodEnd,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email' });
          
          console.log(`✅ Updated subscription status for ${email} to ${subscription.status}`);
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Get customer email
        const { data: customerData } = await stripe.customers.retrieve(
          customerId as string
        );
        
        // Check for deleted customers
        if (customerData && "deleted" in customerData && customerData.deleted) {
          console.log(`Customer ${customerId} has been deleted`);
          break;
        }
        
        const email = "email" in customerData ? customerData.email : null;
        
        if (email) {
          await supabase.from("subscribers").update({
            subscribed: false,
            plan: "free",
            plan_expiry: null,
            updated_at: new Date().toISOString(),
          }).eq("email", email);
          
          console.log(`✅ Marked subscription as cancelled for ${email}`);
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
    
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
