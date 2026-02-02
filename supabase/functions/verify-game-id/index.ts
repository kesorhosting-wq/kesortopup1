import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// G2Bulk API base
const G2BULK_API_URL = "https://api.g2bulk.com/v1";

// Structured logging helper
function log(level: "INFO" | "WARN" | "ERROR" | "DEBUG", message: string, data?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    function: "verify-game-id",
    message,
    ...data,
  };
  if (level === "ERROR") {
    console.error(JSON.stringify(entry));
  } else if (level === "WARN") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

interface GameVerificationConfig {
  game_name: string;
  api_code: string;
  api_provider: string;
  requires_zone: boolean;
  default_zone: string | null;
  alternate_api_codes: string[];
}

// Cache for game configs (refreshed every 5 minutes)
let configCache: Map<string, GameVerificationConfig> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getGameConfigs(): Promise<Map<string, GameVerificationConfig>> {
  const now = Date.now();

  // Return cached configs if still valid
  if (configCache && now - cacheTimestamp < CACHE_TTL) {
    return configCache;
  }

  // Fetch from database
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("game_verification_configs")
    .select("game_name, api_code, api_provider, requires_zone, default_zone, alternate_api_codes")
    .eq("is_active", true);

  if (error) {
    log("ERROR", "Failed to fetch game configs", { error: error.message });
    // Return empty map if fetch fails
    return configCache || new Map();
  }

  // Build lookup map (case-insensitive)
  const newCache = new Map<string, GameVerificationConfig>();
  for (const config of data || []) {
    const cfg: GameVerificationConfig = {
      game_name: config.game_name,
      api_code: config.api_code,
      api_provider: config.api_provider,
      requires_zone: config.requires_zone,
      default_zone: config.default_zone,
      alternate_api_codes: config.alternate_api_codes || [],
    };
    // Store with original name
    newCache.set(config.game_name, cfg);
    // Also store lowercase version for case-insensitive lookup
    newCache.set(config.game_name.toLowerCase(), cfg);
  }

  configCache = newCache;
  cacheTimestamp = now;
  log("INFO", "Loaded game verification configs from database", { count: data?.length || 0 });

  return configCache;
}

// Normalize game names for fuzzy matching
function normalizeGameName(gameName: string): string {
  const normalized = gameName.toLowerCase().trim();

  if (normalized.includes("mobile legends") || normalized === "mlbb") return "Mobile Legends";
  if (normalized.includes("magic chess")) return "Magic Chess";
  if (normalized.includes("free fire") || normalized.includes("freefire") || normalized === "ff") return "Free Fire";
  if (normalized.includes("blood strike") || normalized.includes("bloodstrike")) return "Blood Strike";
  if (normalized.includes("pubg")) return "PUBG Mobile";
  if (normalized.includes("honor of kings") || normalized === "hok") return "Honor of Kings";
  if (normalized.includes("call of duty") || normalized.includes("cod") || normalized === "codm")
    return "Call of Duty Mobile";
  if (normalized.includes("arena of valor") || normalized === "aov") return "Arena of Valor";
  if (normalized.includes("valorant")) return "Valorant";
  if (normalized.includes("genshin")) return "Genshin Impact";
  if (normalized.includes("honkai") && normalized.includes("star")) return "Honkai Star Rail";
  if (normalized.includes("zenless") || normalized === "zzz") return "Zenless Zone Zero";
  if (normalized.includes("wuthering")) return "Wuthering Waves";
  if (normalized.includes("wild rift") || normalized === "lolwr") return "Wild Rift";
  if (normalized.includes("clash of clans") || normalized === "coc") return "Clash of Clans";
  if (normalized.includes("brawl stars")) return "Brawl Stars";
  if (normalized.includes("delta force")) return "Delta Force";
  if (normalized.includes("nikke")) return "NIKKE";
  if (normalized.includes("punishing") || normalized === "pgr") return "Punishing Gray Raven";
  if (normalized.includes("arknights")) return "Arknights";
  if (normalized.includes("blue archive")) return "Blue Archive";
  if (normalized.includes("roblox")) return "Roblox";
  if (normalized.includes("minecraft")) return "Minecraft";

  return gameName;
}

// Find game config from database
async function findGameConfig(gameName: string): Promise<GameVerificationConfig | null> {
  const configs = await getGameConfigs();

  // Try exact match first
  let config = configs.get(gameName);
  if (config) return config;

  // Try lowercase match
  config = configs.get(gameName.toLowerCase());
  if (config) return config;

  // Try normalized name
  const normalized = normalizeGameName(gameName);
  config = configs.get(normalized);
  if (config) return config;

  config = configs.get(normalized.toLowerCase());
  if (config) return config;

  return null;
}

// Get G2Bulk API key from api_configurations table
async function getG2BulkApiKey(): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("api_configurations")
    .select("api_secret, is_enabled")
    .eq("api_name", "g2bulk")
    .single();

  if (error || !data || !data.is_enabled) {
    log("WARN", "G2Bulk API not configured or disabled");
    return null;
  }

  return data.api_secret || null;
}

// Try to verify player via G2Bulk checkPlayerIdPublic endpoint
async function verifyWithG2Bulk(
  apiKey: string,
  gameCode: string,
  userId: string,
  serverId?: string,
): Promise<{ success: boolean; name?: string; openid?: string; error?: string }> {
  const body: Record<string, string> = {
    game: gameCode,
    user_id: userId,
  };
  if (serverId) {
    body.server_id = serverId;
  }

  log("DEBUG", "Calling G2Bulk checkPlayerIdPublic", { gameCode, userId, hasServerId: !!serverId });

  const response = await fetch(`${G2BULK_API_URL}/games/checkPlayerIdPublic`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  log("DEBUG", "G2Bulk checkPlayerIdPublic response", { status: response.status, body: text.substring(0, 500) });

  if (!response.ok) {
    return { success: false, error: `G2Bulk API returned ${response.status}` };
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    return { success: false, error: "Invalid JSON from G2Bulk" };
  }

  // Expected response: { valid: "valid", name: "...", openid: "..." } or { valid: "invalid", ... }
  if (data.valid === "valid" && data.name) {
    return { success: true, name: data.name as string, openid: data.openid as string };
  }

  // Check for alternate success formats
  if (data.success === true && (data.name || data.nickname || data.username)) {
    const name = (data.name || data.nickname || data.username) as string;
    return { success: true, name, openid: data.openid as string };
  }

  // Determine error message
  let errorMsg = "Player ID not found or invalid";
  if (data.message) errorMsg = data.message as string;
  else if (data.error) errorMsg = data.error as string;
  else if (data.valid === "invalid") errorMsg = "Invalid player ID";

  return { success: false, error: errorMsg };
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gameName, userId, serverId } = await req.json();

    log("INFO", "Verification request received", { requestId, gameName, userId, serverId: serverId || "N/A" });

    if (!gameName || !userId) {
      log("WARN", "Missing required parameters", { requestId, gameName, userId });
      return new Response(JSON.stringify({ success: false, error: "Missing gameName or userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get G2Bulk API key
    const apiKey = await getG2BulkApiKey();
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Game verification service is not configured. Please contact the admin.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Find game config from database
    const gameConfig = await findGameConfig(gameName);
    log("DEBUG", "Game config lookup", {
      requestId,
      gameName,
      configFound: !!gameConfig,
      apiCode: gameConfig?.api_code,
    });

    if (!gameConfig) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `No verification configuration found for ${gameName}. Please ask admin to sync game codes.`,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check if zone is required
    if (gameConfig.requires_zone && !serverId && !gameConfig.default_zone) {
      log("WARN", "Zone required but not provided", { requestId, gameName });
      return new Response(
        JSON.stringify({
          success: false,
          error: `${gameName} requires a Server/Zone ID. Please enter your Server ID.`,
          requiresServerId: true,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const effectiveServerId = serverId || gameConfig.default_zone || undefined;

    // Build list of game codes to try (primary + alternates)
    const codesToTry = [gameConfig.api_code, ...gameConfig.alternate_api_codes];
    const triedCodes: string[] = [];
    let lastError = "Verification failed";

    for (const code of codesToTry) {
      triedCodes.push(code);
      const result = await verifyWithG2Bulk(apiKey, code, userId, effectiveServerId);

      if (result.success && result.name) {
        log("INFO", "Verification successful", { requestId, gameName, code, name: result.name });
        return new Response(
          JSON.stringify({
            success: true,
            username: result.name,
            userId: userId,
            serverId: effectiveServerId || undefined,
            accountName: result.name,
            verifiedBy: "G2Bulk",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      lastError = result.error || "Player ID not found";
      log("DEBUG", "Code failed, trying next", { requestId, code, error: lastError });
    }

    // All codes failed – suggest trying alternate region
    log("WARN", "All verification codes failed", { requestId, gameName, triedCodes });

    const alternateHint =
      gameConfig.alternate_api_codes.length > 0
        ? ` You may be registered in a different region. Try selecting another region.`
        : "";

    return new Response(
      JSON.stringify({
        success: false,
        error: `${lastError}${alternateHint}`,
        triedCodes,
        alternateRegions: gameConfig.alternate_api_codes,
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    log("ERROR", "Verification error", { error: String(error) });
    return new Response(
      JSON.stringify({ success: false, error: "Verification service error. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
