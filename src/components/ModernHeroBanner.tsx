import React, { useEffect, useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ModernHeroBannerProps {
  bannerImage?: string;
  bannerImages?: string[];
  bannerHeight?: number;
  autoplayDelay?: number;
  cornerBorderColor?: string;
  cornerBorderWidth?: number;
}

const ModernHeroBanner: React.FC<ModernHeroBannerProps> = ({ 
  bannerImage, 
  bannerImages = [],
  bannerHeight = 400,
  autoplayDelay = 5000,
  cornerBorderColor = '#D4A84B',
  cornerBorderWidth = 4
}) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // Combine single bannerImage with bannerImages array
  const allImages = React.useMemo(() => {
    const images: string[] = [];
    if (bannerImages && bannerImages.length > 0) {
      images.push(...bannerImages);
    } else if (bannerImage) {
      images.push(bannerImage);
    }
    return images;
  }, [bannerImage, bannerImages]);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const hasImages = allImages.length > 0;
  const hasMultipleImages = allImages.length > 1;

  // Calculate responsive height
  const getResponsiveHeight = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return Math.min(bannerHeight * 0.6, 240);
    }
    return bannerHeight;
  };

  const [height, setHeight] = useState(getResponsiveHeight());

  useEffect(() => {
    const handleResize = () => setHeight(getResponsiveHeight());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [bannerHeight]);

  // Corner border styles
  const cornerStyle = {
    borderColor: cornerBorderColor,
    borderWidth: `${cornerBorderWidth}px`,
  };

  const CornerBorders = () => (
    <>
      {/* Top Left Corner */}
      <div 
        className="absolute top-2 left-2 sm:top-3 sm:left-3 w-6 h-6 sm:w-10 sm:h-10 z-20 pointer-events-none"
        style={{ 
          borderLeft: `${cornerBorderWidth}px solid ${cornerBorderColor}`,
          borderTop: `${cornerBorderWidth}px solid ${cornerBorderColor}`,
        }}
      />
      {/* Top Right Corner */}
      <div 
        className="absolute top-2 right-2 sm:top-3 sm:right-3 w-6 h-6 sm:w-10 sm:h-10 z-20 pointer-events-none"
        style={{ 
          borderRight: `${cornerBorderWidth}px solid ${cornerBorderColor}`,
          borderTop: `${cornerBorderWidth}px solid ${cornerBorderColor}`,
        }}
      />
      {/* Bottom Left Corner */}
      <div 
        className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 w-6 h-6 sm:w-10 sm:h-10 z-20 pointer-events-none"
        style={{ 
          borderLeft: `${cornerBorderWidth}px solid ${cornerBorderColor}`,
          borderBottom: `${cornerBorderWidth}px solid ${cornerBorderColor}`,
        }}
      />
      {/* Bottom Right Corner */}
      <div 
        className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-6 h-6 sm:w-10 sm:h-10 z-20 pointer-events-none"
        style={{ 
          borderRight: `${cornerBorderWidth}px solid ${cornerBorderColor}`,
          borderBottom: `${cornerBorderWidth}px solid ${cornerBorderColor}`,
        }}
      />
    </>
  );

  if (!hasImages) {
    // Placeholder hero when no images
    return (
      <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl shadow-lg" style={{ height: `${height}px` }}>
        <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-cream to-gold-light/20 rounded-xl sm:rounded-2xl" />
        <CornerBorders />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="font-display text-3xl sm:text-5xl font-bold gold-text mb-4">
              Welcome to Top Up
            </h1>
            <p className="text-muted-foreground text-lg">
              Fast & Secure Game Top Up Service
            </p>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-gold/10 rounded-full blur-2xl" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-gold/10 rounded-full blur-3xl" />
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden group rounded-xl sm:rounded-2xl shadow-lg" style={{ height: `${height}px` }}>
      {/* Corner Borders */}
      <CornerBorders />
      
      <Carousel
        setApi={setApi}
        opts={{
          loop: true,
          align: 'start',
        }}
        plugins={hasMultipleImages ? [
          Autoplay({
            delay: autoplayDelay,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
          }),
        ] : []}
        className="w-full h-full"
      >
        <CarouselContent className="h-full -ml-0">
          {allImages.map((image, index) => (
            <CarouselItem key={index} className="h-full pl-0">
              <div 
                className="w-full h-full relative"
                style={{ height: `${height}px` }}
              >
                <img 
                  src={image} 
                  alt={`Banner ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Overlay gradient for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation arrows */}
        {hasMultipleImages && (
          <>
            <button
              onClick={() => api?.scrollPrev()}
              className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 bg-background/80 backdrop-blur-sm rounded-full border border-border hover:bg-gold hover:border-gold hover:text-primary-foreground transition-all duration-300 opacity-0 group-hover:opacity-100"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => api?.scrollNext()}
              className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 bg-background/80 backdrop-blur-sm rounded-full border border-border hover:bg-gold hover:border-gold hover:text-primary-foreground transition-all duration-300 opacity-0 group-hover:opacity-100"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}

        {/* Modern dots indicator */}
        {hasMultipleImages && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {allImages.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`transition-all duration-300 rounded-full ${
                  current === index 
                    ? 'w-8 h-2 bg-gold' 
                    : 'w-2 h-2 bg-background/60 hover:bg-background/80'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </Carousel>
    </div>
  );
};

export default ModernHeroBanner;
