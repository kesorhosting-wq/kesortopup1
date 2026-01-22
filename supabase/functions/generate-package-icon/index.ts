import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pollinations.ai - Free unlimited image generation, no API key required
function getPollinationsUrl(prompt: string, width = 512, height = 512): string {
  const encodedPrompt = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true`;
}

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
  return { currency: 'Coins', icon: 'golden coins', colors: 'gold, silver, bronze' };
}

function generatePromptForPackage(gameName: string, packageName: string, amount: string): string {
  const currencyInfo = getGameCurrencyInfo(gameName);
  const lowerPackage = packageName.toLowerCase();
  const lowerAmount = amount.toLowerCase();
  
  const isCard = lowerPackage.includes('card') || lowerPackage.includes('pass') || lowerAmount.includes('card') || lowerAmount.includes('pass');
  const isBundle = lowerPackage.includes('bundle') || lowerAmount.includes('bundle');
  const isSubscription = lowerPackage.includes('subscription') || lowerPackage.includes('monthly') || lowerAmount.includes('subscription') || lowerAmount.includes('monthly');
  const isWeekly = lowerPackage.includes('weekly') || lowerAmount.includes('weekly');
  
  if (isCard || isSubscription || isWeekly) {
    return `Premium VIP game pass card icon, glossy metallic border, ${currencyInfo.colors} colors, shiny premium badge, glowing effects, square format, mobile game quality, 3D render, no text`;
  }
  
  if (isBundle) {
    return `Game bundle package icon with ${currencyInfo.icon}, gift box design, ${currencyInfo.colors} colors with golden accents, square format, mobile game quality, 3D render, no text`;
  }
  
  const numericAmount = parseInt(amount.replace(/\D/g, '')) || 0;
  let sizeDescription = 'small pile';
  if (numericAmount >= 1000) sizeDescription = 'large pile';
  if (numericAmount >= 5000) sizeDescription = 'massive treasure pile';
  if (numericAmount >= 10000) sizeDescription = 'overflowing treasure chest';
  
  return `${sizeDescription} of ${currencyInfo.icon}, ${currencyInfo.colors} colors, glossy 3D gems coins, sparkle effects, glowing aura, square icon, mobile game quality, highly detailed 3D render, no text`;
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

    const prompt = generatePromptForPackage(gameName, packageName, amount || packageName);
    console.log(`[GeneratePackageIcon] Using Pollinations.ai (Free Unlimited)`);

    // Get image URL from Pollinations
    const imageUrl = getPollinationsUrl(prompt, 512, 512);
    
    // Download the generated image
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      console.error(`[GeneratePackageIcon] Pollinations error: ${imageResponse.status}`);
      throw new Error(`Image generation failed: ${imageResponse.status}`);
    }

    const imageBuffer = new Uint8Array(await imageResponse.arrayBuffer());
    console.log(`[GeneratePackageIcon] Image downloaded, size: ${imageBuffer.length} bytes`);

    // Upload to storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
        JSON.stringify({ success: true, imageUrl: imageUrl, uploaded: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: urlData } = supabase.storage
      .from('game-images')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

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
