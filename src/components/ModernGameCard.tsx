import React from 'react';
import { Link } from 'react-router-dom';
import { Game } from '@/contexts/SiteContext';
import { Zap } from 'lucide-react';

interface ModernGameCardProps {
  game: Game;
}

const ModernGameCard: React.FC<ModernGameCardProps> = ({ game }) => {
  return (
    <Link 
      to={`/topup/${game.id}`} 
      className="group relative block"
    >
      {/* Hover glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-gold/50 to-gold-dark/50 rounded-xl opacity-0 group-hover:opacity-100 blur transition-all duration-300" />
      
      {/* Card container */}
      <div className="relative bg-card rounded-xl overflow-hidden border border-border group-hover:border-gold/50 transition-all duration-300 shadow-sm group-hover:shadow-gold">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden">
          <img 
            src={game.image} 
            alt={game.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Quick action overlay - hidden on mobile for cleaner look */}
          <div className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gold rounded-full flex items-center gap-1.5 sm:gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
              <span className="text-xs sm:text-sm font-bold text-primary-foreground">Top Up</span>
            </div>
          </div>
          
          {/* Package count badge */}
          {game.packages.length > 0 && (
            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-foreground/80 backdrop-blur-sm rounded-full">
              <span className="text-[10px] sm:text-xs font-medium text-background">
                {game.packages.length}
              </span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-2.5 sm:p-3 md:p-4 bg-gradient-to-b from-card to-cream-dark/50">
          <h3 className="font-display text-xs sm:text-sm md:text-base font-semibold text-foreground line-clamp-2 group-hover:text-gold transition-colors duration-300">
            {game.name}
          </h3>
          
          {game.specialPackages.length > 0 && (
            <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-gold font-medium flex items-center gap-1">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gold rounded-full animate-pulse" />
              {game.specialPackages.length} special
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ModernGameCard;
