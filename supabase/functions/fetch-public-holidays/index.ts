import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { year = new Date().getFullYear(), country = 'SG' } = await req.json();
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First check if we already have the holidays for this year and country
    const { data: existingHolidays, error: queryError } = await supabase
      .from('public_holidays')
      .select('*')
      .eq('country', country)
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`);
    
    if (queryError) {
      console.error('Error querying holidays:', queryError);
      throw queryError;
    }
    
    // If we already have holidays, return them
    if (existingHolidays && existingHolidays.length > 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Holidays retrieved from database',
        data: existingHolidays
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Otherwise, fetch from an API
    // Using a free public holiday API for Singapore - replace with your preferred API
    const apiUrl = `https://date.nager.at/api/v3/publicholidays/${year}/${country}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Holiday API returned ${response.status}: ${response.statusText}`);
    }
    
    const holidays = await response.json();
    
    // Convert to our format and store in database
    const formattedHolidays = holidays.map((h: any) => ({
      name: h.name,
      date: h.date,
      country: country
    }));
    
    // Insert the holidays into our database
    const { data: insertedHolidays, error: insertError } = await supabase
      .from('public_holidays')
      .insert(formattedHolidays)
      .select();
    
    if (insertError) {
      console.error('Error inserting holidays:', insertError);
      throw insertError;
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Holidays fetched and stored successfully',
      data: insertedHolidays
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: error.message || 'An error occurred while fetching holidays',
      error: error
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
