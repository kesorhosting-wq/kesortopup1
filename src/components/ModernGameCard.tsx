import React from 'react';
import { Link } from 'react-router-dom';
import { Game } from '@/contexts/SiteContext';

interface ModernGameCardProps {
  game: Game;
  bgColor?: string;
  borderColor?: string;
}

const ModernGameCard: React.FC<ModernGameCardProps> = ({ game, bgColor, borderColor }) => {
  return (
    <Link 
      to={`/topup/${game.id}`} 
      className="group relative block"
    >
      {/* Hover glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-gold/60 to-gold-dark/60 rounded-lg opacity-0 group-hover:opacity-100 blur-md transition-all duration-300" />
      
      {/* Card container */}
      <div 
        className="relative rounded-lg overflow-hidden border transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-gold/20"
        style={{
          backgroundColor: bgColor || undefined,
          borderColor: borderColor || undefined,
          borderWidth: borderColor ? '1px' : undefined,
        }}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden">
          <img 
            src={game.image} 
            alt={game.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          {/* Game name overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2">
            <h3 className="font-display text-[10px] sm:text-xs md:text-sm font-semibold text-white line-clamp-2 drop-shadow-lg text-center">
              {game.name}
            </h3>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ModernGameCard;
