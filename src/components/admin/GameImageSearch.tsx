import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Loader2, Image as ImageIcon, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SearchResult {
  id: number;
  name: string;
  image: string;
  released: string | null;
  rating: number;
}

interface GameImageSearchProps {
  gameName: string;
  onImageSelect: (imageUrl: string) => void;
  buttonSize?: 'sm' | 'default' | 'icon';
}

const GameImageSearch: React.FC<GameImageSearchProps> = ({ 
  gameName, 
  onImageSelect,
  buttonSize = 'icon'
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(gameName);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({ title: 'Please enter a search term', variant: 'destructive' });
      return;
    }

    setIsSearching(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('search-game-image', {
        body: { searchQuery: searchQuery.trim(), limit: 8 }
      });

      if (error) throw error;

      if (data?.success && data.games) {
        setResults(data.games);
        if (data.games.length === 0) {
          toast({ title: 'No games found', description: 'Try a different search term' });
        }
      } else {
        throw new Error(data?.error || 'Search failed');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({ 
        title: 'Search failed', 
        description: error.message || 'Failed to search for game images',
        variant: 'destructive' 
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleConfirm = () => {
    if (selectedImage) {
      onImageSelect(selectedImage);
      setOpen(false);
      setSelectedImage(null);
      toast({ title: 'Image selected', description: 'The game image has been updated' });
    }
  };

  // Auto-search when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && gameName && results.length === 0) {
      setSearchQuery(gameName);
      // Delay search to allow dialog to open
      setTimeout(() => handleSearch(), 100);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {buttonSize === 'icon' ? (
          <Button variant="outline" size="icon" title="Search for game image">
            <Search className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="outline" size={buttonSize}>
            <Search className="w-4 h-4 mr-2" />
            Find Image
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-gold" />
            Search Game Image
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Search for game..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Results Grid */}
        <div className="flex-1 overflow-y-auto mt-4">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {results.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectImage(game.image)}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                    selectedImage === game.image 
                      ? 'border-gold ring-2 ring-gold/50' 
                      : 'border-border hover:border-gold/50'
                  }`}
                >
                  <div className="aspect-[4/3]">
                    <img 
                      src={game.image} 
                      alt={game.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-white text-xs font-medium truncate">{game.name}</p>
                    {game.released && (
                      <p className="text-white/60 text-[10px]">{game.released.split('-')[0]}</p>
                    )}
                  </div>
                  {selectedImage === game.image && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
              <p>Search for a game to find images</p>
            </div>
          )}
        </div>

        {/* Confirm Button */}
        {selectedImage && (
          <div className="pt-4 border-t">
            <Button onClick={handleConfirm} className="w-full bg-gold hover:bg-gold-dark text-primary-foreground">
              <Check className="w-4 h-4 mr-2" />
              Use Selected Image
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GameImageSearch;
