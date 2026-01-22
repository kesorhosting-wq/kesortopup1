import React from 'react';
import { Game } from '@/contexts/SiteContext';
import { useLanguage } from '@/contexts/LanguageContext';
import FeaturedGameCard from './FeaturedGameCard';
import SectionHeader from './SectionHeader';
import { Crown } from 'lucide-react';

interface FeaturedGamesSectionProps {
  games: Game[];
}

const FeaturedGamesSection: React.FC<FeaturedGamesSectionProps> = ({ games }) => {
  const { t } = useLanguage();
  
  // Filter games marked as featured by admin
  const featuredGames = games.filter(game => game.featured).slice(0, 8);
  
  if (featuredGames.length === 0) return null;
  
  return (
    <section className="container mx-auto px-3 sm:px-4 py-6 sm:py-10">
      <SectionHeader 
        title={t('home.featuredGames')}
        subtitle={t('home.featuredGamesSubtitle')}
        icon={Crown}
      />
      
      {/* Featured games grid - 2 cols mobile, 3 cols tablet, 4 cols desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 max-w-6xl mx-auto">
        {featuredGames.map((game, index) => (
          <FeaturedGameCard 
            key={game.id} 
            game={game} 
            index={index}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedGamesSection;
