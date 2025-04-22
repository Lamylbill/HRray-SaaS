
import { supabase } from "@/integrations/supabase/client";

// Utility to get current user's plan & info
export const getCurrentSubscription = async () => {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("subscribers")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (error) {
    return null;
  }
  return data;
};

// Helper to start checkout
export const startCheckout = async (plan: "pro" | "plus", billing: "monthly" | "yearly") => {
  const jwt = localStorage.getItem("jwt_token");
  const res = await fetch("/functions/v1/create-checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwt}`
    },
    body: JSON.stringify({ plan, billing })
  });
  if (!res.ok) {
    throw new Error("Failed to start checkout");
  }
  const { url } = await res.json();
  window.location.href = url;
};
