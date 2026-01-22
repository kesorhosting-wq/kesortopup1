const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PackageIconResult {
  packageId: string;
  packageName: string;
  gameName: string;
  iconUrl: string;
  source: string;
}

// Build search query for a package
function buildSearchQuery(gameName: string, packageName: string, amount: string): string {
  // Clean up game name (remove regional suffixes)
  const cleanGameName = gameName
    .replace(/ខ្មែរ/gi, '')
    .replace(/Cambodia/gi, '')
    .replace(/\s*SG\s*/gi, '')
    .replace(/\s*SEA\s*/gi, '')
    .trim();
  
  // Extract currency type from package name
  const currencyKeywords = ['diamond', 'diamonds', 'uc', 'cp', 'coin', 'coins', 'gem', 'gems', 'primogem', 'genesis', 'weekly', 'pass', 'membership'];
  const lowerName = packageName.toLowerCase();
  
  let currencyType = '';
  for (const keyword of currencyKeywords) {
    if (lowerName.includes(keyword)) {
      currencyType = keyword;
      break;
    }
  }
  
  // Build query
  if (currencyType) {
    return `${cleanGameName} ${currencyType} icon png transparent`;
  }
  return `${cleanGameName} ${amount} topup icon png`;
}

// Search using DuckDuckGo image search (no API key needed)
async function searchDuckDuckGo(query: string): Promise<string[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://duckduckgo.com/?q=${encodedQuery}&iax=images&ia=images`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });
    
    if (!response.ok) return [];
    
    const html = await response.text();
    
    // Extract image URLs from the response
    const imageUrls: string[] = [];
    const imgRegex = /https?:\/\/[^"'\s]+\.(?:png|jpg|jpeg|webp)/gi;
    let match;
    
    while ((match = imgRegex.exec(html)) !== null && imageUrls.length < 5) {
      const url = match[0];
      // Filter for likely icon images
      if (!url.includes('duckduckgo') && !url.includes('favicon')) {
        imageUrls.push(url);
      }
    }
    
    return imageUrls;
  } catch (e) {
    console.error('DuckDuckGo search error:', e);
    return [];
  }
}

// Search using Google Custom Search (if API available)
async function searchGoogle(query: string, apiKey?: string): Promise<string[]> {
  if (!apiKey) return [];
  
  try {
    // Use Google's image search
    const encodedQuery = encodeURIComponent(query + ' icon');
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodedQuery}&searchType=image&imgSize=medium&key=${apiKey}&cx=YOUR_CX`;
    
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    return (data.items || []).slice(0, 5).map((item: any) => item.link);
  } catch (e) {
    return [];
  }
}

// Search for game currency icons from known sources
async function searchKnownSources(gameName: string, currencyType: string): Promise<string[]> {
  const results: string[] = [];
  const cleanGameName = gameName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Known icon sources for popular games
  const knownIcons: Record<string, Record<string, string[]>> = {
    'mobilelegends': {
      'diamond': [
        'https://static.wikia.nocookie.net/mobile-legends/images/d/d4/Diamond.png',
        'https://i.imgur.com/diamond_ml.png',
      ],
    },
    'freefire': {
      'diamond': [
        'https://static.wikia.nocookie.net/freefire/images/diamond.png',
      ],
    },
    'pubg': {
      'uc': [
        'https://static.wikia.nocookie.net/pubg/images/uc.png',
      ],
    },
    'genshin': {
      'primogem': [
        'https://static.wikia.nocookie.net/gensin-impact/images/primogem.png',
      ],
      'genesis': [
        'https://static.wikia.nocookie.net/gensin-impact/images/genesis_crystal.png',
      ],
    },
  };
  
  // Check if we have known icons
  for (const [game, currencies] of Object.entries(knownIcons)) {
    if (cleanGameName.includes(game)) {
      for (const [currency, urls] of Object.entries(currencies)) {
        if (currencyType.includes(currency)) {
          results.push(...urls);
        }
      }
    }
  }
  
  return results;
}

// Use Bing image search
async function searchBing(query: string): Promise<string[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.bing.com/images/search?q=${encodedQuery}&qft=+filterui:imagesize-medium`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      }
    });
    
    if (!response.ok) return [];
    
    const html = await response.text();
    const imageUrls: string[] = [];
    
    // Extract murl (media URL) from Bing's response
    const murlRegex = /murl&quot;:&quot;(https?:\/\/[^&]+)/gi;
    let match;
    
    while ((match = murlRegex.exec(html)) !== null && imageUrls.length < 10) {
      const url = match[1].replace(/\\u002f/g, '/');
      if (url.match(/\.(png|jpg|jpeg|webp)/i)) {
        imageUrls.push(url);
      }
    }
    
    return imageUrls;
  } catch (e) {
    console.error('Bing search error:', e);
    return [];
  }
}

// Validate if URL is accessible
async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type') || '';
    return response.ok && contentType.includes('image');
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { packages } = await req.json();
    
    if (!packages || !Array.isArray(packages)) {
      return new Response(
        JSON.stringify({ success: false, error: 'packages array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[SearchPackageIcons] Searching for', packages.length, 'packages');

    const results: PackageIconResult[] = [];

    for (const pkg of packages) {
      const { packageId, packageName, gameName, amount } = pkg;
      
      // Build search query
      const query = buildSearchQuery(gameName, packageName, amount);
      console.log('[SearchPackageIcons] Query:', query);

      // Search multiple sources
      const [bingResults] = await Promise.all([
        searchBing(query),
      ]);

      // Combine and dedupe results
      const allUrls = [...new Set([...bingResults])];
      
      // Find first valid image
      for (const url of allUrls.slice(0, 5)) {
        const isValid = await validateImageUrl(url);
        if (isValid) {
          results.push({
            packageId,
            packageName,
            gameName,
            iconUrl: url,
            source: 'web-search',
          });
          break;
        }
      }

      // Small delay between searches
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('[SearchPackageIcons] Found', results.length, 'icons');

    return new Response(
      JSON.stringify({
        success: true,
        results,
        totalSearched: packages.length,
        totalFound: results.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[SearchPackageIcons] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});