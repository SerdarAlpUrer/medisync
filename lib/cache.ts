/**
 * Cache Implementation
 * Uses Redis when available, falls back to in-memory cache
 */

import { redisCache } from './cache/redis'

// Re-export cache with async interface
// For backward compatibility, we provide sync methods that work with in-memory
// but recommend using async methods for Redis support

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class InMemoryCacheSync {
  private store: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL: number = 15 * 60 * 1000 // 15 minutes (increased for performance)

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    this.defaultTTL = defaultTTL
    setInterval(() => this.cleanup(), 60 * 1000)
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt < now) {
        this.store.delete(key)
      }
    }
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key)
      return null
    }

    return entry.data as T
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL)
    this.store.set(key, { data, expiresAt })
  }

  delete(key: string): void {
    if (key.includes('*')) {
      const prefix = key.split('*')[0]
      for (const k of Array.from(this.store.keys())) {
        if (k.startsWith(prefix) || k === key) {
          this.store.delete(k)
        }
      }
      return
    }
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  has(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry) return false
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key)
      return false
    }
    return true
  }
}

// For backward compatibility - sync interface (in-memory only)
const inMemoryCache = new InMemoryCacheSync()

/**
 * Cache interface that uses Redis when available
 * For new code, prefer using redisCache directly with async methods
 */
class Cache {
  get<T>(key: string): T | null {
    // Sync method - only works with in-memory cache
    // For Redis, use redisCache.get() which is async
    return inMemoryCache.get<T>(key)
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Sync method - only works with in-memory cache
    // For Redis, use redisCache.set() which is async
    inMemoryCache.set(key, data, ttl)
    // Also try to set in Redis asynchronously (fire and forget)
    if (typeof window === 'undefined') {
      redisCache.set(key, data, ttl).catch(() => {
        // Silently fail - in-memory cache is already set
      })
    }
  }

  delete(key: string): void {
    inMemoryCache.delete(key)
    if (typeof window === 'undefined') {
      redisCache.delete(key).catch(() => { })
    }
  }

  clear(): void {
    inMemoryCache.clear()
    if (typeof window === 'undefined') {
      redisCache.clear().catch(() => { })
    }
  }

  has(key: string): boolean {
    return inMemoryCache.has(key)
  }
}

export const cache = new Cache()

// Export Redis cache for async usage
export { redisCache } from './cache/redis'

/**
 * Cache key generators
 */
export const cacheKeys = {
  device: (id: string) => `device:${id}`,
  devices: (filters: string) => `devices:${filters}`,
  dashboard: (hospitalId?: string) => `dashboard:${hospitalId || 'all'}`,
  settings: () => 'settings:default',
  hospital: (id: string) => `hospital:${id}`,
  location: (id: string) => `location:${id}`,
  category: (id: string) => `category:${id}`,
}

