export interface SimpleCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
}

type Entry = { expiresAt: number; value: unknown };

class InMemorySimpleCache implements SimpleCache {
  private store = new Map<string, Entry>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlMs: number = 1000 * 60 * 10): Promise<void> {
    const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : 0;
    this.store.set(key, { value, expiresAt });
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of Array.from(this.store.keys())) {
      if (regex.test(key)) this.store.delete(key);
    }
  }
}

export const simpleCache: SimpleCache = new InMemorySimpleCache();

export const SimpleCacheKey = {
  recipe: (id: string) => `recipe:${id}`,
  recipeList: (filters?: string) => `recipe:list:${filters ?? 'all'}`,
};