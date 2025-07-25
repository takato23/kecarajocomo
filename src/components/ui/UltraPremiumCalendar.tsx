'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface UltraPremiumCalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  className?: string;
}

export default function UltraPremiumCalendar({ 
  selectedDate = new Date(), 
  onDateSelect,
  className = '' 
}: UltraPremiumCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  }, [currentDate]);

  const firstDayOfMonth = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  }, [currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        if (direction === 'prev') {
          newDate.setMonth(prev.getMonth() - 1);
        } else {
          newDate.setMonth(prev.getMonth() + 1);
        }
        return newDate;
      });
      setIsTransitioning(false);
    }, 150);
  };

  const handleDateClick = (day: number) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    onDateSelect?.(selected);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      selectedDate &&
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const calendarDays = useMemo(() => {
    const days = [];
    const totalSlots = 42; // 6 weeks × 7 days
    
    // Previous month days
    const prevMonthDays = firstDayOfMonth;
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    const prevMonthLastDate = prevMonth.getDate();
    
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDate - i,
        isCurrentMonth: false,
        isPrevMonth: true
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        isPrevMonth: false
      });
    }
    
    // Next month days
    const remainingSlots = totalSlots - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        isPrevMonth: false
      });
    }
    
    return days;
  }, [currentDate, firstDayOfMonth, daysInMonth]);

  return (
    <div className={`relative ${className}`}>
      {/* Ambient background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse animation-delay-2000" />
      </div>

      {/* Main calendar container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative backdrop-blur-2xl bg-white/[0.02] rounded-3xl border border-white/[0.08] shadow-2xl"
      >
        {/* Glass layers */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-transparent" />
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-purple-500/[0.03] via-transparent to-blue-500/[0.03]" />
        
        {/* Inner glow */}
        <div className="absolute inset-[1px] rounded-3xl bg-gradient-to-b from-white/[0.05] to-transparent opacity-60" />
        
        <div className="relative p-8 sm:p-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateMonth('prev')}
              className="group relative p-3 rounded-2xl transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-2xl bg-white/[0.05] backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.1] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <ChevronLeft className="relative w-5 h-5 text-white/60 group-hover:text-white/90 transition-colors duration-300" />
            </motion.button>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentDate.getMonth()}-${currentDate.getFullYear()}`}
                initial={{ opacity: 0, y: isTransitioning ? 10 : -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: isTransitioning ? -10 : 10 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <h2 className="text-3xl font-extralight text-white/90 tracking-wide">
                  {monthNames[currentDate.getMonth()]}
                </h2>
                <p className="text-sm text-white/50 mt-1 tracking-widest">
                  {currentDate.getFullYear()}
                </p>
              </motion.div>
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateMonth('next')}
              className="group relative p-3 rounded-2xl transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-2xl bg-white/[0.05] backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.1] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <ChevronRight className="relative w-5 h-5 text-white/60 group-hover:text-white/90 transition-colors duration-300" />
            </motion.button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div
                key={index}
                className="text-center text-xs font-medium text-white/40 tracking-widest py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentDate.getMonth()}-${currentDate.getFullYear()}-grid`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-7 gap-2"
            >
              {calendarDays.map((dayInfo, index) => {
                const { day, isCurrentMonth } = dayInfo;
                const selected = isCurrentMonth && isSelected(day);
                const today = isCurrentMonth && isToday(day);
                const hovered = hoveredDate === index;

                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: isCurrentMonth ? 1.05 : 1 }}
                    whileTap={{ scale: isCurrentMonth ? 0.95 : 1 }}
                    onClick={() => isCurrentMonth && handleDateClick(day)}
                    onMouseEnter={() => setHoveredDate(index)}
                    onMouseLeave={() => setHoveredDate(null)}
                    disabled={!isCurrentMonth}
                    className={`
                      relative h-12 sm:h-14 rounded-2xl font-light text-sm sm:text-base
                      transition-all duration-300 group
                      ${isCurrentMonth ? 'cursor-pointer' : 'cursor-default'}
                    `}
                  >
                    {/* Base glass layer */}
                    <div
                      className={`
                        absolute inset-0 rounded-2xl transition-all duration-300
                        ${isCurrentMonth ? 'bg-white/[0.03] backdrop-blur-sm' : ''}
                        ${hovered && isCurrentMonth ? 'bg-white/[0.08]' : ''}
                        ${selected ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20' : ''}
                        ${today && !selected ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10' : ''}
                      `}
                    />

                    {/* Hover glow */}
                    {isCurrentMonth && (
                      <div
                        className={`
                          absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300
                          ${hovered ? 'opacity-100' : ''}
                        `}
                      >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.1] to-transparent" />
                        <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent" />
                      </div>
                    )}

                    {/* Selected ring */}
                    {selected && (
                      <motion.div
                        layoutId="selectedDate"
                        className="absolute inset-0 rounded-2xl border border-white/20"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}

                    {/* Today indicator */}
                    {today && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400/70" />
                    )}

                    {/* Day number */}
                    <span
                      className={`
                        relative z-10 flex items-center justify-center h-full
                        ${isCurrentMonth ? 'text-white/90' : 'text-white/20'}
                        ${selected ? 'text-white font-normal' : ''}
                        ${today && !selected ? 'text-amber-200/90' : ''}
                      `}
                    >
                      {day}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Footer accent */}
          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400/50" />
                <span className="text-xs text-white/40">Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400/50 to-blue-400/50" />
                <span className="text-xs text-white/40">Selected</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}