import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Common region identifiers to strip from game names
const REGION_PATTERNS = [
  // Countries/Regions at end with various separators
  /\s*[-–—]\s*(SG|Singapore|Cambodia|KH|VN|Vietnam|MY|Malaysia|TH|Thailand|ID|Indonesia|PH|Philippines|TW|Taiwan|JP|Japan|KR|Korea|CN|China|HK|Hong Kong|IN|India|BR|Brazil|LA|Laos|MM|Myanmar|BD|Bangladesh|PK|Pakistan|NP|Nepal|LK|Sri Lanka|Global|SEA|MENA|EU|NA|LATAM)\s*$/i,
  // Countries in parentheses
  /\s*\((SG|Singapore|Cambodia|KH|VN|Vietnam|MY|Malaysia|TH|Thailand|ID|Indonesia|PH|Philippines|TW|Taiwan|JP|Japan|KR|Korea|CN|China|HK|Hong Kong|IN|India|BR|Brazil|LA|Laos|MM|Myanmar|BD|Bangladesh|PK|Pakistan|NP|Nepal|LK|Sri Lanka|Global|SEA|MENA|EU|NA|LATAM)\)\s*$/i,
  // Countries with colon separator
  /\s*:\s*(SG|Singapore|Cambodia|KH|VN|Vietnam|MY|Malaysia|TH|Thailand|ID|Indonesia|PH|Philippines|TW|Taiwan|JP|Japan|KR|Korea|CN|China|HK|Hong Kong|IN|India|BR|Brazil)\s*$/i,
  // Just space + 2-letter codes at end
  /\s+(SG|KH|VN|MY|TH|ID|PH|TW|JP|KR|CN|HK|IN|BR|LA|MM|BD|PK|NP|LK)\s*$/i,
];

// Normalize game name by stripping region identifiers
function normalizeGameName(gameName: string): string {
  let normalized = gameName.trim();
  
  // Apply each pattern to strip regional identifiers
  for (const pattern of REGION_PATTERNS) {
    normalized = normalized.replace(pattern, '');
  }
  
  // Clean up any trailing whitespace or separators
  normalized = normalized.replace(/\s*[-–—:]\s*$/, '').trim();
  
  console.log(`Normalized "${gameName}" -> "${normalized}"`);
  return normalized;
}

// Search iTunes App Store for app icon
async function searchAppStore(gameName: string): Promise<string | null> {
  try {
    const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(gameName)}&entity=software&limit=5`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Get the highest resolution icon (512x512)
      const app = data.results[0];
      // artworkUrl512 or artworkUrl100 scaled up
      const iconUrl = app.artworkUrl512 || app.artworkUrl100?.replace('100x100', '512x512');
      if (iconUrl) {
        console.log(`Found App Store icon for ${gameName}: ${iconUrl}`);
        return iconUrl;
      }
    }
    return null;
  } catch (error) {
    console.error('App Store search error:', error);
    return null;
  }
}

// Search Google Play Store by scraping the store page
async function searchPlayStore(gameName: string): Promise<string | null> {
  try {
    // Use Google's search to find the Play Store page
    const searchUrl = `https://play.google.com/store/search?q=${encodeURIComponent(gameName)}&c=apps`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.log('Play Store search returned non-OK status');
      return null;
    }
    
    const html = await response.text();
    
    // Look for app icon images in the HTML
    // Play Store icons typically have a specific pattern
    const iconPatterns = [
      /https:\/\/play-lh\.googleusercontent\.com\/[a-zA-Z0-9_-]+=[ws]\d+/g,
      /https:\/\/lh3\.googleusercontent\.com\/[a-zA-Z0-9_-]+=s\d+/g,
    ];
    
    for (const pattern of iconPatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        // Get the first match and scale it to 512
        let iconUrl = matches[0];
        iconUrl = iconUrl.replace(/=[ws]\d+/, '=w512');
        iconUrl = iconUrl.replace(/=s\d+/, '=s512');
        console.log(`Found Play Store icon for ${gameName}: ${iconUrl}`);
        return iconUrl;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Play Store search error:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gameName, gameId, source = 'both' } = await req.json();

    if (!gameName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Game name is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Normalize the game name to strip regional identifiers
    const searchName = normalizeGameName(gameName);
    console.log(`Searching app stores for: "${gameName}" -> normalized: "${searchName}" (source: ${source})`);

    let iconUrl: string | null = null;
    let foundSource = '';

    // Search based on preference using normalized name
    if (source === 'appstore' || source === 'both') {
      iconUrl = await searchAppStore(searchName);
      if (iconUrl) foundSource = 'App Store';
    }

    if (!iconUrl && (source === 'playstore' || source === 'both')) {
      iconUrl = await searchPlayStore(searchName);
      if (iconUrl) foundSource = 'Play Store';
    }

    if (!iconUrl) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `No icon found for "${gameName}" in app stores` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If gameId is provided, download and save to Supabase Storage
    if (gameId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      try {
        // Fetch the image
        const imageResponse = await fetch(iconUrl);
        if (!imageResponse.ok) {
          throw new Error('Failed to fetch icon image');
        }

        const imageData = await imageResponse.arrayBuffer();
        const uint8Array = new Uint8Array(imageData);
        
        // Determine content type
        const contentType = imageResponse.headers.get('content-type') || 'image/png';
        const extension = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
        
        const fileName = `${gameId}-appstore.${extension}`;
        const filePath = `games/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('game-images')
          .upload(filePath, uint8Array, {
            contentType,
            upsert: true
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          // Return the original URL if upload fails
          return new Response(
            JSON.stringify({ 
              success: true, 
              imageUrl: iconUrl,
              source: foundSource,
              uploaded: false,
              message: 'Icon found but storage upload failed'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('game-images')
          .getPublicUrl(filePath);

        // Update the game's image in the database
        const { error: updateError } = await supabase
          .from('games')
          .update({ image: publicUrl })
          .eq('id', gameId);

        if (updateError) {
          console.error('Database update error:', updateError);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            imageUrl: publicUrl,
            source: foundSource,
            uploaded: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (storageError) {
        console.error('Storage error:', storageError);
        // Return original URL if storage fails
        return new Response(
          JSON.stringify({ 
            success: true, 
            imageUrl: iconUrl,
            source: foundSource,
            uploaded: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Just return the found URL without saving
    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: iconUrl,
        source: foundSource,
        uploaded: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});