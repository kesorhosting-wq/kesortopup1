import React from 'react';
import { Link } from 'react-router-dom';
import { Game } from '@/contexts/SiteContext';
import { Crown, Sparkles, Zap } from 'lucide-react';

interface FeaturedGameCardProps {
  game: Game;
  index: number;
}

const FeaturedGameCard: React.FC<FeaturedGameCardProps> = ({ game, index }) => {
  const icons = [Crown, Sparkles, Zap];
  const Icon = icons[index % icons.length];
  
  return (
    <Link 
      to={`/topup/${game.id}`} 
      className="group relative block overflow-hidden rounded-xl sm:rounded-2xl"
    >
      {/* Background glow effect on hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-gold via-gold-light to-gold rounded-2xl opacity-0 group-hover:opacity-60 blur-xl transition-all duration-500" />
      
      {/* Main card */}
      <div className="relative h-full bg-card rounded-xl sm:rounded-2xl overflow-hidden border border-gold/30 group-hover:border-gold transition-all duration-300">
        {/* Featured badge */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gradient-to-r from-gold to-gold-dark rounded-full shadow-lg">
          <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary-foreground" />
          <span className="text-[9px] sm:text-[10px] font-bold text-primary-foreground uppercase tracking-wide">Featured</span>
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
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
          
          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-gold/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          
          {/* Game name overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 md:p-4">
            <h3 className="font-display text-xs sm:text-sm md:text-base lg:text-lg font-bold text-background drop-shadow-lg line-clamp-2">
              {game.name}
            </h3>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default FeaturedGameCard;
