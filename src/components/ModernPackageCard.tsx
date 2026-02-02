import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Package } from '@/contexts/SiteContext';
import { useSite } from '@/contexts/SiteContext';
import { Check } from 'lucide-react';

interface ModernPackageCardProps {
  pkg: Package;
  selected: boolean;
  onSelect: () => void;
  variant?: 'default' | 'featured';
  gameDefaultIcon?: string;
}

const ModernPackageCard: React.FC<ModernPackageCardProps> = ({ 
  pkg, 
  selected, 
  onSelect,
  variant = 'default',
  gameDefaultIcon
}) => {
  const { settings } = useSite();
  const [imgError, setImgError] = useState(false);
  
  const isFeatured = variant === 'featured';
  
  // Priority: pkg.icon > gameDefaultIcon > settings.packageIconUrl > fallback emoji
  const getIconSrc = () => {
    if (pkg.icon && !imgError) return pkg.icon;
    if (gameDefaultIcon) return gameDefaultIcon;
    if (settings.packageIconUrl) return settings.packageIconUrl;
    return null;
  };
  
  const iconSrc = getIconSrc();
  
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative w-full group transition-all duration-300 ease-out",
        "hover:scale-[1.02] active:scale-[0.98]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
      )}
    >
      {/* Card Container - Kira Style: Horizontal layout */}
      <div 
        className={cn(
          "relative overflow-hidden rounded-lg transition-all duration-300",
          "bg-card/80",
          "border",
          selected 
            ? "border-gold shadow-lg shadow-gold/20" 
            : "border-border/40 hover:border-gold/50",
          isFeatured && "bg-gradient-to-br from-amber-900/20 via-card to-amber-900/10"
        )}
      >
        {/* Label Badge */}
        {pkg.label && (
          <div 
            className="absolute top-0 left-0 z-10 py-0.5 px-1.5 rounded-br-md"
            style={{
              backgroundColor: pkg.labelBgColor || '#dc2626',
            }}
          >
            <div className="flex items-center gap-0.5">
              {pkg.labelIcon && (
                <img src={pkg.labelIcon} alt="" className="w-2.5 h-2.5 object-contain" loading="lazy" />
              )}
              <span 
                className="text-[8px] font-bold uppercase tracking-wide"
                style={{ color: pkg.labelTextColor || '#ffffff' }}
              >
                {pkg.label}
              </span>
            </div>
          </div>
        )}

        {/* Selection Indicator */}
        {selected && (
          <div className="absolute top-1 right-1 z-20 w-4 h-4 bg-gold rounded-full flex items-center justify-center shadow-md">
            <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />
          </div>
        )}

        {/* Main Content - Horizontal: Price/Name on left, Icon on right */}
        <div className={cn(
          "p-2.5 sm:p-3 flex items-center justify-between gap-2",
          pkg.label && "pt-5 sm:pt-6"
        )}>
          {/* Left side - Price and Name */}
          <div className="flex-1 min-w-0 text-left">
            {/* Price */}
            <div className="text-amber-400 font-bold text-sm sm:text-base">
              {settings.packageCurrencySymbol || '$'}{pkg.price.toFixed(2)}
            </div>
            
            {/* Amount/Name */}
            <div 
              className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-0.5"
            >
              {pkg.amount}
            </div>
          </div>
          
          {/* Right side - Icon with lazy loading */}
          <div className="flex-shrink-0">
            {iconSrc ? (
              <img 
                src={iconSrc} 
                alt="" 
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-2xl sm:text-3xl transition-transform duration-300 group-hover:scale-110 inline-block">
                💎
              </span>
            )}
          </div>
        </div>

        {/* Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        {/* Selection Glow */}
        {selected && (
          <div className="absolute inset-0 bg-gold/5 pointer-events-none" />
        )}
      </div>
    </button>
  );
};

export default ModernPackageCard;