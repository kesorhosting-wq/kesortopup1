import React from 'react';
import { Game, useSite } from '@/contexts/SiteContext';
import { useLanguage } from '@/contexts/LanguageContext';
import KiraStyleGameCard from './KiraStyleGameCard';
import SectionHeader from './SectionHeader';
import { Crown } from 'lucide-react';

interface FeaturedGamesSectionProps {
  games: Game[];
}

const FeaturedGamesSection: React.FC<FeaturedGamesSectionProps> = ({ games }) => {
  const { t } = useLanguage();
  const { settings } = useSite();
  
  // Filter games marked as featured by admin - show all featured games
  const featuredGames = games.filter(game => game.featured);
  
  if (featuredGames.length === 0) return null;
  
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
          title={t('home.featuredGames')}
          subtitle={t('home.featuredGamesSubtitle')}
          icon={Crown}
        />
        
        {/* Featured games grid - 3 cols mobile, 4 cols tablet, 6 cols desktop */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 max-w-7xl mx-auto">
          {featuredGames.map((game) => (
            <KiraStyleGameCard 
              key={game.id} 
              game={game}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedGamesSection;
