import { TimerService, getTimerService, commonTimerPresets, getTimerPresetForInstruction } from '../services/timerService';

// Mock audio context
const mockAudioContext = {
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    frequency: { value: 0 },
    type: 'sine',
    start: jest.fn(),
    stop: jest.fn()
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: {
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn()
    }
  })),
  destination: {},
  currentTime: 0
};

Object.defineProperty(global, 'window', {
  value: {
    AudioContext: jest.fn(() => mockAudioContext),
    webkitAudioContext: jest.fn(() => mockAudioContext),
    Notification: jest.fn()
  },
  writable: true
});

// Mock Notification
Object.defineProperty(global, 'Notification', {
  value: jest.fn(),
  writable: true
});

describe('TimerService', () => {
  let timerService: TimerService;

  beforeEach(() => {
    timerService = new TimerService();
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    timerService.destroy();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('timer creation', () => {
    it('should create a timer with correct properties', () => {
      const name = 'Test Timer';
      const duration = 300; // 5 minutes
      const stepId = 'step-1';

      const timer = timerService.createTimer(name, duration, stepId);

      expect(timer.name).toBe(name);
      expect(timer.duration_seconds).toBe(duration);
      expect(timer.remaining_seconds).toBe(duration);
      expect(timer.state).toBe('idle');
      expect(timer.step_id).toBe(stepId);
      expect(timer.id).toBeDefined();
      expect(timer.created_at).toBeDefined();
    });

    it('should create timer without step association', () => {
      const timer = timerService.createTimer('No Step Timer', 60);

      expect(timer.step_id).toBeUndefined();
    });

    it('should generate unique IDs for multiple timers', () => {
      const timer1 = timerService.createTimer('Timer 1', 60);
      const timer2 = timerService.createTimer('Timer 2', 60);

      expect(timer1.id).not.toBe(timer2.id);
    });
  });

  describe('timer controls', () => {
    let timer: any;

    beforeEach(() => {
      timer = timerService.createTimer('Test Timer', 10);
    });

    it('should start timer successfully', () => {
      const onTick = jest.fn();
      const onComplete = jest.fn();

      const result = timerService.startTimer(timer.id, onTick, onComplete);

      expect(result).toBe(true);
      expect(timer.state).toBe('running');
      expect(timer.started_at).toBeDefined();
    });

    it('should tick timer every second', () => {
      const onTick = jest.fn();
      
      timerService.startTimer(timer.id, onTick);
      
      jest.advanceTimersByTime(1000);
      expect(onTick).toHaveBeenCalledTimes(1);
      expect(timerService.getTimer(timer.id)?.remaining_seconds).toBe(9);
      
      jest.advanceTimersByTime(2000);
      expect(onTick).toHaveBeenCalledTimes(3);
      expect(timerService.getTimer(timer.id)?.remaining_seconds).toBe(7);
    });

    it('should complete timer when reaching zero', () => {
      const onTick = jest.fn();
      const onComplete = jest.fn();
      
      timerService.startTimer(timer.id, onTick, onComplete);
      
      jest.advanceTimersByTime(10000);
      
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(timerService.getTimer(timer.id)?.state).toBe('completed');
      expect(timerService.getTimer(timer.id)?.remaining_seconds).toBe(0);
      expect(timerService.getTimer(timer.id)?.completed_at).toBeDefined();
    });

    it('should pause timer', () => {
      timerService.startTimer(timer.id);
      
      jest.advanceTimersByTime(3000);
      const result = timerService.pauseTimer(timer.id);
      
      expect(result).toBe(true);
      expect(timerService.getTimer(timer.id)?.state).toBe('paused');
      expect(timerService.getTimer(timer.id)?.paused_at).toBeDefined();
      expect(timerService.getTimer(timer.id)?.remaining_seconds).toBe(7);
    });

    it('should resume paused timer', () => {
      timerService.startTimer(timer.id);
      jest.advanceTimersByTime(3000);
      timerService.pauseTimer(timer.id);
      
      const result = timerService.resumeTimer(timer.id);
      
      expect(result).toBe(true);
      expect(timerService.getTimer(timer.id)?.state).toBe('running');
      expect(timerService.getTimer(timer.id)?.paused_at).toBeUndefined();
    });

    it('should stop timer and reset', () => {
      timerService.startTimer(timer.id);
      jest.advanceTimersByTime(3000);
      
      const result = timerService.stopTimer(timer.id);
      
      expect(result).toBe(true);
      expect(timerService.getTimer(timer.id)?.state).toBe('idle');
      expect(timerService.getTimer(timer.id)?.remaining_seconds).toBe(10);
      expect(timerService.getTimer(timer.id)?.started_at).toBeUndefined();
    });

    it('should delete timer completely', () => {
      const result = timerService.deleteTimer(timer.id);
      
      expect(result).toBe(true);
      expect(timerService.getTimer(timer.id)).toBeUndefined();
    });

    it('should handle operations on non-existent timer', () => {
      const fakeId = 'non-existent';
      
      expect(timerService.startTimer(fakeId)).toBe(false);
      expect(timerService.pauseTimer(fakeId)).toBe(false);
      expect(timerService.resumeTimer(fakeId)).toBe(false);
      expect(timerService.stopTimer(fakeId)).toBe(false);
      expect(timerService.deleteTimer(fakeId)).toBe(false);
    });
  });

  describe('timer queries', () => {
    let timer1: any, timer2: any, timer3: any;

    beforeEach(() => {
      timer1 = timerService.createTimer('Timer 1', 60);
      timer2 = timerService.createTimer('Timer 2', 120, 'step-1');
      timer3 = timerService.createTimer('Timer 3', 180, 'step-2');
    });

    it('should get all timers', () => {
      const timers = timerService.getAllTimers();
      
      expect(timers).toHaveLength(3);
      expect(timers.map(t => t.name)).toContain('Timer 1');
      expect(timers.map(t => t.name)).toContain('Timer 2');
      expect(timers.map(t => t.name)).toContain('Timer 3');
    });

    it('should get active timers', () => {
      timerService.startTimer(timer1.id);
      timerService.startTimer(timer2.id);
      timerService.pauseTimer(timer2.id);
      
      const activeTimers = timerService.getActiveTimers();
      
      expect(activeTimers).toHaveLength(2);
      expect(activeTimers.map(t => t.state)).toContain('running');
      expect(activeTimers.map(t => t.state)).toContain('paused');
    });

    it('should get timers for specific step', () => {
      const stepTimers = timerService.getTimersForStep('step-1');
      
      expect(stepTimers).toHaveLength(1);
      expect(stepTimers[0].name).toBe('Timer 2');
    });

    it('should return empty array for non-existent step', () => {
      const stepTimers = timerService.getTimersForStep('non-existent');
      
      expect(stepTimers).toHaveLength(0);
    });
  });

  describe('timer modification', () => {
    let timer: any;

    beforeEach(() => {
      timer = timerService.createTimer('Test Timer', 60);
    });

    it('should add time to timer', () => {
      const result = timerService.addTimeToTimer(timer.id, 30);
      
      expect(result).toBe(true);
      expect(timerService.getTimer(timer.id)?.remaining_seconds).toBe(90);
      expect(timerService.getTimer(timer.id)?.duration_seconds).toBe(90);
    });

    it('should handle adding time to non-existent timer', () => {
      const result = timerService.addTimeToTimer('non-existent', 30);
      
      expect(result).toBe(false);
    });
  });

  describe('time formatting', () => {
    it('should format time display correctly', () => {
      expect(timerService.formatTimeDisplay(30)).toBe('00:30');
      expect(timerService.formatTimeDisplay(90)).toBe('01:30');
      expect(timerService.formatTimeDisplay(3661)).toBe('01:01:01');
    });

    it('should format time for speech correctly', () => {
      expect(timerService.formatTimeForSpeech(30)).toBe('30 seconds');
      expect(timerService.formatTimeForSpeech(60)).toBe('1 minute');
      expect(timerService.formatTimeForSpeech(90)).toBe('1 minute and 30 seconds');
      expect(timerService.formatTimeForSpeech(3661)).toBe('1 hour and 1 minute and 1 second');
    });
  });

  describe('time parsing', () => {
    it('should parse MM:SS format', () => {
      expect(timerService.parseTimeString('5:30')).toBe(330);
      expect(timerService.parseTimeString('12:45')).toBe(765);
    });

    it('should parse HH:MM:SS format', () => {
      expect(timerService.parseTimeString('1:30:45')).toBe(5445);
    });

    it('should parse natural language', () => {
      expect(timerService.parseTimeString('5 minutes')).toBe(300);
      expect(timerService.parseTimeString('1 hour')).toBe(3600);
      expect(timerService.parseTimeString('30 seconds')).toBe(30);
      expect(timerService.parseTimeString('1 hour 30 minutes')).toBe(5400);
    });

    it('should assume minutes for plain numbers', () => {
      expect(timerService.parseTimeString('5')).toBe(300);
      expect(timerService.parseTimeString('10')).toBe(600);
    });

    it('should handle invalid input', () => {
      expect(timerService.parseTimeString('')).toBe(0);
      expect(timerService.parseTimeString('invalid')).toBe(0);
    });
  });

  describe('quick timer creation', () => {
    it('should create quick timer with minutes', () => {
      const timer = timerService.createQuickTimer(5);
      
      expect(timer.name).toBe('5 min timer');
      expect(timer.duration_seconds).toBe(300);
    });

    it('should create quick timer with custom name', () => {
      const timer = timerService.createQuickTimer(10, 'Pasta Timer');
      
      expect(timer.name).toBe('Pasta Timer');
      expect(timer.duration_seconds).toBe(600);
    });
  });

  describe('notification system', () => {
    let timer: any;

    beforeEach(() => {
      timer = timerService.createTimer('Test Timer', 1);
    });

    it('should play notification sound on completion', () => {
      timerService.startTimer(timer.id);
      
      jest.advanceTimersByTime(1000);
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('should show notification when audio fails', () => {
      // Mock audio context to throw error
      mockAudioContext.createOscillator.mockImplementation(() => {
        throw new Error('Audio not supported');
      });

      Object.defineProperty(global, 'Notification', {
        value: {
          permission: 'granted'
        },
        writable: true
      });

      timerService.startTimer(timer.id);
      
      jest.advanceTimersByTime(1000);
      
      expect(global.Notification).toHaveBeenCalledWith(
        'Timer Complete!',
        expect.objectContaining({
          body: 'Your cooking timer has finished.'
        })
      );
    });
  });

  describe('cleanup', () => {
    it('should clean up all timers and intervals', () => {
      const timer1 = timerService.createTimer('Timer 1', 60);
      const timer2 = timerService.createTimer('Timer 2', 120);
      
      timerService.startTimer(timer1.id);
      timerService.startTimer(timer2.id);
      
      timerService.destroy();
      
      expect(timerService.getAllTimers()).toHaveLength(0);
    });
  });
});

describe('getTimerService', () => {
  it('should return singleton instance', () => {
    const service1 = getTimerService();
    const service2 = getTimerService();
    
    expect(service1).toBe(service2);
  });
});

describe('commonTimerPresets', () => {
  it('should have predefined presets', () => {
    expect(commonTimerPresets).toEqual([
      { name: 'Quick Timer', minutes: 5 },
      { name: 'Boil Water', minutes: 10 },
      { name: 'Simmer', minutes: 15 },
      { name: 'Bake Check', minutes: 20 },
      { name: 'Marinate', minutes: 30 },
      { name: 'Rising Dough', minutes: 60 },
      { name: 'Slow Cook', minutes: 120 }
    ]);
  });
});

describe('getTimerPresetForInstruction', () => {
  it('should extract timer from instruction text', () => {
    expect(getTimerPresetForInstruction('Bake for 25 minutes')).toBe(1500);
    expect(getTimerPresetForInstruction('Simmer for 2 hours')).toBe(7200);
    expect(getTimerPresetForInstruction('Wait 30 seconds')).toBe(30);
  });

  it('should handle range formats', () => {
    expect(getTimerPresetForInstruction('Bake for 20-25 minutes')).toBe(1350); // Average
  });

  it('should return null for no time found', () => {
    expect(getTimerPresetForInstruction('Mix ingredients well')).toBeNull();
  });
});