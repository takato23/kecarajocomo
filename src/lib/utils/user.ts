// User utilities for anonymous and authenticated users
// Enhanced from Summit implementation

let anonymousUserId: string | null = null;

export function getUserId(): string {
  // In a real app, this would check session/auth
  // For now, generate a consistent anonymous ID
  if (!anonymousUserId) {
    if (typeof window !== 'undefined') {
      // Try to get from localStorage first
      anonymousUserId = localStorage.getItem('anonymous_user_id');
      if (!anonymousUserId) {
        anonymousUserId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('anonymous_user_id', anonymousUserId);
      }
    } else {
      // Server-side fallback
      anonymousUserId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }
  
  return anonymousUserId;
}

export function clearAnonymousUserId(): void {
  anonymousUserId = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('anonymous_user_id');
  }
}

export function isAnonymousUser(userId: string): boolean {
  return userId.startsWith('anon_');
}