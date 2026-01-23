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
      className="group relative block overflow-hidden rounded-lg"
    >
      {/* Background glow effect on hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-gold via-gold-light to-gold rounded-lg opacity-0 group-hover:opacity-70 blur-md transition-all duration-300" />
      
      {/* Main card */}
      <div 
        className="relative h-full rounded-lg overflow-hidden border border-gold/30 transition-all duration-300 group-hover:scale-105 group-hover:border-gold group-hover:shadow-lg group-hover:shadow-gold/30"
        style={{
          backgroundColor: bgColor || undefined,
          borderColor: borderColor || undefined,
        }}
      >
        {/* Featured badge */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-20 flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-gradient-to-r from-gold to-gold-dark rounded-full shadow-lg">
          <Icon className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-primary-foreground" />
          <span className="text-[8px] sm:text-[9px] font-bold text-primary-foreground uppercase tracking-wide">Featured</span>
        </div>
        
        {/* Image container with overlay */}
        <div className="relative aspect-square overflow-hidden">
          <img 
            src={game.image} 
            alt={game.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-gold/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          
          {/* Game name overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2">
            <h3 className="font-display text-[10px] sm:text-xs md:text-sm font-bold text-white drop-shadow-lg line-clamp-2 text-center">
              {game.name}
            </h3>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default FeaturedGameCard;
