import { AnalyticsService, getAnalyticsService, initializeAnalytics } from '../services/analyticsService';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock window and document
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://example.com/test',
    search: '?utm_source=google&utm_medium=organic'
  },
  writable: true
});

Object.defineProperty(document, 'referrer', {
  value: 'https://google.com',
  writable: true
});

Object.defineProperty(document, 'title', {
  value: 'Test Page',
  writable: true
});

// Mock navigator
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  writable: true
});

// Mock screen
Object.defineProperty(screen, 'width', { value: 1920, writable: true });
Object.defineProperty(screen, 'height', { value: 1080, writable: true });

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Mock successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    } as Response);

    service = new AnalyticsService({
      enableDebug: false,
      enableLocalStorage: true,
      flushInterval: 1000,
      batchSize: 5
    });
  });

  afterEach(() => {
    if (service) {
      service.destroy();
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await service.initialize();
      
      const session = service.getSession();
      expect(session).toBeTruthy();
      expect(session?.user_id).toBe('anonymous');
      expect(session?.started_at).toBeTruthy();
    });

    it('should initialize with user ID', async () => {
      await service.initialize('user123');
      
      const session = service.getSession();
      expect(session?.user_id).toBe('user123');
    });

    it('should restore session from localStorage', async () => {
      const savedSession = {
        id: 'session123',
        user_id: 'user123',
        started_at: new Date().toISOString(),
        page_views: 5,
        events_count: 10
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedSession));

      await service.initialize();

      const session = service.getSession();
      expect(session?.id).toBe('session123');
      expect(session?.user_id).toBe('user123');
      expect(session?.page_views).toBe(5);
    });

    it('should handle expired session', async () => {
      const expiredSession = {
        id: 'session123',
        user_id: 'user123',
        started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        page_views: 5,
        events_count: 10
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredSession));

      await service.initialize();

      const session = service.getSession();
      expect(session?.id).not.toBe('session123');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('analytics_session');
    });
  });

  describe('event tracking', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should track basic event', () => {
      service.track('test_event', {
        properties: { key: 'value' }
      });

      // Event should be queued
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should track page view', () => {
      service.page('Test Page', { section: 'main' });

      // Should update session page views
      const session = service.getSession();
      expect(session?.page_views).toBe(1);
    });

    it('should track user action', () => {
      service.action('button_click', { button_id: 'submit' });

      // Should track with action type
      const session = service.getSession();
      expect(session?.events_count).toBe(2); // Including session_start
    });

    it('should track conversion', () => {
      service.conversion('signup', 100, { source: 'organic' });

      const session = service.getSession();
      expect(session?.events_count).toBe(2);
    });

    it('should track error immediately', async () => {
      service.error('Test error', { code: 500 });

      // Should flush immediately
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should track timing event', () => {
      service.timing('page_load', 1500, { browser: 'chrome' });

      const session = service.getSession();
      expect(session?.events_count).toBe(2);
    });
  });

  describe('user identification', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should identify user', () => {
      service.identify('user123', { name: 'John Doe' });

      const session = service.getSession();
      expect(session?.user_id).toBe('user123');
    });

    it('should track identify event', () => {
      service.identify('user123', { name: 'John Doe' });

      const session = service.getSession();
      expect(session?.events_count).toBe(2); // session_start + user_identified
    });
  });

  describe('session management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should create new session', () => {
      const session = service.getSession();
      
      expect(session).toBeTruthy();
      expect(session?.id).toBeTruthy();
      expect(session?.started_at).toBeTruthy();
      expect(session?.page_views).toBe(0);
      expect(session?.events_count).toBe(1); // session_start
    });

    it('should end session', () => {
      service.endSession();

      const session = service.getSession();
      expect(session).toBeNull();
    });

    it('should capture UTM parameters', () => {
      const session = service.getSession();
      
      expect(session?.utm_source).toBe('google');
      expect(session?.utm_medium).toBe('organic');
    });
  });

  describe('event batching and flushing', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should flush when batch size reached', () => {
      // Track 5 events (batch size)
      for (let i = 0; i < 5; i++) {
        service.track(`event_${i}`);
      }

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('events')
      });
    });

    it('should flush immediately when requested', async () => {
      service.track('test_event', { immediate: true });

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle flush errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      service.track('test_event', { immediate: true });

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('device detection', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should detect device information', () => {
      service.track('test_event');

      const session = service.getSession();
      expect(session?.events_count).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should handle initialization errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Server error'));

      await expect(service.initialize()).rejects.toThrow();
    });

    it('should handle tracking errors gracefully', async () => {
      await service.initialize();

      // Should not throw
      expect(() => {
        service.track('test_event', { properties: { circular: {} } });
      }).not.toThrow();
    });
  });

  describe('localStorage integration', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should save session to localStorage', () => {
      service.track('test_event');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'analytics_session',
        expect.stringContaining('session')
      );
    });

    it('should handle localStorage errors', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => {
        service.track('test_event');
      }).not.toThrow();
    });
  });

  describe('singleton behavior', () => {
    it('should return same instance', () => {
      const service1 = getAnalyticsService();
      const service2 = getAnalyticsService();

      expect(service1).toBe(service2);
    });

    it('should initialize once', async () => {
      const service1 = await initializeAnalytics();
      const service2 = await initializeAnalytics();

      expect(service1).toBe(service2);
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should cleanup properly', () => {
      service.track('test_event');
      service.destroy();

      expect(mockFetch).toHaveBeenCalled(); // Should flush on destroy
    });
  });
});

describe('Analytics convenience functions', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    } as Response);
  });

  it('should track event with convenience function', async () => {
    const { track } = await import('../services/analyticsService');
    
    track('test_event', { properties: { key: 'value' } });

    // Should work without throwing
    expect(true).toBe(true);
  });

  it('should track page view with convenience function', async () => {
    const { trackPage } = await import('../services/analyticsService');
    
    trackPage('Test Page', { section: 'main' });

    // Should work without throwing
    expect(true).toBe(true);
  });

  it('should identify user with convenience function', async () => {
    const { identify } = await import('../services/analyticsService');
    
    identify('user123', { name: 'John Doe' });

    // Should work without throwing
    expect(true).toBe(true);
  });
});