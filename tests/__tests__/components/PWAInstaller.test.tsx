/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import PWAInstaller from '@/components/PWAInstaller'

// Mock the PWA service
jest.mock('@/lib/pwa', () => ({
  pwaService: {
    getAppInfo: jest.fn().mockReturnValue({
      isOnline: true,
      isInstallable: false,
      isRunningAsPWA: false,
      supportsNotifications: true,
      supportsBackgroundSync: true,
    }),
    installPWA: jest.fn().mockResolvedValue(true),
    showAddToHomeScreenGuidance: jest.fn(),
  },
}))

describe('PWAInstaller', () => {
  beforeEach(() => {
    // Mock addEventListener
    window.addEventListener = jest.fn()
    window.removeEventListener = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<PWAInstaller />)
    // Since the component might not render anything initially, just check it doesn't crash
    expect(true).toBe(true)
  })

  it('handles offline state correctly', () => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    })

    render(<PWAInstaller />)
    
    // Component should handle offline state
    expect(window.addEventListener).toHaveBeenCalled()
  })

  it('sets up event listeners for PWA events', () => {
    render(<PWAInstaller />)
    
    expect(window.addEventListener).toHaveBeenCalledWith('pwa-install-available', expect.any(Function))
    expect(window.addEventListener).toHaveBeenCalledWith('pwa-online', expect.any(Function))
    expect(window.addEventListener).toHaveBeenCalledWith('pwa-offline', expect.any(Function))
  })
})