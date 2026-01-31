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
      to={`/topup/${game.slug || game.id}`} 
      className="group relative block rounded-xl overflow-hidden bg-card/80 border border-border/30 hover:border-gold/50 transition-all duration-300 hover:shadow-lg hover:shadow-gold/10"
    >
      {/* Game Image - Square 1:1 aspect ratio */}
      <div className="relative aspect-square overflow-hidden rounded-t-xl">
        <img 
          src={game.image} 
          alt={game.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      {/* Content below image */}
      <div className="p-1.5 sm:p-2 bg-card/95 space-y-1">
        {/* Game name */}
        <h3 className="font-medium text-foreground text-[10px] sm:text-xs line-clamp-1">
          {game.name}
        </h3>
        
        {/* Featured badge */}
        {game.featured && (
          <div className="flex items-center gap-0.5 text-amber-400 text-[8px] sm:text-[10px]">
            <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-current" />
            <span>Featured</span>
          </div>
        )}
        
        {/* TOP UP button with gradient */}
        <button className="w-full py-1 sm:py-1.5 px-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[8px] sm:text-[10px] font-bold uppercase tracking-wide hover:from-amber-600 hover:to-amber-700 transition-all shadow-md">
          TOP UP
        </button>
      </div>
    </Link>
  );
};

export default KiraStyleGameCard;
