import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';

// Types
interface DragItem {
  id: string;
  content: React.ReactNode;
  type: 'meal' | 'recipe' | 'ingredient';
  data?: any;
}

interface DropZone {
  id: string;
  accepts: string[];
  onDrop: (item: DragItem, zoneId: string) => void;
  isOccupied?: boolean;
}

interface Position {
  x: number;
  y: number;
}

// Particle Effect Component
const ParticleEffect: React.FC<{ position: Position; trigger: boolean }> = ({ position, trigger }) => {
  const particles = Array.from({ length: 12 });
  
  return (
    <AnimatePresence>
      {trigger && (
        <div className="fixed pointer-events-none z-50" style={{ left: position.x, top: position.y }}>
          {particles.map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: [0, 1.5, 0],
                x: Math.cos(i * 30 * Math.PI / 180) * 60,
                y: Math.sin(i * 30 * Math.PI / 180) * 60,
                opacity: [1, 0]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

// Ripple Effect Component
const RippleEffect: React.FC<{ position: Position; trigger: boolean }> = ({ position, trigger }) => {
  return (
    <AnimatePresence>
      {trigger && (
        <motion.div
          className="fixed pointer-events-none z-40"
          style={{ left: position.x, top: position.y }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 4, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="w-20 h-20 -ml-10 -mt-10 rounded-full bg-gradient-to-r from-blue-400/30 to-purple-400/30 backdrop-blur-sm" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Draggable Item Component
export const DraggableItem: React.FC<{
  item: DragItem;
  onDragEnd?: (item: DragItem, info: PanInfo) => void;
  className?: string;
}> = ({ item, onDragEnd, className = "" }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  
  // Transform values for visual effects
  const scale = useTransform(dragX, [-200, 0, 200], [0.95, 1.1, 0.95]);
  const rotate = useTransform(dragX, [-200, 0, 200], [-5, 0, 5]);
  const shadowY = useTransform(dragY, [-100, 0, 100], [10, 25, 10]);
  const shadowBlur = useTransform(dragY, [-100, 0, 100], [20, 40, 20]);
  
  // Handle long press for mobile
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      // Visual feedback for long press
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  };
  
  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setIsLongPress(false);
  };
  
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);
  
  return (
    <motion.div
      drag={isLongPress || !('ontouchstart' in window)}
      dragElastic={0.2}
      dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
      whileDrag={{ 
        cursor: "grabbing",
        zIndex: 50 
      }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        setIsLongPress(false);
        onDragEnd?.(item, info);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ 
        x: dragX, 
        y: dragY,
        scale,
        rotate,
      }}
      animate={{
        scale: isDragging ? 1.1 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
      className={`relative touch-none ${className}`}
    >
      {/* Glass morphism container */}
      <motion.div
        className={`
          relative overflow-hidden rounded-2xl
          ${isDragging ? 'bg-white/10' : 'bg-white/5'}
          backdrop-blur-xl border border-white/20
          transition-all duration-300
        `}
        style={{
          boxShadow: isDragging 
            ? `0 ${shadowY.get()}px ${shadowBlur.get()}px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)`
            : 'inset 0 0 20px rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Glow effect */}
        {isDragging && (
          <motion.div
            className="absolute inset-0 opacity-50"
            animate={{
              background: [
                'radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.3) 0%, transparent 70%)',
                'radial-gradient(circle at 60% 40%, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
                'radial-gradient(circle at 40% 60%, rgba(147, 51, 234, 0.3) 0%, transparent 70%)',
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        )}
        
        {/* Content */}
        <div className="relative z-10 p-4">
          {item.content}
        </div>
        
        {/* Drag handle indicator */}
        <div className="absolute top-2 right-2 opacity-50">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="4" cy="4" r="1.5" />
            <circle cx="12" cy="4" r="1.5" />
            <circle cx="4" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
          </svg>
        </div>
      </motion.div>
      
      {/* Long press indicator */}
      <AnimatePresence>
        {isLongPress && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute inset-0 rounded-2xl border-2 border-purple-400 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Drop Zone Component
export const DropZone: React.FC<{
  zone: DropZone;
  children?: React.ReactNode;
  className?: string;
}> = ({ zone, children, className = "" }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [dropPosition, setDropPosition] = useState<Position>({ x: 0, y: 0 });
  const zoneRef = useRef<HTMLDivElement>(null);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovered(true);
  };
  
  const handleDragLeave = () => {
    setIsHovered(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovered(false);
    
    // Get drop position for effects
    const rect = zoneRef.current?.getBoundingClientRect();
    if (rect) {
      setDropPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
    }
    
    // Trigger effects
    setShowRipple(true);
    setShowParticles(true);
    
    // Reset effects
    setTimeout(() => setShowRipple(false), 600);
    setTimeout(() => setShowParticles(false), 800);
    
    // Handle drop logic
    // zone.onDrop(draggedItem, zone.id);
  };
  
  return (
    <>
      <motion.div
        ref={zoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          scale: isHovered ? 1.02 : 1,
          borderColor: isHovered ? 'rgba(147, 51, 234, 0.5)' : 'rgba(255, 255, 255, 0.1)'
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25
        }}
        className={`
          relative overflow-hidden rounded-2xl
          ${zone.isOccupied ? 'bg-white/5' : 'bg-white/3'}
          backdrop-blur-md border-2 border-dashed
          transition-all duration-300
          ${className}
        `}
        style={{
          boxShadow: isHovered
            ? 'inset 0 0 30px rgba(147, 51, 234, 0.2), 0 0 30px rgba(147, 51, 234, 0.1)'
            : 'inset 0 0 20px rgba(255, 255, 255, 0.03)'
        }}
      >
        {/* Hover glow effect */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    'radial-gradient(circle at 0% 0%, rgba(147, 51, 234, 0.2) 0%, transparent 50%)',
                    'radial-gradient(circle at 100% 100%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)',
                    'radial-gradient(circle at 0% 0%, rgba(147, 51, 234, 0.2) 0%, transparent 50%)',
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Content */}
        <div className="relative z-10 p-4 min-h-[100px] flex items-center justify-center">
          {children || (
            <div className="text-white/30 text-sm">
              {isHovered ? 'Drop here' : 'Empty slot'}
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Effects */}
      <RippleEffect position={dropPosition} trigger={showRipple} />
      <ParticleEffect position={dropPosition} trigger={showParticles} />
    </>
  );
};

// Drag Trail Component
export const DragTrail: React.FC<{ isDragging: boolean; position: Position }> = ({ isDragging, position }) => {
  const [trail, setTrail] = useState<Position[]>([]);
  
  useEffect(() => {
    if (isDragging) {
      const interval = setInterval(() => {
        setTrail(prev => [...prev.slice(-5), position]);
      }, 50);
      return () => clearInterval(interval);
    } else {
      setTrail([]);
    }
  }, [isDragging, position]);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {trail.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"
          style={{ left: pos.x - 8, top: pos.y - 8 }}
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      ))}
    </div>
  );
};

// Main Drag and Drop Container
export const DragDropContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<Position>({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setDragPosition({ x: e.clientX, y: e.clientY });
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        setDragPosition({ 
          x: e.touches[0].clientX, 
          y: e.touches[0].clientY 
        });
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDragging]);
  
  return (
    <div className="relative w-full h-full">
      {children}
      <DragTrail isDragging={isDragging} position={dragPosition} />
    </div>
  );
};