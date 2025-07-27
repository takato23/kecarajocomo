'use client';

import React, { useState } from 'react';
import { logger } from '@/services/logger';

import UltraPremiumCalendar from './UltraPremiumCalendar';

export default function UltraPremiumCalendarExample() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Calendar showcase */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <UltraPremiumCalendar
          selectedDate={selectedDate}
          onDateSelect={(date) => {
            setSelectedDate(date);
            logger.info('Selected date:', 'UltraPremiumCalendar.example', date);
          }}
          className="transform hover:scale-[1.02] transition-transform duration-500"
        />
        
        {/* Selected date display */}
        <div className="mt-8 text-center">
          <p className="text-white/40 text-sm">Selected Date</p>
          <p className="text-white/90 text-xl font-light mt-1">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
    </div>
  );
}