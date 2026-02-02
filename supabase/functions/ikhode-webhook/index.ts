import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Authorization",
};

// Structured logging helper
function log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, data?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    function: 'ikhode-webhook',
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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Extract order_id from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const orderIdFromPath = pathParts[pathParts.length - 1];

    console.log(`[Webhook] Received for Order #${orderIdFromPath}`);

    // 1. Get our stored secret from payment_gateways config
    const { data: gateway } = await supabase
      .from("payment_gateways")
      .select("config")
      .eq("slug", "ikhode-bakong")
      .maybeSingle();

    const expectedSecret = (gateway?.config as any)?.webhook_secret || "";

    // 2. Authorization Check (using Bearer token)
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") || "";

    console.log(`[Webhook] Expected Secret: ${expectedSecret ? "[SET]" : "[NOT SET]"}`);
    console.log(`[Webhook] Received Token: ${token ? "[PROVIDED]" : "[MISSING]"}`);

    if (expectedSecret && token !== expectedSecret) {
      console.error("[Webhook] Unauthorized: Invalid secret key");
      return new Response(
        JSON.stringify({ status: "error", message: "Unauthorized: Invalid secret key." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Check if this is a wallet top-up or regular order
    const isWalletTopup = orderIdFromPath?.startsWith("wallet-");
    
    if (isWalletTopup) {
      // Handle wallet top-up
      log('INFO', 'Processing wallet top-up', { orderIdFromPath });
      
      // Extract user ID from wallet order format: wallet-{userId8chars}-{timestamp}
      const parts = orderIdFromPath.split("-");
      if (parts.length < 3) {
        log('ERROR', 'Invalid wallet order ID format', { orderIdFromPath });
        return new Response(
          JSON.stringify({ status: "error", message: "Invalid wallet order ID format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const userIdPrefix = parts[1]; // First 8 chars of user ID
      
      // Get payment data from request body
      const payload = await req.json();
      log('INFO', 'Wallet topup payload', { payload });
      
      const amount = parseFloat(payload.amount) || 0;
      const transactionId = payload.transaction_id || payload.transactionId || orderIdFromPath;
      
      if (amount <= 0) {
        log('ERROR', 'Invalid amount for wallet topup', { amount });
        return new Response(
          JSON.stringify({ status: "error", message: "Invalid amount" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Find user by matching user_id prefix
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, wallet_balance")
        .like("user_id", `${userIdPrefix}%`);
      
      if (profileError || !profiles || profiles.length === 0) {
        log('ERROR', 'User not found for wallet topup', { userIdPrefix, error: profileError?.message });
        return new Response(
          JSON.stringify({ status: "error", message: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Use first matching user
      const userProfile = profiles[0];
      const currentBalance = userProfile.wallet_balance || 0;
      const newBalance = currentBalance + amount;
      
      log('INFO', 'Processing wallet topup', { 
        userId: userProfile.user_id, 
        currentBalance, 
        amount, 
        newBalance 
      });
      
      // Create wallet transaction - this will trigger the update_wallet_balance function
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: userProfile.user_id,
          type: "topup",
          amount: amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: `KHQR Wallet Top-up - Transaction: ${transactionId}`,
          reference_id: orderIdFromPath
        });
      
      if (txError) {
        log('ERROR', 'Failed to create wallet transaction', { error: txError.message });
        return new Response(
          JSON.stringify({ status: "error", message: "Failed to process wallet top-up" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      log('INFO', 'Wallet topup successful', { userId: userProfile.user_id, amount, newBalance });
      
      return new Response(
        JSON.stringify({ status: "success", message: "Wallet top-up completed", newBalance }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Regular order processing
    let order = null;

    if (orderIdFromPath && orderIdFromPath !== "ikhode-webhook") {
      const { data } = await supabase
        .from("topup_orders")
        .select("*")
        .eq("id", orderIdFromPath)
        .maybeSingle();
      order = data;
    }

    if (!order) {
      log('ERROR', 'Order not found', { orderIdFromPath });
      return new Response(
        JSON.stringify({ status: "error", message: "Order not found or could not be resolved." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log('INFO', 'Found Order', { orderId: order.id, status: order.status });

    // 4. Already Processed Check - allow "pending" and "paid" status to be processed
    const processableStatuses = ["pending", "paid"];
    if (!processableStatuses.includes(order.status)) {
      log('INFO', 'Order already processed', { orderId: order.id, status: order.status });
      return new Response(
        JSON.stringify({ status: "success", message: `Order already ${order.status}.` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log('INFO', 'Order is processable, proceeding with fulfillment', { status: order.status });

    // 5. Process Data from Node.js API
    const payload = await req.json();
    log('DEBUG', 'Webhook payload', { payload });

    const transactionId = payload.transaction_id || payload.transactionId || "N/A";
    const amount = payload.amount || order.amount;

    log('INFO', 'Processing payment', { amount, transactionId });

    // 6. Update order to processing (auto-process after payment)
    try {
      const { error: updateError } = await supabase
        .from("topup_orders")
        .update({
          status: "processing",
          payment_method: "Xavier KHQR",
          status_message: `Payment confirmed. Transaction: ${transactionId}. Processing order...`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateError) {
        throw updateError;
      }

      log('INFO', 'Payment recorded, auto-processing order', { orderId: order.id });

      // 7. Auto-trigger fulfillment (G2Bulk or manual)
      log('INFO', 'Auto-triggering fulfillment', { orderId: order.id });
      
      try {
        const { error: topupError } = await supabase.functions.invoke("process-topup", {
          body: {
            orderId: order.id,
            action: "fulfill"
          },
        });

        if (topupError) {
          log('ERROR', 'Auto-fulfillment error', { error: topupError });
          await supabase
            .from("topup_orders")
            .update({
              status: "pending_manual",
              status_message: `Payment confirmed. Auto-fulfillment failed: ${topupError.message}. Manual processing required.`,
            })
            .eq("id", order.id);
        } else {
          log('INFO', 'Auto-fulfillment triggered successfully');
        }
      } catch (fulfillErr: any) {
        log('ERROR', 'Fulfillment call error', { error: fulfillErr?.message });
        await supabase
          .from("topup_orders")
          .update({
            status: "pending_manual",
            status_message: `Payment confirmed. Fulfillment error: ${fulfillErr?.message || 'Unknown'}. Manual processing required.`,
          })
          .eq("id", order.id);
      }

      // 8. Success response
      return new Response(
        JSON.stringify({ status: "success", message: "Payment recorded successfully." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (paymentError: any) {
      log('ERROR', 'FATAL PAYMENT ERROR', { orderId: order.id, error: paymentError?.message });
      return new Response(
        JSON.stringify({ status: "error", message: "Internal Server Error during payment processing." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error: any) {
    log('ERROR', 'Webhook error', { error: error?.message });
    return new Response(
      JSON.stringify({ status: "error", message: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});