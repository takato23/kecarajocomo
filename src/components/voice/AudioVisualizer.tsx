/**
 * Audio Visualizer Component
 * Visual feedback for voice input levels
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  audioLevel: number; // 0-1 normalized audio level
  isActive: boolean;
  variant?: 'bars' | 'wave' | 'circle' | 'dots';
  color?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioLevel,
  isActive,
  variant = 'bars',
  color = 'purple',
  className,
  size = 'md'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const sizeConfig = {
    sm: { height: 40, barCount: 20 },
    md: { height: 60, barCount: 30 },
    lg: { height: 80, barCount: 40 }
  };
  
  const config = sizeConfig[size];
  
  // Canvas-based wave visualizer
  useEffect(() => {
    if (variant !== 'wave' || !isActive) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    let phase = 0;
    
    const draw = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw wave
      ctx.beginPath();
      ctx.lineWidth = 2;
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, `rgba(147, 51, 234, ${0.2 + audioLevel * 0.6})`);
      gradient.addColorStop(0.5, `rgba(168, 85, 247, ${0.3 + audioLevel * 0.7})`);
      gradient.addColorStop(1, `rgba(147, 51, 234, ${0.2 + audioLevel * 0.6})`);
      ctx.strokeStyle = gradient;
      
      // Wave parameters
      const amplitude = height * 0.3 * (0.3 + audioLevel * 0.7);
      const frequency = 0.02;
      const speed = 0.05;
      
      // Draw sine wave
      for (let x = 0; x <= width; x++) {
        const y = height / 2 + amplitude * Math.sin(frequency * x + phase);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      
      // Update phase for animation
      phase += speed + audioLevel * 0.1;
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [variant, isActive, audioLevel]);
  
  // Bars visualizer
  if (variant === 'bars') {
    const bars = Array.from({ length: config.barCount }, (_, i) => i);
    
    return (
      <div className={cn("flex items-center justify-center gap-0.5", className)}>
        {bars.map((i) => {
          const centerDistance = Math.abs(i - config.barCount / 2) / (config.barCount / 2);
          const heightMultiplier = 1 - centerDistance * 0.3;
          const baseHeight = 4;
          const maxHeight = config.height;
          const height = baseHeight + (maxHeight - baseHeight) * audioLevel * heightMultiplier;
          
          return (
            <motion.div
              key={i}
              className={cn(
                "w-1 rounded-full",
                color === 'purple' && "bg-purple-500",
                color === 'blue' && "bg-blue-500",
                color === 'green' && "bg-green-500"
              )}
              animate={{
                height: isActive ? height : baseHeight,
                opacity: isActive ? 0.6 + audioLevel * 0.4 : 0.3
              }}
              transition={{
                duration: 0.1,
                ease: "easeOut"
              }}
              style={{
                boxShadow: isActive && audioLevel > 0.5 
                  ? `0 0 ${audioLevel * 20}px currentColor` 
                  : undefined
              }}
            />
          );
        })}
      </div>
    );
  }
  
  // Wave visualizer (canvas-based)
  if (variant === 'wave') {
    return (
      <canvas
        ref={canvasRef}
        className={cn("w-full", className)}
        style={{ height: config.height }}
      />
    );
  }
  
  // Circle visualizer
  if (variant === 'circle') {
    const circles = [1, 0.7, 0.4];
    
    return (
      <div className={cn("relative flex items-center justify-center", className)}
           style={{ height: config.height, width: config.height }}>
        {circles.map((scale, i) => (
          <motion.div
            key={i}
            className={cn(
              "absolute rounded-full",
              color === 'purple' && "bg-purple-500",
              color === 'blue' && "bg-blue-500",
              color === 'green' && "bg-green-500"
            )}
            animate={{
              scale: isActive ? scale + audioLevel * 0.3 : scale * 0.8,
              opacity: isActive ? 0.3 - i * 0.1 + audioLevel * 0.2 : 0.1
            }}
            transition={{
              duration: 0.15,
              ease: "easeOut"
            }}
            style={{
              width: `${100 - i * 30}%`,
              height: `${100 - i * 30}%`,
              filter: isActive && audioLevel > 0.5 
                ? `blur(${i * 2}px)` 
                : undefined
            }}
          />
        ))}
      </div>
    );
  }
  
  // Dots visualizer
  if (variant === 'dots') {
    const dotCount = 5;
    const dots = Array.from({ length: dotCount }, (_, i) => i);
    
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        {dots.map((i) => {
          const delay = i * 0.1;
          
          return (
            <motion.div
              key={i}
              className={cn(
                "rounded-full",
                color === 'purple' && "bg-purple-500",
                color === 'blue' && "bg-blue-500",
                color === 'green' && "bg-green-500"
              )}
              animate={{
                scale: isActive ? [1, 1.5 + audioLevel, 1] : 1,
                opacity: isActive ? [0.5, 0.8 + audioLevel * 0.2, 0.5] : 0.3
              }}
              transition={{
                duration: 1,
                delay,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                width: size === 'sm' ? 8 : size === 'md' ? 12 : 16,
                height: size === 'sm' ? 8 : size === 'md' ? 12 : 16
              }}
            />
          );
        })}
      </div>
    );
  }
  
  return null;
};