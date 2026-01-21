import React from 'react';
import { Game } from '@/contexts/SiteContext';
import FeaturedGameCard from './FeaturedGameCard';
import SectionHeader from './SectionHeader';
import { Crown } from 'lucide-react';

interface FeaturedGamesSectionProps {
  games: Game[];
}

const FeaturedGamesSection: React.FC<FeaturedGamesSectionProps> = ({ games }) => {
  // Filter games that have special packages
  const featuredGames = games.filter(game => game.specialPackages.length > 0).slice(0, 4);
  
  if (featuredGames.length === 0) return null;
  
  return (
    <section className="container mx-auto px-3 sm:px-4 py-6 sm:py-10">
      <SectionHeader 
        title="Featured Games"
        subtitle="Exclusive offers & special packages"
        icon={Crown}
      />
      
      {/* Featured games grid - responsive layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
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
