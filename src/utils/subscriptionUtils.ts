
import { supabase } from "@/integrations/supabase/client";

// Utility to get current user's plan & info
export const getCurrentSubscription = async () => {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;
  
  // First try to get subscription data by user_id
  let { data, error } = await supabase
    .from("subscribers")
    .select("*")
    .eq("user_id", user.id)
    .single();
    
  if (error || !data) {
    // If that fails, try by email
    const result = await supabase
      .from("subscribers")
      .select("*")
      .eq("email", user.email)
      .single();
    
    if (result.error) {
      console.error("Error fetching subscription:", result.error);
      return null;
    }
    
    data = result.data;
    
    // If found by email but user_id is missing, update the record
    if (data && !data.user_id) {
      await supabase
        .from("subscribers")
        .update({ user_id: user.id })
        .eq("id", data.id);
    }
  }
  
  return data;
};

// Helper to start checkout
export const startCheckout = async (plan: "pro" | "plus", billing: "monthly" | "yearly") => {
  try {
    const jwt = await getAuthToken();
    
    if (!jwt) {
      throw new Error("Not authenticated");
    }
    
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { plan, billing }
    });
    
    if (error) {
      console.error("Checkout error:", error);
      throw new Error(`Failed to start checkout: ${error.message}`);
    }
    
    if (!data?.url) {
      throw new Error("No checkout URL returned");
    }
    
    window.location.href = data.url;
    return { success: true };
  } catch (error) {
    console.error("Checkout error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An unknown error occurred" 
    };
  }
};

// Helper to open customer portal for subscription management
export const openCustomerPortal = async () => {
  try {
    const jwt = await getAuthToken();
    
    if (!jwt) {
      throw new Error("Not authenticated");
    }
    
    const { data, error } = await supabase.functions.invoke("customer-portal");
    
    if (error) {
      throw new Error(`Failed to open customer portal: ${error.message}`);
    }
    
    if (!data?.url) {
      throw new Error("No portal URL returned");
    }
    
    window.location.href = data.url;
    return { success: true };
  } catch (error) {
    console.error("Customer portal error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An unknown error occurred" 
    };
  }
};

// Helper to refresh subscription status
export const refreshSubscriptionStatus = async () => {
  try {
    const jwt = await getAuthToken();
    
    if (!jwt) {
      return { success: false, error: "Not authenticated" };
    }
    
    const { data, error } = await supabase.functions.invoke("check-subscription");
    
    if (error) {
      return { 
        success: false, 
        error: `Failed to refresh subscription: ${error.message}` 
      };
    }
    
    return { success: true, subscription: data };
  } catch (error) {
    console.error("Subscription refresh error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An unknown error occurred" 
    };
  }
};

// Helper to get auth token
const getAuthToken = async (): Promise<string | null> => {
  // First try from localStorage
  const storedToken = localStorage.getItem("jwt_token");
  if (storedToken) return storedToken;
  
  // If not in localStorage, get from session
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
};
