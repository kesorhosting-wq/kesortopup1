import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PackageIcon {
  gameName: string;
  packageName: string;
  iconUrl: string;
  amount?: string;
}

// Normalize game name for matching (remove ខ្មែរ, SG, SEA, etc.)
function normalizeGameName(name: string): string {
  return name
    .replace(/ខ្មែរ/gi, '')
    .replace(/Cambodia/gi, '')
    .replace(/\s*SG\s*/gi, '')
    .replace(/\s*SEA\s*/gi, '')
    .replace(/\s*-\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Normalize package name for matching
function normalizePackageName(name: string): string {
  return name
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Extract amount from package name
function extractAmount(name: string): string {
  const match = name.match(/(\d+[\d,\.]*)/);
  return match ? match[1].replace(/,/g, '') : '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gameName, mode } = await req.json();
    
    console.log('[ScrapeKiraIcons] Starting scrape for:', gameName || 'all games', 'mode:', mode);

    // Fetch the main page to get game links
    const baseUrl = 'https://kiragamestore.com';
    
    // First, let's fetch the main page to find game URLs
    const mainResponse = await fetch(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      }
    });

    if (!mainResponse.ok) {
      throw new Error(`Failed to fetch main page: ${mainResponse.status}`);
    }

    const mainHtml = await mainResponse.text();
    console.log('[ScrapeKiraIcons] Fetched main page, length:', mainHtml.length);

    // Extract game links from the main page
    // Looking for links like /product/free-fire, /product/mobile-legends, etc.
    const gameLinks: { name: string; url: string }[] = [];
    
    // Match product links with game names
    const productLinkRegex = /<a[^>]*href="([^"]*\/product\/[^"]+)"[^>]*>([^<]*)<\/a>/gi;
    let match;
    
    while ((match = productLinkRegex.exec(mainHtml)) !== null) {
      const url = match[1].startsWith('http') ? match[1] : `${baseUrl}${match[1]}`;
      const name = match[2].trim();
      if (name && !gameLinks.find(g => g.url === url)) {
        gameLinks.push({ name, url });
      }
    }

    // Also try to find game cards/items with images
    const gameCardRegex = /<div[^>]*class="[^"]*game[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<\/div>/gi;
    while ((match = gameCardRegex.exec(mainHtml)) !== null) {
      const url = match[1].startsWith('http') ? match[1] : `${baseUrl}${match[1]}`;
      if (!gameLinks.find(g => g.url === url)) {
        gameLinks.push({ name: 'Unknown', url });
      }
    }

    console.log('[ScrapeKiraIcons] Found game links:', gameLinks.length);

    // If mode is 'discover', just return the game list
    if (mode === 'discover') {
      return new Response(
        JSON.stringify({
          success: true,
          games: gameLinks,
          html_sample: mainHtml.substring(0, 5000)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For specific game, try to find and scrape its page
    const packageIcons: PackageIcon[] = [];

    // Try different URL patterns for the game
    const normalizedSearch = normalizeGameName(gameName || '');
    const urlPatterns = [
      `${baseUrl}/product/${normalizedSearch.replace(/\s+/g, '-')}`,
      `${baseUrl}/${normalizedSearch.replace(/\s+/g, '-')}`,
      `${baseUrl}/game/${normalizedSearch.replace(/\s+/g, '-')}`,
    ];

    // Also check if we found a matching link
    const matchedLink = gameLinks.find(g => 
      normalizeGameName(g.name).includes(normalizedSearch) ||
      normalizedSearch.includes(normalizeGameName(g.name))
    );

    if (matchedLink) {
      urlPatterns.unshift(matchedLink.url);
    }

    let gamePageHtml = '';
    let fetchedUrl = '';

    for (const url of urlPatterns) {
      try {
        console.log('[ScrapeKiraIcons] Trying URL:', url);
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          }
        });
        
        if (response.ok) {
          gamePageHtml = await response.text();
          fetchedUrl = url;
          console.log('[ScrapeKiraIcons] Successfully fetched:', url);
          break;
        }
      } catch (e) {
        console.log('[ScrapeKiraIcons] Failed to fetch:', url);
      }
    }

    if (!gamePageHtml) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Could not find game page for: ${gameName}`,
          triedUrls: urlPatterns,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse package icons from the game page
    // Look for patterns like package cards with images
    
    // Pattern 1: <img> tags with package-related classes or nearby text
    const imgRegex = /<img[^>]*src="([^"]+)"[^>]*(?:alt="([^"]*)")?[^>]*>/gi;
    const imgMatches: { src: string; alt: string }[] = [];
    
    while ((match = imgRegex.exec(gamePageHtml)) !== null) {
      const src = match[1];
      const alt = match[2] || '';
      
      // Filter for likely package icons (not logos, banners, etc.)
      if (src && (
        src.includes('package') ||
        src.includes('diamond') ||
        src.includes('coin') ||
        src.includes('uc') ||
        src.includes('cp') ||
        src.includes('gem') ||
        alt.toLowerCase().includes('diamond') ||
        alt.toLowerCase().includes('package') ||
        /\d+/.test(alt)
      )) {
        const fullSrc = src.startsWith('http') ? src : `${baseUrl}${src.startsWith('/') ? '' : '/'}${src}`;
        imgMatches.push({ src: fullSrc, alt });
      }
    }

    // Pattern 2: Look for product/package cards structure
    const packageCardRegex = /<div[^>]*class="[^"]*(?:product|package|item)[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?(?:<span[^>]*>|<p[^>]*>|<h\d[^>]*>)([^<]+)/gi;
    
    while ((match = packageCardRegex.exec(gamePageHtml)) !== null) {
      const src = match[1];
      const name = match[2].trim();
      const fullSrc = src.startsWith('http') ? src : `${baseUrl}${src.startsWith('/') ? '' : '/'}${src}`;
      
      packageIcons.push({
        gameName: gameName || 'Unknown',
        packageName: name,
        iconUrl: fullSrc,
        amount: extractAmount(name),
      });
    }

    // Also add any diamond/coin images we found
    imgMatches.forEach(img => {
      if (!packageIcons.find(p => p.iconUrl === img.src)) {
        packageIcons.push({
          gameName: gameName || 'Unknown',
          packageName: img.alt || 'Package',
          iconUrl: img.src,
          amount: extractAmount(img.alt),
        });
      }
    });

    console.log('[ScrapeKiraIcons] Found package icons:', packageIcons.length);

    return new Response(
      JSON.stringify({
        success: true,
        gameName,
        fetchedUrl,
        packageIcons,
        totalFound: packageIcons.length,
        html_sample: gamePageHtml.substring(0, 3000), // For debugging
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[ScrapeKiraIcons] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});