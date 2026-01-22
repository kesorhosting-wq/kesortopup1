import React from 'react';
import { Link } from 'react-router-dom';
import { Game } from '@/contexts/SiteContext';
import { Sparkles, Zap, Crown } from 'lucide-react';

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
      className="group relative block overflow-hidden rounded-2xl"
    >
      {/* Background glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-gold via-gold-light to-gold rounded-2xl opacity-0 group-hover:opacity-75 blur-xl transition-all duration-500 group-hover:duration-200" />
      
      {/* Main card */}
      <div className="relative h-full bg-gradient-to-br from-card via-card to-cream-dark rounded-xl sm:rounded-2xl overflow-hidden border border-gold/30 sm:border-2 group-hover:border-gold transition-all duration-300">
        {/* Featured badge */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-gold to-gold-dark rounded-full shadow-lg">
          <Icon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-primary-foreground" />
          <span className="text-[10px] sm:text-xs font-bold text-primary-foreground uppercase tracking-wide">Featured</span>
        </div>
        
        {/* Image container with overlay */}
        <div className="relative aspect-[4/5] overflow-hidden">
          <img 
            src={game.image} 
            alt={game.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent" />
          
          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-gold/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </div>
        
        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-5">
          <h3 className="font-display text-sm sm:text-base md:text-lg lg:text-xl font-bold text-background mb-1 sm:mb-2 drop-shadow-lg line-clamp-2">
            {game.name}
          </h3>
          
          {/* Stats row - simplified on mobile */}
          <div className="flex items-center gap-2 sm:gap-3 text-background/80 text-[10px] sm:text-xs md:text-sm">
            {game.specialPackages.length > 0 && (
              <span className="flex items-center gap-0.5 sm:gap-1">
                <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-gold" />
                <span className="hidden sm:inline">{game.specialPackages.length} Special</span>
                <span className="sm:hidden">{game.specialPackages.length}</span>
              </span>
            )}
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Zap className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-gold" />
              <span className="hidden sm:inline">{game.packages.length} Packages</span>
              <span className="sm:hidden">{game.packages.length}</span>
            </span>
          </div>
          
          {/* CTA button - hidden on mobile */}
          <div className="mt-2 sm:mt-3 hidden sm:flex items-center gap-2 text-gold text-xs sm:text-sm font-semibold group-hover:translate-x-1 transition-transform duration-300">
            <span>Top Up Now</span>
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default FeaturedGameCard;
