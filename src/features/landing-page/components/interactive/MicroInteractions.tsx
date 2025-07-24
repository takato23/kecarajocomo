import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

import { cn } from '@/lib/utils';

interface HoverRevealProps {
  children: React.ReactNode;
  revealContent: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export function HoverReveal({ children, revealContent, direction = 'up', className }: HoverRevealProps) {
  const [isHovered, setIsHovered] = useState(false);

  const variants = {
    up: { y: '100%' },
    down: { y: '-100%' },
    left: { x: '100%' },
    right: { x: '-100%' }
  };

  const exitVariants = {
    up: { y: '-100%' },
    down: { y: '100%' },
    left: { x: '-100%' },
    right: { x: '100%' }
  };

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        animate={{ y: isHovered ? (direction === 'up' ? '-100%' : direction === 'down' ? '100%' : 0) : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0"
            initial={variants[direction]}
            animate={{ x: 0, y: 0 }}
            exit={exitVariants[direction]}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {revealContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TiltCardProps {
  children: React.ReactNode;
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  className?: string;
}

export function TiltCard({ children, maxTilt = 15, perspective = 1000, scale = 1.05, className }: TiltCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((event.clientX - centerX) / rect.width);
    y.set((event.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={cn('preserve-3d', className)}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

interface RippleEffectProps {
  children: React.ReactNode;
  color?: string;
  duration?: number;
  className?: string;
}

export function RippleEffect({ children, color = 'rgba(255, 255, 255, 0.5)', duration = 0.6, className }: RippleEffectProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const createRipple = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const newRipple = { id: Date.now(), x, y };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, duration * 1000);
  };

  return (
    <div className={cn('relative overflow-hidden', className)} onClick={createRipple}>
      {children}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.div
            key={ripple.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              backgroundColor: color,
              transform: 'translate(-50%, -50%)'
            }}
            initial={{ width: 0, height: 0, opacity: 1 }}
            animate={{ width: 400, height: 400, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface MorphingShapeProps {
  shapes: string[];
  duration?: number;
  className?: string;
}

export function MorphingShape({ shapes, duration = 2, className }: MorphingShapeProps) {
  const [currentShapeIndex, setCurrentShapeIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentShapeIndex(prev => (prev + 1) % shapes.length);
    }, duration * 1000);

    return () => clearInterval(interval);
  }, [shapes.length, duration]);

  return (
    <svg className={cn('w-full h-full', className)} viewBox="0 0 100 100">
      <motion.path
        d={shapes[currentShapeIndex]}
        fill="currentColor"
        animate={{ d: shapes[currentShapeIndex] }}
        transition={{ duration: duration * 0.8, ease: 'easeInOut' }}
      />
    </svg>
  );
}

interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}

export function Typewriter({ text, speed = 50, delay = 0, className, onComplete }: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      } else if (onComplete) {
        onComplete();
      }
    }, currentIndex === 0 ? delay : speed);

    return () => clearTimeout(timer);
  }, [currentIndex, text, speed, delay, onComplete]);

  return (
    <span className={className}>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
        className="inline-block w-0.5 h-6 bg-current ml-1"
      />
    </span>
  );
}

interface PulseButtonProps {
  children: React.ReactNode;
  pulseColor?: string;
  intensity?: 'subtle' | 'medium' | 'strong';
  className?: string;
  onClick?: () => void;
}

export function PulseButton({ children, pulseColor = 'rgb(132, 204, 22)', intensity = 'medium', className, onClick }: PulseButtonProps) {
  const intensityMap = {
    subtle: { scale: [1, 1.02, 1], opacity: [0.7, 1, 0.7] },
    medium: { scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] },
    strong: { scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: pulseColor }}
        animate={intensityMap[intensity]}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      <div className="relative z-10" onClick={onClick}>
        {children}
      </div>
    </div>
  );
}

interface ShineEffectProps {
  children: React.ReactNode;
  color?: string;
  duration?: number;
  angle?: number;
  className?: string;
}

export function ShineEffect({ children, color = 'rgba(255, 255, 255, 0.5)', duration = 1.5, angle = 45, className }: ShineEffectProps) {
  return (
    <div className={cn('relative overflow-hidden group', className)}>
      {children}
      <motion.div
        className="absolute inset-0 -skew-x-12"
        style={{
          background: `linear-gradient(${angle}deg, transparent 30%, ${color} 50%, transparent 70%)`,
          transform: 'translateX(-100%)'
        }}
        animate={{
          transform: ['translateX(-100%)', 'translateX(300%)']
        }}
        transition={{
          duration,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatDelay: 3
        }}
      />
    </div>
  );
}

interface BreathingProps {
  children: React.ReactNode;
  scale?: [number, number];
  duration?: number;
  className?: string;
}

export function Breathing({ children, scale = [1, 1.05], duration = 3, className }: BreathingProps) {
  return (
    <motion.div
      className={className}
      animate={{ scale }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  );
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function LoadingDots({ size = 'md', color = 'currentColor', className }: LoadingDotsProps) {
  const sizeMap = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const containerVariants = {
    start: { transition: { staggerChildren: 0.2 } },
    end: { transition: { staggerChildren: 0.2 } }
  };

  const dotVariants = {
    start: { y: '0%' },
    end: { y: '100%' }
  };

  const dotTransition = {
    duration: 0.5,
    repeat: Infinity,
    repeatType: 'reverse' as const,
    ease: 'easeInOut'
  };

  return (
    <motion.div
      className={cn('flex space-x-1', className)}
      variants={containerVariants}
      initial="start"
      animate="end"
    >
      {[0, 1, 2].map(index => (
        <motion.div
          key={index}
          className={cn('rounded-full', sizeMap[size])}
          style={{ backgroundColor: color }}
          variants={dotVariants}
          transition={dotTransition}
        />
      ))}
    </motion.div>
  );
}