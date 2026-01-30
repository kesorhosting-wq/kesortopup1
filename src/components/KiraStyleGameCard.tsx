import React from 'react';
import { Link } from 'react-router-dom';
import { Game } from '@/contexts/SiteContext';
import { Star } from 'lucide-react';

interface KiraStyleGameCardProps {
  game: Game;
}

const KiraStyleGameCard: React.FC<KiraStyleGameCardProps> = ({ game }) => {
  return (
    <Link 
      to={`/topup/${game.id}`} 
      className="group relative block rounded-lg overflow-hidden bg-card/80 border border-border/30 hover:border-gold/50 transition-all duration-300 hover:shadow-lg hover:shadow-gold/10"
    >
      {/* Game Image - Square 1:1 aspect ratio like kiragamestore */}
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={game.image} 
          alt={game.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      {/* Content below image */}
      <div className="p-2 sm:p-3 bg-card/95 space-y-1.5 sm:space-y-2">
        {/* Game name */}
        <h3 className="font-medium text-foreground text-xs sm:text-sm line-clamp-1">
          {game.name}
        </h3>
        
        {/* Featured badge */}
        {game.featured && (
          <div className="flex items-center gap-1 text-amber-400 text-[10px] sm:text-xs">
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
            <span>Featured</span>
          </div>
        )}
        
        {/* TOP UP button with gradient */}
        <button className="w-full py-1.5 sm:py-2 px-2 rounded bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wide hover:from-amber-600 hover:to-amber-700 transition-all shadow-md">
          TOP UP
        </button>
      </div>
    </Link>
  );
};

export default KiraStyleGameCard;
