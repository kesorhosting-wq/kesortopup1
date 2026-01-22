import React from 'react';
import { cn } from '@/lib/utils';
import { Package } from '@/contexts/SiteContext';
import { useSite } from '@/contexts/SiteContext';
import { Check } from 'lucide-react';

interface ModernPackageCardProps {
  pkg: Package;
  selected: boolean;
  onSelect: () => void;
  variant?: 'default' | 'featured';
}

const ModernPackageCard: React.FC<ModernPackageCardProps> = ({ 
  pkg, 
  selected, 
  onSelect,
  variant = 'default'
}) => {
  const { settings } = useSite();
  
  const isFeatured = variant === 'featured';
  
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative w-full group transition-all duration-300 ease-out",
        "hover:scale-[1.02] active:scale-[0.98]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
      )}
    >
      {/* Card Container */}
      <div 
        className={cn(
          "relative overflow-hidden rounded-xl sm:rounded-2xl transition-all duration-300",
          "bg-gradient-to-br from-card via-card to-card/80",
          "border sm:border-2",
          selected 
            ? "border-gold shadow-lg shadow-gold/20" 
            : "border-border/50 hover:border-gold/50",
          isFeatured && "bg-gradient-to-br from-amber-900/20 via-card to-amber-900/10"
        )}
      >
        {/* Label Badge */}
        {pkg.label && (
          <div 
            className="absolute top-0 left-0 right-0 z-10 py-0.5 sm:py-1 px-1.5 sm:px-2 text-center"
            style={{
              backgroundColor: pkg.labelBgColor || '#dc2626',
            }}
          >
            <div className="flex items-center justify-center gap-0.5 sm:gap-1">
              {pkg.labelIcon && (
                <img src={pkg.labelIcon} alt="" className="w-2.5 h-2.5 sm:w-3 sm:h-3 object-contain" />
              )}
              <span 
                className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wide"
                style={{ color: pkg.labelTextColor || '#ffffff' }}
              >
                {pkg.label}
              </span>
            </div>
          </div>
        )}

        {/* Selection Indicator */}
        {selected && (
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20 w-5 h-5 sm:w-6 sm:h-6 bg-gold rounded-full flex items-center justify-center shadow-md">
            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" strokeWidth={3} />
          </div>
        )}

        {/* Main Content */}
        <div className={cn(
          "p-2.5 sm:p-4 flex flex-col items-center text-center",
          pkg.label && "pt-6 sm:pt-8"
        )}>
          {/* Icon */}
          <div className="relative mb-2 sm:mb-3">
            {pkg.icon ? (
              <img 
                src={pkg.icon} 
                alt="" 
                className="w-8 h-8 sm:w-12 sm:h-12 object-contain transition-transform duration-300 group-hover:scale-110"
              />
            ) : settings.packageIconUrl ? (
              <img 
                src={settings.packageIconUrl} 
                alt="" 
                className="w-8 h-8 sm:w-12 sm:h-12 object-contain transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <span className="text-2xl sm:text-4xl transition-transform duration-300 group-hover:scale-110 inline-block">
                💎
              </span>
            )}
            
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gold/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
          </div>
          
          {/* Amount */}
          <div className="mb-0.5 sm:mb-1">
            <span 
              className="text-sm sm:text-lg font-bold"
              style={{ color: settings.packageTextColor || 'hsl(var(--foreground))' }}
            >
              {pkg.amount}
            </span>
          </div>
          
          {/* Name */}
          <div className="mb-2 sm:mb-3">
            <span 
              className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1"
            >
              {pkg.name}
            </span>
          </div>
          
          {/* Price */}
          <div 
            className={cn(
              "px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full transition-all duration-300",
              selected 
                ? "bg-gold text-primary-foreground" 
                : "bg-gold/10 text-gold group-hover:bg-gold/20"
            )}
          >
            <span className="text-xs sm:text-sm font-bold">
              {settings.packageCurrencySymbol || '$'}{pkg.price.toFixed(2)}
            </span>
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