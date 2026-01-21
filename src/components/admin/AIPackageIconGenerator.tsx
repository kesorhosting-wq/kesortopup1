import React, { useState } from 'react';
import { Wand2, Loader2, Sparkles, ImageIcon, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Game, Package } from '@/contexts/SiteContext';
import { Progress } from '@/components/ui/progress';

interface AIPackageIconGeneratorProps {
  gameName: string;
  gameId: string;
  packageId: string;
  packageName: string;
  amount: string;
  isSpecialPackage?: boolean;
  currentIcon?: string;
  onIconGenerated: (iconUrl: string) => void;
}

// Single package icon generator
export const AIPackageIconGenerator: React.FC<AIPackageIconGeneratorProps> = ({
  gameName,
  gameId,
  packageId,
  packageName,
  amount,
  isSpecialPackage = false,
  currentIcon,
  onIconGenerated,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      toast({ title: "🎨 Generating icon...", description: `Creating icon for ${packageName}` });

      const { data, error } = await supabase.functions.invoke('generate-package-icon', {
        body: { gameName, gameId, packageId, packageName, amount, isSpecialPackage }
      });

      if (error) throw error;

      if (data?.success && data?.imageUrl) {
        onIconGenerated(data.imageUrl);
        toast({ title: "✨ Icon generated!", description: "Package icon saved" });
      } else {
        throw new Error(data?.error || 'Failed to generate icon');
      }
    } catch (error: any) {
      console.error('Icon generation error:', error);
      toast({ 
        title: "Generation failed", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Don't show button if icon already exists
  if (currentIcon && currentIcon.trim() !== '') {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleGenerate}
      disabled={isGenerating}
      className="h-8 w-8 text-purple-600 hover:bg-purple-500/10"
      title="Generate AI icon"
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Wand2 className="w-4 h-4" />
      )}
    </Button>
  );
};

// Bulk generator for all packages in all games
interface AIBulkPackageIconGeneratorProps {
  games: Game[];
  onComplete: () => void;
}

export const AIBulkPackageIconGenerator: React.FC<AIBulkPackageIconGeneratorProps> = ({ 
  games, 
  onComplete 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentGame: '', currentPackage: '' });
  const pauseRef = React.useRef(false);

  // Get all packages without icons
  const getAllPackagesWithoutIcons = () => {
    const packages: Array<{
      gameId: string;
      gameName: string;
      packageId: string;
      packageName: string;
      amount: string;
      isSpecialPackage: boolean;
    }> = [];

    games.forEach(game => {
      game.packages.forEach(pkg => {
        if (!pkg.icon || pkg.icon.trim() === '') {
          packages.push({
            gameId: game.id,
            gameName: game.name,
            packageId: pkg.id,
            packageName: pkg.name,
            amount: pkg.amount,
            isSpecialPackage: false,
          });
        }
      });
      game.specialPackages.forEach(pkg => {
        if (!pkg.icon || pkg.icon.trim() === '') {
          packages.push({
            gameId: game.id,
            gameName: game.name,
            packageId: pkg.id,
            packageName: pkg.name,
            amount: pkg.amount,
            isSpecialPackage: true,
          });
        }
      });
    });

    return packages;
  };

  const packagesWithoutIcons = getAllPackagesWithoutIcons();

  const handleBulkGenerate = async () => {
    if (packagesWithoutIcons.length === 0) {
      toast({ title: "All packages have icons!", description: "Nothing to generate" });
      return;
    }

    const confirmed = window.confirm(
      `Generate AI icons for ${packagesWithoutIcons.length} packages? This may take a while (about ${Math.ceil(packagesWithoutIcons.length * 3 / 60)} minutes).`
    );
    
    if (!confirmed) return;

    setIsGenerating(true);
    setIsPaused(false);
    pauseRef.current = false;
    setProgress({ current: 0, total: packagesWithoutIcons.length, currentGame: '', currentPackage: '' });

    let successCount = 0;
    let failCount = 0;

    let consecutiveRateLimits = 0;
    const MAX_RATE_LIMIT_RETRIES = 5;

    for (let i = 0; i < packagesWithoutIcons.length; i++) {
      // Check if paused
      while (pauseRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const pkg = packagesWithoutIcons[i];
      setProgress({ 
        current: i + 1, 
        total: packagesWithoutIcons.length,
        currentGame: pkg.gameName,
        currentPackage: pkg.packageName
      });

      try {
        const { data, error } = await supabase.functions.invoke('generate-package-icon', {
          body: {
            gameName: pkg.gameName,
            gameId: pkg.gameId,
            packageId: pkg.packageId,
            packageName: pkg.packageName,
            amount: pkg.amount,
            isSpecialPackage: pkg.isSpecialPackage,
          }
        });

        if (error || !data?.success) {
          failCount++;
          const errorMsg = data?.error || error?.message || '';
          console.error(`Failed for ${pkg.gameName} - ${pkg.packageName}:`, errorMsg);
          
          // Handle rate limiting with exponential backoff
          if (errorMsg.includes('Rate limit') || errorMsg.includes('429') || errorMsg.includes('quota')) {
            consecutiveRateLimits++;
            
            if (consecutiveRateLimits >= MAX_RATE_LIMIT_RETRIES) {
              toast({ 
                title: "⏰ Quota exhausted", 
                description: "Gemini API daily quota reached. Please try again tomorrow or upgrade your API plan.",
                variant: "destructive" 
              });
              break;
            }
            
            // Exponential backoff: 30s, 60s, 90s, 120s...
            const waitTime = 30 * consecutiveRateLimits;
            toast({ 
              title: "⏳ Rate limited", 
              description: `Waiting ${waitTime} seconds before retrying... (${consecutiveRateLimits}/${MAX_RATE_LIMIT_RETRIES})`,
              variant: "destructive" 
            });
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            
            // Retry this package
            i--;
            continue;
          }
        } else {
          successCount++;
          consecutiveRateLimits = 0; // Reset on success
        }
      } catch (err: any) {
        failCount++;
        console.error(`Error for ${pkg.gameName} - ${pkg.packageName}:`, err);
        
        if (err.message?.includes('402')) {
          toast({ 
            title: "Credits exhausted", 
            description: "Please add AI credits to continue",
            variant: "destructive" 
          });
          break;
        }
      }

      // Delay between requests (5 seconds for Lovable AI)
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    setIsGenerating(false);
    setIsPaused(false);
    
    toast({
      title: "Bulk generation complete!",
      description: `Generated ${successCount} icons. ${failCount > 0 ? `${failCount} failed.` : ''}`,
    });

    onComplete();
  };

  const handlePauseResume = () => {
    pauseRef.current = !pauseRef.current;
    setIsPaused(!isPaused);
  };

  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <ImageIcon className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Package Icon Generator</h3>
            <p className="text-xs text-muted-foreground">
              {packagesWithoutIcons.length} packages without icons across {games.length} games
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isGenerating && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePauseResume}
              className="gap-2"
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={handleBulkGenerate}
            disabled={isGenerating || packagesWithoutIcons.length === 0}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {progress.current}/{progress.total}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate All Icons
              </>
            )}
          </Button>
        </div>
      </div>
      
      {isGenerating && (
        <div className="mt-4 space-y-2">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {isPaused ? '⏸️ Paused - ' : ''}
            {progress.currentGame} → {progress.currentPackage}
          </p>
        </div>
      )}
    </div>
  );
};

export default AIPackageIconGenerator;
