import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

import { cn } from '@/lib/utils';

interface ScrollProgressProps {
  className?: string;
}

export function ScrollProgress({ className }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className={cn(
        'fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-lime-500 via-purple-500 to-cyan-500 origin-left z-50',
        className
      )}
      style={{ scaleX }}
    />
  );
}

interface ParallaxElementProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export function ParallaxElement({ children, speed = 0.5, className }: ParallaxElementProps) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 1000 * speed]);

  return (
    <motion.div style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

interface ScrollTriggeredAnimationProps {
  children: React.ReactNode;
  animation?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn' | 'slideInUp';
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
}

export function ScrollTriggeredAnimation({
  children,
  animation = 'fadeInUp',
  delay = 0,
  duration = 0.6,
  threshold = 0.1,
  className
}: ScrollTriggeredAnimationProps) {
  const animations = {
    fadeInUp: {
      hidden: { opacity: 0, y: 60 },
      visible: { opacity: 1, y: 0 }
    },
    fadeInLeft: {
      hidden: { opacity: 0, x: -60 },
      visible: { opacity: 1, x: 0 }
    },
    fadeInRight: {
      hidden: { opacity: 0, x: 60 },
      visible: { opacity: 1, x: 0 }
    },
    scaleIn: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1 }
    },
    slideInUp: {
      hidden: { opacity: 0, y: 100 },
      visible: { opacity: 1, y: 0 }
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold }}
      variants={animations[animation]}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface FloatingElementProps {
  children: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'strong';
  direction?: 'up' | 'down' | 'left' | 'right' | 'circular';
  duration?: number;
  className?: string;
}

export function FloatingElement({
  children,
  intensity = 'medium',
  direction = 'up',
  duration = 3,
  className
}: FloatingElementProps) {
  const intensityMap = {
    subtle: 10,
    medium: 20,
    strong: 40
  };

  const distance = intensityMap[intensity];

  const animations = {
    up: { y: [0, -distance, 0] },
    down: { y: [0, distance, 0] },
    left: { x: [0, -distance, 0] },
    right: { x: [0, distance, 0] },
    circular: {
      x: [0, distance, 0, -distance, 0],
      y: [0, -distance, distance, 0, 0]
    }
  };

  return (
    <motion.div
      animate={animations[direction]}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface MouseFollowerProps {
  children: React.ReactNode;
  intensity?: number;
  className?: string;
}

export function MouseFollower({ children, intensity = 0.1, className }: MouseFollowerProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  const x = useTransform(() => (mousePosition.x - window.innerWidth / 2) * intensity);
  const y = useTransform(() => (mousePosition.y - window.innerHeight / 2) * intensity);

  return (
    <motion.div style={{ x, y }} className={className}>
      {children}
    </motion.div>
  );
}

interface StaggeredContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggeredContainer({ children, staggerDelay = 0.1, className }: StaggeredContainerProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

interface MagneticButtonProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
  onClick?: () => void;
}

export function MagneticButton({ children, strength = 0.3, className, onClick }: MagneticButtonProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;
    setPosition({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      className={cn('inline-block cursor-pointer', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  );
}

interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

export function CountUp({ end, duration = 2, suffix = '', className }: CountUpProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!hasAnimated) return;

    const startTime = Date.now();
    const endTime = startTime + duration * 1000;

    const updateCount = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (endTime - startTime), 1);
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOutProgress * end));

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    updateCount();
  }, [end, duration, hasAnimated]);

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      onViewportEnter={() => setHasAnimated(true)}
    >
      {count.toLocaleString()}{suffix}
    </motion.span>
  );
}

export { motion } from 'framer-motion';