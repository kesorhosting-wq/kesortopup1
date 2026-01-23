import React, { useEffect, useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

interface ModernHeroBannerProps {
  bannerImage?: string;
  bannerImages?: string[];
  bannerHeight?: number;
  autoplayDelay?: number;
  cornerBorderColor?: string;
  cornerBorderWidth?: number;
  imageFit?: 'contain' | 'cover';
}

const ModernHeroBanner: React.FC<ModernHeroBannerProps> = ({ 
  bannerImage, 
  bannerImages = [],
  bannerHeight = 200,
  autoplayDelay = 5000,
  cornerBorderColor = '#D4A84B',
  cornerBorderWidth = 3,
  imageFit = 'contain'
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


  // Corner border styles
  const cornerStyle = {
    borderColor: cornerBorderColor,
    borderWidth: `${cornerBorderWidth}px`,
  };

  const CornerBorders = () => (
    <>
      {/* Top Left Corner - OUTSIDE the container */}
      <div 
        className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 w-5 h-5 sm:w-8 sm:h-8 z-20 pointer-events-none"
        style={{ 
          borderLeft: `${cornerBorderWidth}px solid ${cornerBorderColor}`,
          borderTop: `${cornerBorderWidth}px solid ${cornerBorderColor}`,
        }}
      />
      {/* Top Right Corner */}
      <div 
        className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-5 h-5 sm:w-8 sm:h-8 z-20 pointer-events-none"
        style={{ 
          borderRight: `${cornerBorderWidth}px solid ${cornerBorderColor}`,
          borderTop: `${cornerBorderWidth}px solid ${cornerBorderColor}`,
        }}
      />
      {/* Bottom Left Corner */}
      <div 
        className="absolute -bottom-2 -left-2 sm:-bottom-3 sm:-left-3 w-5 h-5 sm:w-8 sm:h-8 z-20 pointer-events-none"
        style={{ 
          borderLeft: `${cornerBorderWidth}px solid ${cornerBorderColor}`,
          borderBottom: `${cornerBorderWidth}px solid ${cornerBorderColor}`,
        }}
      />
      {/* Bottom Right Corner */}
      <div 
        className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 w-5 h-5 sm:w-8 sm:h-8 z-20 pointer-events-none"
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
      <div className="relative w-full overflow-visible p-2">
        <CornerBorders />
        <div 
          className="relative w-full overflow-hidden rounded-lg shadow-lg bg-gradient-to-br from-gold/20 via-cream to-gold-light/20 py-12"
        >
          <div className="flex items-center justify-center">
            <div className="text-center px-4">
              <h1 className="font-display text-2xl sm:text-4xl font-bold gold-text mb-2">
                Welcome to Top Up
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Fast & Secure Game Top Up Service
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full flex justify-center overflow-visible p-3 sm:p-4">
      {/* Corner Borders - OUTSIDE */}
      <div className="relative w-[85%] max-w-5xl">
        <CornerBorders />
        
        <div className="relative w-full overflow-hidden group rounded-lg shadow-lg">
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
          className="w-full"
        >
          <CarouselContent className="-ml-0">
            {allImages.map((image, index) => (
              <CarouselItem key={index} className="pl-0">
                <div 
                  className="w-full relative"
                  style={imageFit === 'cover' ? { height: `${bannerHeight}px` } : undefined}
                >
                  <img 
                    src={image} 
                    alt={`Banner ${index + 1}`}
                    className={`w-full block ${imageFit === 'cover' ? 'h-full object-cover object-center' : 'h-auto'}`}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Modern dots indicator */}
          {hasMultipleImages && (
            <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={`transition-all duration-300 rounded-full ${
                    current === index 
                      ? 'w-5 sm:w-6 h-1.5 bg-gold' 
                      : 'w-1.5 h-1.5 bg-background/60 hover:bg-background/80'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </Carousel>
        </div>
      </div>
    </div>
  );
};

export default ModernHeroBanner;
