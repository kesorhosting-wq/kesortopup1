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
      <div className="absolute -inset-1 bg-gradient-to-r from-gold/60 to-gold-dark/60 rounded-xl opacity-0 group-hover:opacity-100 blur-md transition-all duration-300" />
      
      {/* Card container with background */}
      <div 
        className="relative rounded-xl overflow-hidden border-2 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-gold/30"
        style={{
          backgroundColor: bgColor || 'hsl(43 74% 49%)',
          borderColor: borderColor || 'hsl(35 70% 35%)',
        }}
      >
        {/* Background watermark logo */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <img 
            src={game.image} 
            alt=""
            className="w-[120%] h-[120%] object-cover opacity-20 blur-[1px] scale-110"
          />
        </div>
        
        {/* Main content */}
        <div className="relative p-2 sm:p-3 flex flex-col items-center">
          {/* Game icon - centered and prominent */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mb-2 rounded-xl overflow-hidden shadow-lg border-2 border-white/30 group-hover:scale-110 transition-transform duration-300">
            <img 
              src={game.image} 
              alt={game.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Game name */}
          <h3 
            className="font-display text-[10px] sm:text-xs md:text-sm font-bold text-white text-center line-clamp-2 drop-shadow-lg px-1"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
          >
            {game.name}
          </h3>
        </div>
      </div>
    </Link>
  );
};

export default ModernGameCard;
