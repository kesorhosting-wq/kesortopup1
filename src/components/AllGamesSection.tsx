import React from 'react';
import { Game } from '@/contexts/SiteContext';
import ModernGameCard from './ModernGameCard';
import SectionHeader from './SectionHeader';
import { Gamepad2 } from 'lucide-react';

interface AllGamesSectionProps {
  games: Game[];
}

const AllGamesSection: React.FC<AllGamesSectionProps> = ({ games }) => {
  if (games.length === 0) return null;
  
  return (
    <section className="container mx-auto px-3 sm:px-4 py-6 sm:py-10">
      <SectionHeader 
        title="All Games"
        subtitle="Browse our complete collection"
        icon={Gamepad2}
      />
      
      {/* All games grid - 2 cols mobile, 3 cols tablet, 4-5 cols desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6 max-w-6xl mx-auto">
        {games.map((game) => (
          <ModernGameCard 
            key={game.id} 
            game={game}
          />
        ))}
      </div>
    </section>
  );
};

export default AllGamesSection;
