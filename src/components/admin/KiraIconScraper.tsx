import React, { useState } from 'react';
import { Download, Loader2, Search, ExternalLink, Check, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Game, Package, useSite } from '@/contexts/SiteContext';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ScrapedIcon {
  gameName: string;
  packageName: string;
  iconUrl: string;
  amount?: string;
}

interface KiraIconScraperProps {
  games: Game[];
  onComplete: () => void;
}

export const KiraIconScraper: React.FC<KiraIconScraperProps> = ({ games, onComplete }) => {
  const { updatePackage, updateSpecialPackage } = useSite();
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [scrapedIcons, setScrapedIcons] = useState<ScrapedIcon[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, game: '' });
  const [matchResults, setMatchResults] = useState<{
    packageId: string;
    packageName: string;
    gameName: string;
    matchedIcon?: ScrapedIcon;
    isSpecial: boolean;
  }[]>([]);

  // Normalize names for matching
  const normalizeName = (name: string): string => {
    return name
      .replace(/ខ្មែរ/gi, '')
      .replace(/Cambodia/gi, '')
      .replace(/\s*SG\s*/gi, '')
      .replace(/\s*SEA\s*/gi, '')
      .replace(/[^\w\s\d]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  };

  // Extract numeric amount from name
  const extractAmount = (name: string): number => {
    const match = name.match(/(\d+[\d,\.]*)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return 0;
  };

  // Find matching icon for a package
  const findMatchingIcon = (pkg: Package, gameName: string): ScrapedIcon | undefined => {
    const pkgNormalized = normalizeName(pkg.name);
    const pkgAmount = extractAmount(pkg.amount);
    const gameNormalized = normalizeName(gameName);

    return scrapedIcons.find(icon => {
      const iconNormalized = normalizeName(icon.packageName);
      const iconAmount = icon.amount ? parseFloat(icon.amount) : extractAmount(icon.packageName);
      const iconGameNormalized = normalizeName(icon.gameName);

      // Match by game first
      const gameMatches = 
        iconGameNormalized.includes(gameNormalized) || 
        gameNormalized.includes(iconGameNormalized);

      if (!gameMatches) return false;

      // Match by amount
      if (pkgAmount > 0 && iconAmount > 0 && pkgAmount === iconAmount) {
        return true;
      }

      // Match by name similarity
      if (pkgNormalized.includes(iconNormalized) || iconNormalized.includes(pkgNormalized)) {
        return true;
      }

      return false;
    });
  };

  // Scrape icons from Kira website
  const handleScrape = async () => {
    setIsLoading(true);
    setScrapedIcons([]);
    
    try {
      toast({ title: "🔍 Discovering games...", description: "Fetching from kiragamestore.com" });

      // First, discover what games are available
      const { data: discoverData, error: discoverError } = await supabase.functions.invoke('scrape-kira-icons', {
        body: { mode: 'discover' }
      });

      if (discoverError) throw discoverError;

      console.log('Discover result:', discoverData);

      // Now scrape each of our games
      const allIcons: ScrapedIcon[] = [];
      setProgress({ current: 0, total: games.length, game: '' });

      for (let i = 0; i < games.length; i++) {
        const game = games[i];
        setProgress({ current: i + 1, total: games.length, game: game.name });

        try {
          const { data, error } = await supabase.functions.invoke('scrape-kira-icons', {
            body: { gameName: game.name, mode: 'scrape' }
          });

          if (!error && data?.success && data?.packageIcons) {
            allIcons.push(...data.packageIcons);
            console.log(`Found ${data.packageIcons.length} icons for ${game.name}`);
          }
        } catch (e) {
          console.error(`Failed to scrape ${game.name}:`, e);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setScrapedIcons(allIcons);
      
      // Build match results
      const matches: typeof matchResults = [];
      
      games.forEach(game => {
        game.packages.forEach(pkg => {
          if (!pkg.icon || pkg.icon.trim() === '') {
            matches.push({
              packageId: pkg.id,
              packageName: pkg.name,
              gameName: game.name,
              matchedIcon: findMatchingIcon(pkg, game.name),
              isSpecial: false,
            });
          }
        });
        game.specialPackages.forEach(pkg => {
          if (!pkg.icon || pkg.icon.trim() === '') {
            matches.push({
              packageId: pkg.id,
              packageName: pkg.name,
              gameName: game.name,
              matchedIcon: findMatchingIcon(pkg, game.name),
              isSpecial: true,
            });
          }
        });
      });

      setMatchResults(matches);

      toast({
        title: "✅ Scraping complete!",
        description: `Found ${allIcons.length} icons. ${matches.filter(m => m.matchedIcon).length} packages matched.`,
      });

    } catch (error: any) {
      console.error('Scrape error:', error);
      toast({
        title: "Scraping failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Download and apply matched icons
  const handleApplyIcons = async () => {
    const matchedPackages = matchResults.filter(m => m.matchedIcon);
    
    if (matchedPackages.length === 0) {
      toast({ title: "No matches", description: "No packages matched with scraped icons" });
      return;
    }

    const confirmed = window.confirm(
      `Apply ${matchedPackages.length} icons to packages? This will download and save them to your storage.`
    );
    if (!confirmed) return;

    setIsSyncing(true);
    let successCount = 0;

    for (const match of matchedPackages) {
      if (!match.matchedIcon) continue;

      try {
        // Download the icon image
        const response = await fetch(match.matchedIcon.iconUrl);
        if (!response.ok) continue;

        const blob = await response.blob();
        const fileName = `kira-${match.packageId}-${Date.now()}.png`;
        const filePath = `packages/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('game-images')
          .upload(filePath, blob, {
            contentType: 'image/png',
            upsert: true,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('game-images')
          .getPublicUrl(filePath);

        // Update the package in database
        const game = games.find(g => g.name === match.gameName);
        if (!game) continue;

        if (match.isSpecial) {
          await updateSpecialPackage(game.id, match.packageId, { icon: urlData.publicUrl });
        } else {
          await updatePackage(game.id, match.packageId, { icon: urlData.publicUrl });
        }

        successCount++;
      } catch (e) {
        console.error(`Failed to apply icon for ${match.packageName}:`, e);
      }
    }

    setIsSyncing(false);
    toast({
      title: "✅ Icons applied!",
      description: `Successfully updated ${successCount} packages.`,
    });
    
    onComplete();
  };

  const matchedCount = matchResults.filter(m => m.matchedIcon).length;
  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Download className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              Kira Game Store Icon Scraper
              <a 
                href="https://kiragamestore.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </h3>
            <p className="text-xs text-muted-foreground">
              Scrape package icons from kiragamestore.com
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleScrape}
            disabled={isLoading || isSyncing}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Scrape Icons
              </>
            )}
          </Button>

          {matchedCount > 0 && (
            <Button
              onClick={handleApplyIcons}
              disabled={isLoading || isSyncing}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white gap-2"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Apply {matchedCount} Icons
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="mt-4 space-y-2">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Scraping: {progress.game} ({progress.current}/{progress.total})
          </p>
        </div>
      )}

      {matchResults.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">
            Match Results: {matchedCount} matched / {matchResults.length} packages without icons
          </div>
          <ScrollArea className="h-48 rounded border border-border/50 p-2">
            <div className="space-y-1">
              {matchResults.map((match, i) => (
                <div 
                  key={i} 
                  className={`flex items-center gap-2 text-xs p-2 rounded ${
                    match.matchedIcon ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}
                >
                  {match.matchedIcon ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <X className="w-3 h-3 text-red-500" />
                  )}
                  <span className="font-medium">{match.gameName}</span>
                  <span className="text-muted-foreground">→</span>
                  <span>{match.packageName}</span>
                  {match.matchedIcon && (
                    <img 
                      src={match.matchedIcon.iconUrl} 
                      alt="" 
                      className="w-6 h-6 rounded object-cover ml-auto"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {scrapedIcons.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">
            All Scraped Icons: {scrapedIcons.length}
          </div>
          <div className="flex flex-wrap gap-2">
            {scrapedIcons.slice(0, 20).map((icon, i) => (
              <img
                key={i}
                src={icon.iconUrl}
                alt={icon.packageName}
                title={`${icon.gameName} - ${icon.packageName}`}
                className="w-10 h-10 rounded object-cover border border-border/50"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            ))}
            {scrapedIcons.length > 20 && (
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs">
                +{scrapedIcons.length - 20}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default KiraIconScraper;