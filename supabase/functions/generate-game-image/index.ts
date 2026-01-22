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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gameName, gameId } = await req.json();
    
    if (!gameName) {
      return new Response(
        JSON.stringify({ error: 'Game name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[GenerateGameImage] Generating image for: ${gameName}`);

    // Create a detailed prompt for game icon generation
    const prompt = `Professional mobile game app icon for "${gameName}", vibrant colors, square format, clean modern design, glossy finish, AAA quality game artwork, no text, no letters, highly detailed 3D render`;

    console.log(`[GenerateGameImage] Using Pollinations.ai (Free Unlimited)`);

    // Get image URL from Pollinations
    const imageUrl = getPollinationsUrl(prompt, 512, 512);
    
    // Download the generated image
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      console.error(`[GenerateGameImage] Pollinations error: ${imageResponse.status}`);
      throw new Error(`Image generation failed: ${imageResponse.status}`);
    }

    const imageBuffer = new Uint8Array(await imageResponse.arrayBuffer());
    console.log(`[GenerateGameImage] Image downloaded, size: ${imageBuffer.length} bytes`);

    // If gameId is provided, upload to storage and update the game
    if (gameId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const fileName = `games/${gameId}-${Date.now()}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('game-images')
        .upload(fileName, imageBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error('[GenerateGameImage] Upload error:', uploadError);
        return new Response(
          JSON.stringify({ 
            success: true, 
            imageUrl: imageUrl,
            uploaded: false 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: urlData } = supabase.storage
        .from('game-images')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('games')
        .update({ image: publicUrl })
        .eq('id', gameId);

      if (updateError) {
        console.error('[GenerateGameImage] Update error:', updateError);
      }

      console.log(`[GenerateGameImage] Image uploaded: ${publicUrl}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          imageUrl: publicUrl,
          uploaded: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: imageUrl,
        uploaded: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[GenerateGameImage] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate image' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
