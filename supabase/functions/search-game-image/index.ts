import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RAWGGame {
  id: number;
  name: string;
  background_image: string | null;
  released: string | null;
  rating: number;
}

interface RAWGResponse {
  count: number;
  results: RAWGGame[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchQuery, limit = 5 } = await req.json();

    if (!searchQuery || typeof searchQuery !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Search query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const RAWG_API_KEY = Deno.env.get('RAWG_API_KEY');
    
    if (!RAWG_API_KEY) {
      console.error('RAWG_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'RAWG API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search RAWG API for games
    const searchUrl = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(searchQuery)}&page_size=${limit}`;
    
    console.log('Searching RAWG for:', searchQuery);
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('RAWG API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to search game database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: RAWGResponse = await response.json();
    
    // Transform results to simplified format
    const games = data.results.map(game => ({
      id: game.id,
      name: game.name,
      image: game.background_image,
      released: game.released,
      rating: game.rating,
    })).filter(game => game.image); // Only include games with images

    console.log(`Found ${games.length} games for query: ${searchQuery}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        games,
        total: data.count 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Search error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
