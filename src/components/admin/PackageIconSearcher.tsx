import React, { useState } from 'react';
import { Search, Loader2, Download, Check, X, Globe, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Game, Package, useSite } from '@/contexts/SiteContext';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SearchResult {
  packageId: string;
  packageName: string;
  gameName: string;
  iconUrl: string;
  source: string;
}

interface PackageIconSearcherProps {
  games: Game[];
  onComplete: () => void;
}

export const PackageIconSearcher: React.FC<PackageIconSearcherProps> = ({ games, onComplete }) => {
  const { updatePackage, updateSpecialPackage } = useSite();
  const [isSearching, setIsSearching] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Get all packages without icons
  const getPackagesWithoutIcons = () => {
    const packages: Array<{
      packageId: string;
      packageName: string;
      gameName: string;
      gameId: string;
      amount: string;
      isSpecial: boolean;
    }> = [];

    games.forEach(game => {
      game.packages.forEach(pkg => {
        if (!pkg.icon || pkg.icon.trim() === '') {
          packages.push({
            packageId: pkg.id,
            packageName: pkg.name,
            gameName: game.name,
            gameId: game.id,
            amount: pkg.amount,
            isSpecial: false,
          });
        }
      });
      game.specialPackages.forEach(pkg => {
        if (!pkg.icon || pkg.icon.trim() === '') {
          packages.push({
            packageId: pkg.id,
            packageName: pkg.name,
            gameName: game.name,
            gameId: game.id,
            amount: pkg.amount,
            isSpecial: true,
          });
        }
      });
    });

    return packages;
  };

  const packagesWithoutIcons = getPackagesWithoutIcons();

  // Search for icons
  const handleSearch = async () => {
    if (packagesWithoutIcons.length === 0) {
      toast({ title: "All packages have icons!", description: "Nothing to search for" });
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setProgress({ current: 0, total: packagesWithoutIcons.length });

    try {
      toast({ title: "🔍 Searching for icons...", description: "Searching across the web" });

      // Process in batches of 5
      const batchSize = 5;
      const allResults: SearchResult[] = [];

      for (let i = 0; i < packagesWithoutIcons.length; i += batchSize) {
        const batch = packagesWithoutIcons.slice(i, i + batchSize);
        setProgress({ current: Math.min(i + batchSize, packagesWithoutIcons.length), total: packagesWithoutIcons.length });

        try {
          const { data, error } = await supabase.functions.invoke('search-package-icons', {
            body: {
              packages: batch.map(p => ({
                packageId: p.packageId,
                packageName: p.packageName,
                gameName: p.gameName,
                amount: p.amount,
              }))
            }
          });

          if (!error && data?.success && data?.results) {
            allResults.push(...data.results);
          }
        } catch (e) {
          console.error('Batch search error:', e);
        }

        // Delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setSearchResults(allResults);

      toast({
        title: "✅ Search complete!",
        description: `Found ${allResults.length} icons for ${packagesWithoutIcons.length} packages`,
      });

    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Apply found icons
  const handleApplyIcons = async () => {
    if (searchResults.length === 0) {
      toast({ title: "No icons to apply", description: "Search for icons first" });
      return;
    }

    const confirmed = window.confirm(
      `Apply ${searchResults.length} icons to packages? This will download and save them to your storage.`
    );
    if (!confirmed) return;

    setIsApplying(true);
    let successCount = 0;

    for (const result of searchResults) {
      try {
        // Download the icon
        const response = await fetch(result.iconUrl);
        if (!response.ok) continue;

        const blob = await response.blob();
        const fileName = `search-${result.packageId}-${Date.now()}.png`;
        const filePath = `packages/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('game-images')
          .upload(filePath, blob, {
            contentType: blob.type || 'image/png',
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

        // Find the game and update package
        const pkg = packagesWithoutIcons.find(p => p.packageId === result.packageId);
        if (!pkg) continue;

        if (pkg.isSpecial) {
          await updateSpecialPackage(pkg.gameId, pkg.packageId, { icon: urlData.publicUrl });
        } else {
          await updatePackage(pkg.gameId, pkg.packageId, { icon: urlData.publicUrl });
        }

        successCount++;
      } catch (e) {
        console.error(`Failed to apply icon for ${result.packageName}:`, e);
      }
    }

    setIsApplying(false);
    toast({
      title: "✅ Icons applied!",
      description: `Successfully updated ${successCount} packages.`,
    });

    onComplete();
  };

  // Remove a result from the list
  const removeResult = (packageId: string) => {
    setSearchResults(prev => prev.filter(r => r.packageId !== packageId));
  };

  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Card className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Globe className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Web Package Icon Search</h3>
            <p className="text-xs text-muted-foreground">
              {packagesWithoutIcons.length} packages without icons
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSearch}
            disabled={isSearching || isApplying || packagesWithoutIcons.length === 0}
            className="gap-2"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search Icons
              </>
            )}
          </Button>

          {searchResults.length > 0 && (
            <Button
              onClick={handleApplyIcons}
              disabled={isSearching || isApplying}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white gap-2"
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Apply {searchResults.length} Icons
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {isSearching && (
        <div className="mt-4 space-y-2">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Searching: {progress.current}/{progress.total} packages
          </p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">
            Found Icons: {searchResults.length}
          </div>
          <ScrollArea className="h-48 rounded border border-border/50 p-2">
            <div className="space-y-1">
              {searchResults.map((result, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs p-2 rounded bg-emerald-500/10"
                >
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="font-medium">{result.gameName}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="flex-1">{result.packageName}</span>
                  <img
                    src={result.iconUrl}
                    alt=""
                    className="w-8 h-8 rounded object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      removeResult(result.packageId);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeResult(result.packageId)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {packagesWithoutIcons.length > 0 && searchResults.length === 0 && !isSearching && (
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Packages needing icons:</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {packagesWithoutIcons.slice(0, 10).map((pkg, i) => (
              <span key={i} className="bg-muted px-2 py-0.5 rounded">
                {pkg.gameName} - {pkg.packageName}
              </span>
            ))}
            {packagesWithoutIcons.length > 10 && (
              <span className="bg-muted px-2 py-0.5 rounded">
                +{packagesWithoutIcons.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default PackageIconSearcher;