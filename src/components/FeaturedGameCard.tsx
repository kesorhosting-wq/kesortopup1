import React from 'react';
import { Link } from 'react-router-dom';
import { Game } from '@/contexts/SiteContext';
import { Crown, Sparkles, Zap } from 'lucide-react';

interface FeaturedGameCardProps {
  game: Game;
  index: number;
  bgColor?: string;
  borderColor?: string;
}

const FeaturedGameCard: React.FC<FeaturedGameCardProps> = ({ game, index, bgColor, borderColor }) => {
  const icons = [Crown, Sparkles, Zap];
  const Icon = icons[index % icons.length];
  
  return (
    <Link 
      to={`/topup/${game.id}`} 
      className="group relative block overflow-hidden rounded-xl"
    >
      {/* Background glow effect on hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-gold via-gold-light to-gold rounded-xl opacity-0 group-hover:opacity-70 blur-md transition-all duration-300" />
      
      {/* Main card with background */}
      <div 
        className="relative h-full rounded-xl overflow-hidden border-2 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-gold/30"
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
            className="w-[130%] h-[130%] object-cover opacity-20 blur-[1px] scale-110"
          />
        </div>
        
        {/* Featured badge */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-20 flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-gradient-to-r from-gold-dark to-gold rounded-full shadow-lg">
          <Icon className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
          <span className="text-[8px] sm:text-[9px] font-bold text-white uppercase tracking-wide">Featured</span>
        </div>
        
        {/* Main content */}
        <div className="relative p-2 sm:p-3 flex flex-col items-center">
          {/* Game icon - centered and prominent */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mb-2 rounded-xl overflow-hidden shadow-lg border-2 border-white/30 group-hover:scale-110 transition-transform duration-300">
            <img 
              src={game.image} 
              alt={game.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
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

export default FeaturedGameCard;
