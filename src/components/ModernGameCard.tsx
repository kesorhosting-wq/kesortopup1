import React from 'react';
import { Link } from 'react-router-dom';
import { Game } from '@/contexts/SiteContext';

interface ModernGameCardProps {
  game: Game;
}

const ModernGameCard: React.FC<ModernGameCardProps> = ({ game }) => {
  return (
    <Link 
      to={`/topup/${game.id}`} 
      className="group relative block"
    >
      {/* Card container */}
      <div className="relative bg-card rounded-xl overflow-hidden border border-border group-hover:border-gold/50 transition-all duration-300 shadow-sm group-hover:shadow-lg">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden">
          <img 
            src={game.image} 
            alt={game.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
          
          {/* Game name overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
            <h3 className="font-display text-xs sm:text-sm md:text-base font-semibold text-background line-clamp-2 drop-shadow-lg">
              {game.name}
            </h3>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ModernGameCard;
