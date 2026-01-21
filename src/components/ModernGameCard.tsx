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
          
          {/* Quick action overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="px-4 py-2 bg-gold rounded-full flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <Zap className="w-4 h-4 text-primary-foreground" />
              <span className="text-sm font-bold text-primary-foreground">Top Up</span>
            </div>
          </div>
          
          {/* Package count badge */}
          {game.packages.length > 0 && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-foreground/80 backdrop-blur-sm rounded-full">
              <span className="text-xs font-medium text-background">
                {game.packages.length} packs
              </span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-3 sm:p-4 bg-gradient-to-b from-card to-cream-dark/50">
          <h3 className="font-display text-sm sm:text-base font-semibold text-foreground truncate group-hover:text-gold transition-colors duration-300">
            {game.name}
          </h3>
          
          {game.specialPackages.length > 0 && (
            <p className="mt-1 text-xs text-gold font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
              {game.specialPackages.length} special offers
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ModernGameCard;
