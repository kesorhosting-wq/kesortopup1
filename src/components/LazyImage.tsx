import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  placeholderClassName?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  fallback = '💎',
  className,
  placeholderClassName,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  if (hasError || !src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted/50',
          placeholderClassName || className
        )}
      >
        <span className="text-2xl">{fallback}</span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)} ref={imgRef}>
      {/* Placeholder skeleton */}
      {!isLoaded && (
        <div
          className={cn(
            'absolute inset-0 bg-muted/50 animate-pulse',
            placeholderClassName
          )}
        />
      )}
      
      {/* Actual image - only load when in view */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImage;
