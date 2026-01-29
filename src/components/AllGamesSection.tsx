import React, { useState, useMemo } from 'react';
import { Game, useSite } from '@/contexts/SiteContext';
import { useLanguage } from '@/contexts/LanguageContext';
import KiraStyleGameCard from './KiraStyleGameCard';
import SectionHeader from './SectionHeader';
import { Gamepad2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface AllGamesSectionProps {
  games: Game[];
}

const AllGamesSection: React.FC<AllGamesSectionProps> = ({ games }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();
  const { settings } = useSite();

  // Filter and sort games
  const filteredAndSortedGames = useMemo(() => {
    const filtered = games.filter(game =>
      game.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filtered.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }, [games, searchQuery]);

  if (games.length === 0) return null;
  
  return (
    <section 
      className="py-6 sm:py-10"
      style={{
        backgroundColor: settings.gamesSectionBgColor || undefined,
        backgroundImage: settings.gamesSectionBgImage ? `url(${settings.gamesSectionBgImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="container mx-auto px-3 sm:px-4">
        <SectionHeader 
          title={t('home.allGames')}
          subtitle={t('home.allGamesSubtitle')}
          icon={Gamepad2}
        />

        {/* Search input */}
        <div className="max-w-md mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('home.searchGames')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-background/80 backdrop-blur-sm border-border/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              {t('home.foundGames').replace('{count}', String(filteredAndSortedGames.length))}
            </p>
          )}
        </div>
        
        {/* All games grid - 3 cols mobile, 4 cols tablet, 6 cols desktop */}
        {filteredAndSortedGames.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 max-w-7xl mx-auto">
            {filteredAndSortedGames.map((game) => (
              <KiraStyleGameCard 
                key={game.id} 
                game={game}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">{t('home.noGamesFound')} "{searchQuery}"</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default AllGamesSection;
