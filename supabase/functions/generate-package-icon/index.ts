import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Game currency mappings for realistic icons
const GAME_CURRENCY_MAP: Record<string, { currency: string; icon: string; colors: string }> = {
  'mobile legends': { currency: 'Diamonds', icon: 'blue diamond gem', colors: 'blue, purple, cyan' },
  'mlbb': { currency: 'Diamonds', icon: 'blue diamond gem', colors: 'blue, purple, cyan' },
  'free fire': { currency: 'Diamonds', icon: 'orange diamond', colors: 'orange, red, gold' },
  'garena free fire': { currency: 'Diamonds', icon: 'orange diamond', colors: 'orange, red, gold' },
  'pubg': { currency: 'UC', icon: 'golden coins', colors: 'gold, yellow, orange' },
  'pubg mobile': { currency: 'UC', icon: 'golden coins', colors: 'gold, yellow, orange' },
  'genshin impact': { currency: 'Genesis Crystals', icon: 'crystal gems', colors: 'purple, pink, blue' },
  'honkai star rail': { currency: 'Oneiric Shards', icon: 'purple crystal shards', colors: 'purple, blue, pink' },
  'valorant': { currency: 'VP', icon: 'red angular coins', colors: 'red, black, white' },
  'call of duty': { currency: 'CP', icon: 'golden military coins', colors: 'gold, green, black' },
  'cod mobile': { currency: 'CP', icon: 'golden military coins', colors: 'gold, green, black' },
  'clash of clans': { currency: 'Gems', icon: 'green emerald gems', colors: 'green, gold' },
  'clash royale': { currency: 'Gems', icon: 'purple gems', colors: 'purple, gold, blue' },
  'roblox': { currency: 'Robux', icon: 'R$ coins', colors: 'green, white, black' },
  'blood strike': { currency: 'Gold', icon: 'golden coins with skull', colors: 'gold, red, black' },
  'arena of valor': { currency: 'Vouchers', icon: 'golden voucher tickets', colors: 'gold, purple, red' },
  'league of legends': { currency: 'RP', icon: 'riot points coins', colors: 'gold, blue, black' },
  'fortnite': { currency: 'V-Bucks', icon: 'blue V coins', colors: 'blue, purple, gold' },
  'minecraft': { currency: 'Minecoins', icon: 'pixelated gold coins', colors: 'gold, brown, green' },
  'zenless zone zero': { currency: 'Polychrome', icon: 'colorful crystals', colors: 'rainbow, neon, purple' },
  'wuthering waves': { currency: 'Lunite', icon: 'glowing moon crystals', colors: 'blue, silver, purple' },
  'blockman go': { currency: 'Gcubes', icon: 'pixelated cubes', colors: 'blue, orange, green' },
  'stumble guys': { currency: 'Gems', icon: 'colorful gems', colors: 'pink, blue, green' },
  'afk journey': { currency: 'Dragon Crystals', icon: 'dragon crystal gems', colors: 'purple, gold, green' },
  'magic chess': { currency: 'Diamonds', icon: 'chess piece with diamonds', colors: 'blue, gold, purple' },
};

function getGameCurrencyInfo(gameName: string): { currency: string; icon: string; colors: string } {
  const lowerName = gameName.toLowerCase();
  for (const [key, value] of Object.entries(GAME_CURRENCY_MAP)) {
    if (lowerName.includes(key)) {
      return value;
    }
  }
  // Default for unknown games
  return { currency: 'Coins', icon: 'golden coins', colors: 'gold, silver, bronze' };
}

function generatePromptForPackage(gameName: string, packageName: string, amount: string): string {
  const currencyInfo = getGameCurrencyInfo(gameName);
  const lowerPackage = packageName.toLowerCase();
  const lowerAmount = amount.toLowerCase();
  
  // Detect if it's a special item (card, pass, bundle, subscription)
  const isCard = lowerPackage.includes('card') || lowerPackage.includes('pass') || lowerAmount.includes('card') || lowerAmount.includes('pass');
  const isBundle = lowerPackage.includes('bundle') || lowerAmount.includes('bundle');
  const isSubscription = lowerPackage.includes('subscription') || lowerPackage.includes('monthly') || lowerAmount.includes('subscription') || lowerAmount.includes('monthly');
  const isWeekly = lowerPackage.includes('weekly') || lowerAmount.includes('weekly');
  
  if (isCard || isSubscription || isWeekly) {
    return `Create a premium game subscription/pass card icon for ${gameName}. 
Style: Glossy card with VIP/premium design, ${currencyInfo.colors} color scheme.
Features: Shiny metallic border, glowing effects, premium badge, game-themed decorations.
No text or numbers. Square icon format, mobile game quality, highly detailed 3D render.`;
  }
  
  if (isBundle) {
    return `Create a game bundle/package icon for ${gameName}.
Style: Multiple items stacked together - ${currencyInfo.icon} with bonus items, gift box design.
Colors: ${currencyInfo.colors} with golden accents.
No text or numbers. Square icon format, mobile game quality, highly detailed 3D render.`;
  }
  
  // Regular currency package - detect amount size for visual scaling
  const numericAmount = parseInt(amount.replace(/\D/g, '')) || 0;
  let sizeDescription = 'small pile';
  if (numericAmount >= 1000) sizeDescription = 'large pile';
  if (numericAmount >= 5000) sizeDescription = 'massive treasure pile';
  if (numericAmount >= 10000) sizeDescription = 'overflowing treasure chest';
  
  return `Create a ${gameName} in-game currency icon showing ${sizeDescription} of ${currencyInfo.icon}.
Style: Premium mobile game quality, ${currencyInfo.colors} color scheme.
Features: Glossy 3D gems/coins, sparkle effects, glowing aura, game-themed.
No text or numbers. Square icon format, highly detailed 3D render, app store quality.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gameName, gameId, packageId, packageName, amount, isSpecialPackage } = await req.json();
    
    if (!gameName || !packageId || !packageName) {
      return new Response(
        JSON.stringify({ error: 'gameName, packageId, and packageName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[GeneratePackageIcon] Generating for: ${gameName} - ${packageName}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = generatePromptForPackage(gameName, packageName, amount || packageName);
    console.log(`[GeneratePackageIcon] Prompt: ${prompt}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please wait and try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error(`[GeneratePackageIcon] API error: ${response.status} - ${errorText}`);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      console.error('[GeneratePackageIcon] No image in response');
      throw new Error('No image generated');
    }

    // Upload to storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `packages/${packageId}-${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('game-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('[GeneratePackageIcon] Upload error:', uploadError);
      return new Response(
        JSON.stringify({ success: true, imageUrl: imageData, uploaded: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: urlData } = supabase.storage
      .from('game-images')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Update the package record
    const tableName = isSpecialPackage ? 'special_packages' : 'packages';
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ icon: publicUrl })
      .eq('id', packageId);

    if (updateError) {
      console.error('[GeneratePackageIcon] Update error:', updateError);
    }

    console.log(`[GeneratePackageIcon] Icon uploaded: ${publicUrl}`);

    return new Response(
      JSON.stringify({ success: true, imageUrl: publicUrl, uploaded: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[GeneratePackageIcon] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate icon' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
