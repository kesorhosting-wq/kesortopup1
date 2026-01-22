import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Raphael AI - Free unlimited image generation using FLUX.1-Dev model
const RAPHAEL_API_URL = 'https://api.raphael.app/v1/generate';

serve(async (req) => {
  // Handle CORS preflight
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
    const prompt = `Create a high-quality mobile game icon for "${gameName}". 
The icon should be:
- Professional game app store quality
- Vibrant and eye-catching with rich colors
- Square format suitable for app icons
- Clean, modern design with clear visual elements
- Related to the game's theme and genre
- No text or letters in the image
- Glossy or polished finish
Style: Modern mobile game icon, AAA quality, detailed artwork`;

    console.log(`[GenerateGameImage] Using Raphael AI (Free Unlimited)`);

    // Call Raphael AI for free unlimited image generation
    const response = await fetch(RAPHAEL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        width: 512,
        height: 512,
        num_images: 1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GenerateGameImage] Raphael API error: ${response.status} - ${errorText}`);
      
      // Try alternative free API if Raphael fails
      console.log(`[GenerateGameImage] Trying alternative API...`);
      
      const altResponse = await fetch('https://api.freepik.com/v1/ai/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          negative_prompt: 'text, letters, words, blurry, low quality',
          image: { size: 'square' }
        })
      });
      
      if (!altResponse.ok) {
        throw new Error(`Image generation failed: ${response.status}`);
      }
      
      const altData = await altResponse.json();
      const imageUrl = altData.data?.[0]?.url || altData.image_url;
      
      if (!imageUrl) {
        throw new Error('No image generated from alternative API');
      }
      
      return await processAndUploadImage(imageUrl, gameId, false);
    }

    const data = await response.json();
    console.log(`[GenerateGameImage] Raphael response received`);

    // Extract the image URL from Raphael AI response
    const imageUrl = data.image_url || data.images?.[0]?.url || data.output?.url;
    
    if (!imageUrl) {
      console.error('[GenerateGameImage] No image in response:', JSON.stringify(data));
      throw new Error('No image generated');
    }

    return await processAndUploadImage(imageUrl, gameId, true);

  } catch (error: any) {
    console.error('[GenerateGameImage] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate image' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processAndUploadImage(imageUrl: string, gameId: string | null, isBase64: boolean): Promise<Response> {
  // If gameId is provided, upload to storage and update the game
  if (gameId) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let imageBuffer: Uint8Array;
    
    if (imageUrl.startsWith('data:')) {
      // Handle base64 image
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    } else {
      // Handle URL - download the image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error('Failed to download generated image');
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      imageBuffer = new Uint8Array(arrayBuffer);
    }
    
    // Generate unique filename
    const fileName = `games/${gameId}-${Date.now()}.png`;
    
    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('game-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('[GenerateGameImage] Upload error:', uploadError);
      // Return the original image URL if upload fails
      return new Response(
        JSON.stringify({ 
          success: true, 
          imageUrl: imageUrl,
          uploaded: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('game-images')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Update the game record
    const { error: updateError } = await supabase
      .from('games')
      .update({ image: publicUrl })
      .eq('id', gameId);

    if (updateError) {
      console.error('[GenerateGameImage] Update error:', updateError);
    }

    console.log(`[GenerateGameImage] Image uploaded and game updated: ${publicUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: publicUrl,
        uploaded: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Return image URL if no gameId provided
  return new Response(
    JSON.stringify({ 
      success: true, 
      imageUrl: imageUrl,
      uploaded: false 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
