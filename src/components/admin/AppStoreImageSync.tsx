import React, { useState } from 'react';
import { Smartphone, Loader2, Download, Apple, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AppStoreImageSyncProps {
  gameName: string;
  gameId: string;
  onImageSynced: (imageUrl: string) => void;
  variant?: 'button' | 'icon';
}

const AppStoreImageSync: React.FC<AppStoreImageSyncProps> = ({
  gameName,
  gameId,
  onImageSynced,
  variant = 'button'
}) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async (source: 'both' | 'appstore' | 'playstore') => {
    if (!gameName.trim()) {
      toast({ 
        title: "Game name required", 
        description: "Please enter a game name first",
        variant: "destructive" 
      });
      return;
    }

    setIsSyncing(true);
    
    const sourceLabel = source === 'both' ? 'App Stores' : 
                        source === 'appstore' ? 'App Store' : 'Play Store';
    
    try {
      toast({ 
        title: "📱 Searching...", 
        description: `Looking for ${gameName} on ${sourceLabel}` 
      });

      const { data, error } = await supabase.functions.invoke('sync-app-store-image', {
        body: { gameName, gameId, source }
      });

      if (error) throw error;

      if (data?.success && data?.imageUrl) {
        onImageSynced(data.imageUrl);
        toast({ 
          title: "✅ Icon synced!", 
          description: `Found on ${data.source}${data.uploaded ? ' and saved' : ''}`
        });
      } else {
        throw new Error(data?.error || 'No icon found');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({ 
        title: "Sync failed", 
        description: error.message || "Could not find game icon",
        variant: "destructive" 
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (variant === 'icon') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={isSyncing}
            className="border-green-500/50 text-green-600 hover:bg-green-500/10"
            title="Sync from App Store / Play Store"
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Smartphone className="w-4 h-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleSync('both')} className="gap-2">
            <Download className="w-4 h-4" />
            Search Both Stores
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSync('appstore')} className="gap-2">
            <Apple className="w-4 h-4" />
            App Store Only
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSync('playstore')} className="gap-2">
            <PlayCircle className="w-4 h-4" />
            Play Store Only
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isSyncing}
          className="border-green-500/50 text-green-600 hover:bg-green-500/10 gap-2"
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4" />
              Sync from Store
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleSync('both')} className="gap-2">
          <Download className="w-4 h-4" />
          Search Both Stores
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSync('appstore')} className="gap-2">
          <Apple className="w-4 h-4" />
          App Store Only
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSync('playstore')} className="gap-2">
          <PlayCircle className="w-4 h-4" />
          Play Store Only
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Bulk sync component
export const AppStoreBulkSync: React.FC<{
  games: Array<{ id: string; name: string; image: string }>;
  onComplete: () => void;
}> = ({ games, onComplete }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const gamesWithoutImages = games.filter(g => !g.image || g.image.trim() === '');

  const handleBulkSync = async () => {
    if (gamesWithoutImages.length === 0) {
      toast({ title: "All games have images!", description: "Nothing to sync" });
      return;
    }

    const confirmed = window.confirm(
      `Sync icons from App Stores for ${gamesWithoutImages.length} games? This may take a few minutes.`
    );
    
    if (!confirmed) return;

    setIsSyncing(true);
    setProgress({ current: 0, total: gamesWithoutImages.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < gamesWithoutImages.length; i++) {
      const game = gamesWithoutImages[i];
      setProgress({ current: i + 1, total: gamesWithoutImages.length });

      try {
        const { data, error } = await supabase.functions.invoke('sync-app-store-image', {
          body: { gameName: game.name, gameId: game.id, source: 'both' }
        });

        if (error || !data?.success) {
          failCount++;
          console.error(`Failed to sync for ${game.name}:`, error || data?.error);
        } else {
          successCount++;
        }
      } catch (err) {
        failCount++;
        console.error(`Error syncing for ${game.name}:`, err);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setIsSyncing(false);
    
    toast({
      title: "Bulk sync complete!",
      description: `Synced ${successCount} icons. ${failCount > 0 ? `${failCount} not found.` : ''}`,
    });

    onComplete();
  };

  return (
    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4 mt-3">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Smartphone className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">App Store Sync</h3>
            <p className="text-xs text-muted-foreground">
              Fetch official logos from Play Store / App Store
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleBulkSync}
          disabled={isSyncing || gamesWithoutImages.length === 0}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white gap-2"
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Syncing {progress.current}/{progress.total}...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Sync All Missing ({gamesWithoutImages.length})
            </>
          )}
        </Button>
      </div>
      
      {isSyncing && (
        <div className="mt-3">
          <div className="w-full bg-green-500/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AppStoreImageSync;