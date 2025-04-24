-- This migration creates the 'subscribers' table.
CREATE TABLE IF NOT EXISTS subscribers (
  -- Unique identifier for each subscriber.
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  -- The corresponding user's ID.
  user_id UUID NOT NULL,
  -- The user's email, must be unique.
  email TEXT NOT NULL UNIQUE,
  -- The Stripe customer ID (if they've subscribed).
  stripe_customer_id TEXT UNIQUE,
  -- Whether the user is currently subscribed.
  subscribed BOOLEAN NOT NULL,
  -- The user's current plan.
  plan TEXT NOT NULL,
  -- When the user's plan expires.
  plan_expiry TIMESTAMP,
  -- Timestamp for when the record was created.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Timestamp for when the record was last updated.
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security for the 'subscribers' table.
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow authenticated users to select their own subscription.
CREATE POLICY "Users can select their own subscription." ON subscribers FOR SELECT USING (auth.uid() = user_id);

-- Create a policy to allow authenticated users to update their own subscription.
CREATE POLICY "Users can update their own subscription." ON subscribers FOR UPDATE USING (auth.uid() = user_id);

-- Create a policy to allow authenticated users to insert their own subscription.
CREATE POLICY "Users can insert their own subscription." ON subscribers FOR INSERT USING (auth.uid() = user_id);