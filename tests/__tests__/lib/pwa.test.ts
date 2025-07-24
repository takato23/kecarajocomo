/**
 * @jest-environment jsdom
 */
import { PWAService } from '@/lib/pwa'

describe('PWAService', () => {
  let pwaService: PWAService

  beforeEach(() => {
    // Reset singleton
    ;(PWAService as any).instance = undefined
    
    // Mock service worker registration
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: jest.fn().mockResolvedValue({
          addEventListener: jest.fn(),
          active: null,
          installing: null,
          waiting: null,
        }),
        addEventListener: jest.fn(),
        ready: Promise.resolve({}),
        controller: null,
        getRegistration: jest.fn(),
      },
      writable: true,
    })
    
    // Mock window and navigator
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    })
    
    // Mock window.addEventListener
    window.addEventListener = jest.fn()
    
    pwaService = PWAService.getInstance()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns singleton instance', () => {
    const instance1 = PWAService.getInstance()
    const instance2 = PWAService.getInstance()
    expect(instance1).toBe(instance2)
  })

  it('detects online status correctly', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    })
    expect(pwaService.isOnline()).toBe(true)

    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
    })
    expect(pwaService.isOnline()).toBe(false)
  })

  it('detects PWA mode correctly', () => {
    // Test standalone display mode
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(display-mode: standalone)',
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }))

    expect(pwaService.isRunningAsPWA()).toBe(true)
  })

  it('handles install prompt correctly', () => {
    expect(pwaService.isInstallable()).toBe(false)
  })

  it('gets app info correctly', () => {
    // Mock ServiceWorkerRegistration
    Object.defineProperty(window, 'ServiceWorkerRegistration', {
      value: {
        prototype: {
          sync: {}
        }
      },
      writable: true,
    })
    
    const appInfo = pwaService.getAppInfo()
    
    expect(appInfo).toHaveProperty('isOnline')
    expect(appInfo).toHaveProperty('isInstallable')
    expect(appInfo).toHaveProperty('isRunningAsPWA')
    expect(appInfo).toHaveProperty('supportsNotifications')
    expect(appInfo).toHaveProperty('supportsBackgroundSync')
  })

  it('requests notification permission', async () => {
    // Mock Notification API
    Object.defineProperty(window, 'Notification', {
      value: {
        permission: 'default',
        requestPermission: jest.fn().mockResolvedValue('granted'),
      },
      writable: true,
    })

    const permission = await pwaService.requestNotificationPermission()
    expect(permission).toBe('granted')
  })

  it('shows notification when permission granted', () => {
    const mockNotification = jest.fn()
    Object.defineProperty(window, 'Notification', {
      value: mockNotification,
      writable: true,
    })
    
    // Mock permission as granted
    Object.defineProperty(window.Notification, 'permission', {
      value: 'granted',
      writable: true,
    })

    pwaService.showNotification('Test Title', { body: 'Test Body' })
    
    expect(mockNotification).toHaveBeenCalledWith('Test Title', {
      body: 'Test Body',
      icon: '/icon-192.png',
      badge: '/icon-72.png',
    })
  })
})