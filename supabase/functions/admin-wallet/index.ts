import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, data?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    function: 'admin-wallet',
    message,
    ...data,
  };
  if (level === 'ERROR') {
    console.error(JSON.stringify(entry));
  } else if (level === 'WARN') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's auth token
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get caller from token
    const { data: { user: caller }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !caller) {
      log('ERROR', 'Failed to get caller', { error: userError?.message });
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if caller is admin
    const { data: adminRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .single();

    if (roleError || !adminRole) {
      log('WARN', 'Non-admin attempted admin wallet action', { callerId: caller.id });
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, targetUserId, amount, description } = await req.json();
    log('INFO', 'Admin wallet action received', { action, targetUserId, amount, adminId: caller.id });

    if (action === "list-users") {
      // Get all users with their wallet balances
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, email, display_name, wallet_balance")
        .order("email", { ascending: true });

      if (profilesError) {
        log('ERROR', 'Failed to list users', { error: profilesError.message });
        return new Response(
          JSON.stringify({ error: "Failed to list users" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ users: profiles || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "add-balance") {
      // Validate inputs
      if (!targetUserId || !amount || amount <= 0) {
        return new Response(
          JSON.stringify({ error: "Invalid user ID or amount" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get target user's current balance
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("wallet_balance, email, display_name")
        .eq("user_id", targetUserId)
        .single();

      if (profileError || !profile) {
        log('ERROR', 'Target user not found', { targetUserId, error: profileError?.message });
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const currentBalance = profile.wallet_balance || 0;
      const newBalance = currentBalance + amount;

      // Create transaction record - trigger will update the balance
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: targetUserId,
          type: "topup",
          amount: amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: description || `Admin wallet adjustment by ${caller.email}`,
          reference_id: `admin-${caller.id}-${Date.now()}`
        });

      if (txError) {
        log('ERROR', 'Failed to create admin transaction', { error: txError.message });
        return new Response(
          JSON.stringify({ error: "Failed to add balance" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      log('INFO', 'Admin wallet add successful', { 
        adminId: caller.id, 
        targetUserId, 
        targetEmail: profile.email,
        amount, 
        oldBalance: currentBalance,
        newBalance 
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: { 
            email: profile.email, 
            display_name: profile.display_name 
          },
          oldBalance: currentBalance,
          newBalance 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "deduct-balance") {
      // Validate inputs
      if (!targetUserId || !amount || amount <= 0) {
        return new Response(
          JSON.stringify({ error: "Invalid user ID or amount" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get target user's current balance
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("wallet_balance, email, display_name")
        .eq("user_id", targetUserId)
        .single();

      if (profileError || !profile) {
        log('ERROR', 'Target user not found', { targetUserId, error: profileError?.message });
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const currentBalance = profile.wallet_balance || 0;
      
      // Check if user has enough balance
      if (currentBalance < amount) {
        return new Response(
          JSON.stringify({ error: "User has insufficient balance" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newBalance = currentBalance - amount;

      // Create transaction record
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: targetUserId,
          type: "purchase",
          amount: -amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: description || `Admin wallet deduction by ${caller.email}`,
          reference_id: `admin-deduct-${caller.id}-${Date.now()}`
        });

      if (txError) {
        log('ERROR', 'Failed to create admin deduction transaction', { error: txError.message });
        return new Response(
          JSON.stringify({ error: "Failed to deduct balance" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      log('INFO', 'Admin wallet deduction successful', { 
        adminId: caller.id, 
        targetUserId, 
        targetEmail: profile.email,
        amount, 
        oldBalance: currentBalance,
        newBalance 
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: { 
            email: profile.email, 
            display_name: profile.display_name 
          },
          oldBalance: currentBalance,
          newBalance 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    log('ERROR', 'Admin wallet error', { error: error.message });
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
