'use client';

import Image from 'next/image';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import { Skeleton } from './skeleton';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  aspectRatio?: '16:9' | '4:3' | '1:1' | '3:2';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  blur?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  aspectRatio,
  objectFit = 'cover',
  blur = true,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const aspectRatioClasses = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    '3:2': 'aspect-[3/2]',
  };

  const containerClassName = cn(
    'relative overflow-hidden',
    aspectRatio && aspectRatioClasses[aspectRatio],
    className
  );

  if (hasError) {
    return (
      <div className={cn(containerClassName, 'bg-gray-200 dark:bg-gray-700 flex items-center justify-center')}>
        <div className="text-center p-4">
          <svg
            className="w-12 h-12 mx-auto text-gray-400 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-500">Failed to load image</p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      {isLoading && (
        <Skeleton className="absolute inset-0" />
      )}
      
      <Image
        src={src}
        alt={alt}
        width={width || (aspectRatio ? 800 : undefined)}
        height={height || (aspectRatio ? 450 : undefined)}
        priority={priority}
        fill={!width && !height}
        sizes={!width && !height ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' : undefined}
        placeholder={blur ? 'blur' : 'empty'}
        blurDataURL={blur ? generateBlurDataURL() : undefined}
        className={cn(
          'duration-700 ease-in-out',
          isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0',
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'fill' && 'object-fill',
          objectFit === 'none' && 'object-none',
          objectFit === 'scale-down' && 'object-scale-down'
        )}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}

// Recipe-specific image component with optimizations
export function RecipeImage({
  src,
  alt,
  size = 'medium',
  className,
}: {
  src: string;
  alt: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}) {
  const sizes = {
    small: { width: 200, height: 150 },
    medium: { width: 400, height: 300 },
    large: { width: 800, height: 600 },
  };

  const { width, height } = sizes[size];

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      aspectRatio="4:3"
      className={cn('rounded-lg', className)}
    />
  );
}

// Avatar component with optimizations
export function Avatar({
  src,
  alt,
  size = 'medium',
  className,
}: {
  src?: string;
  alt: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}) {
  const sizes = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  };

  if (!src) {
    return (
      <div
        className={cn(
          'rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold',
          sizes[size],
          className
        )}
      >
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      aspectRatio="1:1"
      className={cn('rounded-full', sizes[size], className)}
    />
  );
}

// Generate blur data URL for placeholder
function generateBlurDataURL(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 10;
  canvas.height = 10;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, 10, 10);
  }
  return canvas.toDataURL();
}