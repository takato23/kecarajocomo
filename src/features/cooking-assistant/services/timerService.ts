import { CookingTimer } from '../types';

export class TimerService {
  private timers: Map<string, CookingTimer> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private callbacks: Map<string, (timer: CookingTimer) => void> = new Map();
  private completionCallbacks: Map<string, (timer: CookingTimer) => void> = new Map();

  createTimer(name: string, durationSeconds: number, stepId?: string): CookingTimer {
    const timer: CookingTimer = {
      id: crypto.randomUUID(),
      name,
      duration_seconds: durationSeconds,
      remaining_seconds: durationSeconds,
      state: 'idle',
      created_at: new Date().toISOString(),
      step_id: stepId
    };

    this.timers.set(timer.id, timer);
    return timer;
  }

  startTimer(timerId: string, onTick?: (timer: CookingTimer) => void, onComplete?: (timer: CookingTimer) => void): boolean {
    const timer = this.timers.get(timerId);
    if (!timer) return false;

    if (timer.state === 'running') return true;

    // Resume from paused state or start fresh
    if (timer.state === 'idle') {
      timer.started_at = new Date().toISOString();
    }

    timer.state = 'running';
    timer.paused_at = undefined;

    if (onTick) {
      this.callbacks.set(timerId, onTick);
    }

    if (onComplete) {
      this.completionCallbacks.set(timerId, onComplete);
    }

    // Start the countdown
    const interval = setInterval(() => {
      const currentTimer = this.timers.get(timerId);
      if (!currentTimer || currentTimer.state !== 'running') {
        clearInterval(interval);
        this.intervals.delete(timerId);
        return;
      }

      currentTimer.remaining_seconds--;
      
      // Call tick callback
      const tickCallback = this.callbacks.get(timerId);
      if (tickCallback) {
        tickCallback(currentTimer);
      }

      // Check if timer is complete
      if (currentTimer.remaining_seconds <= 0) {
        this.completeTimer(timerId);
      }
    }, 1000);

    this.intervals.set(timerId, interval);
    return true;
  }

  pauseTimer(timerId: string): boolean {
    const timer = this.timers.get(timerId);
    if (!timer || timer.state !== 'running') return false;

    timer.state = 'paused';
    timer.paused_at = new Date().toISOString();

    const interval = this.intervals.get(timerId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(timerId);
    }

    return true;
  }

  resumeTimer(timerId: string): boolean {
    const timer = this.timers.get(timerId);
    if (!timer || timer.state !== 'paused') return false;

    return this.startTimer(timerId, this.callbacks.get(timerId), this.completionCallbacks.get(timerId));
  }

  stopTimer(timerId: string): boolean {
    const timer = this.timers.get(timerId);
    if (!timer) return false;

    timer.state = 'idle';
    timer.remaining_seconds = timer.duration_seconds;
    timer.started_at = undefined;
    timer.paused_at = undefined;
    timer.completed_at = undefined;

    const interval = this.intervals.get(timerId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(timerId);
    }

    this.callbacks.delete(timerId);
    this.completionCallbacks.delete(timerId);

    return true;
  }

  private completeTimer(timerId: string): void {
    const timer = this.timers.get(timerId);
    if (!timer) return;

    timer.state = 'completed';
    timer.completed_at = new Date().toISOString();
    timer.remaining_seconds = 0;

    const interval = this.intervals.get(timerId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(timerId);
    }

    // Call completion callback
    const completionCallback = this.completionCallbacks.get(timerId);
    if (completionCallback) {
      completionCallback(timer);
    }

    // Play notification sound
    this.playNotificationSound();
  }

  deleteTimer(timerId: string): boolean {
    const timer = this.timers.get(timerId);
    if (!timer) return false;

    // Stop the timer first
    this.stopTimer(timerId);

    // Remove from storage
    this.timers.delete(timerId);
    this.callbacks.delete(timerId);
    this.completionCallbacks.delete(timerId);

    return true;
  }

  getTimer(timerId: string): CookingTimer | undefined {
    return this.timers.get(timerId);
  }

  getAllTimers(): CookingTimer[] {
    return Array.from(this.timers.values());
  }

  getActiveTimers(): CookingTimer[] {
    return Array.from(this.timers.values()).filter(timer => 
      timer.state === 'running' || timer.state === 'paused'
    );
  }

  getTimersForStep(stepId: string): CookingTimer[] {
    return Array.from(this.timers.values()).filter(timer => timer.step_id === stepId);
  }

  addTimeToTimer(timerId: string, additionalSeconds: number): boolean {
    const timer = this.timers.get(timerId);
    if (!timer) return false;

    timer.remaining_seconds += additionalSeconds;
    timer.duration_seconds += additionalSeconds;
    
    return true;
  }

  formatTimeDisplay(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }

  formatTimeForSpeech(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts: string[] = [];
    
    if (hours > 0) {
      parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    }
    
    if (minutes > 0) {
      parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    }
    
    if (remainingSeconds > 0 || parts.length === 0) {
      parts.push(`${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`);
    }

    return parts.join(' and ');
  }

  private playNotificationSound(): void {
    try {
      // Create audio context for timer sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create a simple beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // 800 Hz tone
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error: unknown) {
      console.warn('Could not play notification sound:', error);
      // Fallback to system notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Timer Complete!', {
          body: 'Your cooking timer has finished.',
          icon: '/icon-192.png'
        });
      }
    }
  }

  // Utility methods
  parseTimeString(timeStr: string): number {
    // Parse strings like "5 minutes", "2:30", "1 hour 30 minutes"
    const normalized = timeStr.toLowerCase().trim();
    
    // Handle MM:SS format
    if (/^\d{1,2}:\d{2}$/.test(normalized)) {
      const [minutes, seconds] = normalized.split(':').map(Number);
      return minutes * 60 + seconds;
    }
    
    // Handle HH:MM:SS format
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(normalized)) {
      const [hours, minutes, seconds] = normalized.split(':').map(Number);
      return hours * 3600 + minutes * 60 + seconds;
    }
    
    // Handle natural language
    let totalSeconds = 0;
    
    const hourMatch = normalized.match(/(\d+)\s*h(?:our)?s?/);
    if (hourMatch) {
      totalSeconds += parseInt(hourMatch[1]) * 3600;
    }
    
    const minuteMatch = normalized.match(/(\d+)\s*m(?:in|inute)?s?/);
    if (minuteMatch) {
      totalSeconds += parseInt(minuteMatch[1]) * 60;
    }
    
    const secondMatch = normalized.match(/(\d+)\s*s(?:ec|econd)?s?/);
    if (secondMatch) {
      totalSeconds += parseInt(secondMatch[1]);
    }
    
    // If no time unit specified, assume minutes
    if (totalSeconds === 0) {
      const numberMatch = normalized.match(/(\d+)/);
      if (numberMatch) {
        totalSeconds = parseInt(numberMatch[1]) * 60;
      }
    }
    
    return totalSeconds;
  }

  createQuickTimer(minutes: number, name?: string): CookingTimer {
    const timerName = name || `${minutes} min timer`;
    return this.createTimer(timerName, minutes * 60);
  }

  // Cleanup method
  destroy(): void {
    // Clear all intervals
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    
    // Clear all data
    this.timers.clear();
    this.intervals.clear();
    this.callbacks.clear();
    this.completionCallbacks.clear();
  }
}

// Global timer service instance
let timerServiceInstance: TimerService | null = null;

export const getTimerService = (): TimerService => {
  if (!timerServiceInstance) {
    timerServiceInstance = new TimerService();
  }
  return timerServiceInstance;
};

export const destroyTimerService = (): void => {
  if (timerServiceInstance) {
    timerServiceInstance.destroy();
    timerServiceInstance = null;
  }
};

// Utility functions
export const commonTimerPresets = [
  { name: 'Quick Timer', minutes: 5 },
  { name: 'Boil Water', minutes: 10 },
  { name: 'Simmer', minutes: 15 },
  { name: 'Bake Check', minutes: 20 },
  { name: 'Marinate', minutes: 30 },
  { name: 'Rising Dough', minutes: 60 },
  { name: 'Slow Cook', minutes: 120 }
];

export const getTimerPresetForInstruction = (instruction: string): number | null => {
  const lowerInstruction = instruction.toLowerCase();
  
  // Common cooking time patterns
  const patterns = [
    { regex: /(\d+)\s*minutes?/i, multiplier: 60 },
    { regex: /(\d+)\s*hours?/i, multiplier: 3600 },
    { regex: /(\d+)\s*seconds?/i, multiplier: 1 },
    { regex: /(\d+)-(\d+)\s*minutes?/i, multiplier: 60, useAverage: true }
  ];
  
  for (const pattern of patterns) {
    const match = lowerInstruction.match(pattern.regex);
    if (match) {
      if (pattern.useAverage) {
        const min = parseInt(match[1]);
        const max = parseInt(match[2]);
        return Math.floor((min + max) / 2) * pattern.multiplier;
      } else {
        return parseInt(match[1]) * pattern.multiplier;
      }
    }
  }
  
  return null;
};