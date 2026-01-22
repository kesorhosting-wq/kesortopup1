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
    function: 'wallet-topup',
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

    // Get user from token
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      log('ERROR', 'Failed to get user', { error: userError?.message });
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, amount, orderId } = await req.json();
    log('INFO', 'Wallet action received', { action, amount, userId: user.id, orderId });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (action === "get-balance") {
      // Get user's wallet balance
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        log('ERROR', 'Failed to get profile', { error: profileError.message });
        return new Response(
          JSON.stringify({ error: "Failed to get wallet balance" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ balance: profile?.wallet_balance || 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "topup") {
      // Validate amount
      if (!amount || amount <= 0) {
        return new Response(
          JSON.stringify({ error: "Invalid amount" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get current balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("user_id", user.id)
        .single();

      const currentBalance = profile?.wallet_balance || 0;
      const newBalance = currentBalance + amount;

      // Create transaction record
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          type: "topup",
          amount: amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: `Wallet top-up via KHQR`,
          reference_id: orderId || null
        });

      if (txError) {
        log('ERROR', 'Failed to create transaction', { error: txError.message });
        return new Response(
          JSON.stringify({ error: "Failed to process top-up" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      log('INFO', 'Wallet topup successful', { userId: user.id, amount, newBalance });

      return new Response(
        JSON.stringify({ success: true, newBalance }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "purchase") {
      // Validate amount
      if (!amount || amount <= 0) {
        return new Response(
          JSON.stringify({ error: "Invalid amount" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate orderId is provided for purchases
      if (!orderId) {
        return new Response(
          JSON.stringify({ error: "Order ID is required for purchases" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify the order exists and belongs to this user
      const { data: order, error: orderCheckError } = await supabase
        .from("topup_orders")
        .select("id, user_id, status, amount")
        .eq("id", orderId)
        .single();

      if (orderCheckError || !order) {
        log('ERROR', 'Order not found', { orderId, error: orderCheckError?.message });
        return new Response(
          JSON.stringify({ error: "Order not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify the order belongs to the authenticated user
      if (order.user_id !== user.id) {
        log('ERROR', 'Order does not belong to user', { orderId, orderUserId: order.user_id, userId: user.id });
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify order is in pending status
      if (order.status !== 'pending') {
        log('WARN', 'Order already processed', { orderId, status: order.status });
        return new Response(
          JSON.stringify({ error: "Order already processed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get current balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("user_id", user.id)
        .single();

      const currentBalance = profile?.wallet_balance || 0;

      // Check sufficient balance
      if (currentBalance < amount) {
        return new Response(
          JSON.stringify({ error: "Insufficient wallet balance" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newBalance = currentBalance - amount;

      // Create transaction record
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          type: "purchase",
          amount: -amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: `Game top-up purchase`,
          reference_id: orderId
        });

      if (txError) {
        log('ERROR', 'Failed to create purchase transaction', { error: txError.message });
        return new Response(
          JSON.stringify({ error: "Failed to process purchase" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // SERVER-SIDE: Update order status to 'paid' after successful wallet deduction
      // This prevents client-side manipulation of order status
      const { error: orderUpdateError } = await supabase
        .from("topup_orders")
        .update({ 
          status: 'paid', 
          payment_method: 'Wallet',
          updated_at: new Date().toISOString()
        })
        .eq("id", orderId)
        .eq("user_id", user.id); // Extra safety check

      if (orderUpdateError) {
        log('ERROR', 'Failed to update order status', { orderId, error: orderUpdateError.message });
        // Note: Wallet was already deducted, but order update failed
        // The order will remain in pending status - admin should handle manually
        return new Response(
          JSON.stringify({ error: "Payment processed but order update failed. Please contact support.", newBalance }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      log('INFO', 'Wallet purchase successful', { userId: user.id, amount, newBalance, orderId });

      return new Response(
        JSON.stringify({ success: true, newBalance, orderId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    log('ERROR', 'Wallet topup error', { error: error.message });
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
