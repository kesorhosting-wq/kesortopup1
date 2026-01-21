import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  align?: 'left' | 'center';
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  subtitle, 
  icon: Icon,
  align = 'center' 
}) => {
  return (
    <div className={`mb-6 sm:mb-8 ${align === 'center' ? 'text-center' : 'text-left'}`}>
      {/* Title with icon */}
      <div className={`flex items-center gap-3 ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
        {Icon && (
          <div className="p-2 bg-gradient-to-br from-gold to-gold-dark rounded-lg shadow-gold">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
          </div>
        )}
        <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
          {title}
        </h2>
      </div>
      
      {/* Subtitle */}
      {subtitle && (
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          {subtitle}
        </p>
      )}
      
      {/* Decorative line */}
      <div className={`mt-4 flex items-center gap-2 ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
        <div className="w-8 sm:w-12 h-0.5 bg-gradient-to-r from-transparent to-gold" />
        <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
        <div className="w-16 sm:w-24 h-0.5 bg-gold" />
        <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
        <div className="w-8 sm:w-12 h-0.5 bg-gradient-to-l from-transparent to-gold" />
      </div>
    </div>
  );
};

export default SectionHeader;
