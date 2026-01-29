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
      {/* Game Image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img 
          src={game.image} 
          alt={game.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>
      
      {/* Content overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
        {/* Game name */}
        <h3 className="font-medium text-white text-xs sm:text-sm line-clamp-2 mb-1.5 sm:mb-2 drop-shadow-lg">
          {game.name}
        </h3>
        
        {/* Featured badge */}
        {game.featured && (
          <div className="flex items-center gap-1 text-amber-400 text-[10px] sm:text-xs mb-1.5 sm:mb-2">
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
            <span>Featured</span>
          </div>
        )}
        
        {/* TOP UP button */}
        <button className="w-full py-1.5 sm:py-2 px-2 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wide hover:from-amber-600 hover:to-amber-700 transition-all shadow-md">
          TOP UP
        </button>
      </div>
    </Link>
  );
};

export default KiraStyleGameCard;
