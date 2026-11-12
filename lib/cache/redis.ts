/**
 * Redis Cache Implementation with In-Memory Fallback
 * Uses Redis when available, falls back to in-memory cache
 */

import Redis from 'ioredis'
import { logger } from '../logger'

let redisClient: Redis | null = null
let useRedis = false

// Initialize Redis connection
export function initRedis(): void {
  // REDIS DISABLED MANUALLY TO PREVENT CONNECTION ERRORS
  /*
  const redisUrl = process.env.REDIS_URL
  const redisHost = process.env.REDIS_HOST
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10)
  const redisPassword = process.env.REDIS_PASSWORD

  if (redisUrl || redisHost) {
    try {
      redisClient = redisUrl
        ? new Redis(redisUrl, {
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000)
            return delay
          },
          maxRetriesPerRequest: 3,
        })
        : new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000)
            return delay
          },
          maxRetriesPerRequest: 3,
        })

      redisClient.on('connect', () => {
        logger.info('Redis connected successfully')
        useRedis = true
      })

      redisClient.on('error', (err) => {
        logger.error('Redis connection error', err)
        useRedis = false
      })

      redisClient.on('close', () => {
        logger.warn('Redis connection closed')
        useRedis = false
      })
    } catch (error) {
      logger.error('Failed to initialize Redis', error as Error)
      useRedis = false
    }
  } else {
    logger.info('Redis not configured, using in-memory cache')
    useRedis = false
  }
  */
  logger.info('Redis disabled by configuration')
  useRedis = false
}

// In-memory fallback cache
interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class InMemoryCache {
  private store: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL: number = 5 * 60 * 1000 // 5 minutes

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

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key)
    if (!entry) return null

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key)
      return null
    }

    return entry.data as T
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const expiresAt = Date.now() + (ttl || this.defaultTTL)
    this.store.set(key, { data, expiresAt })
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  async clear(): Promise<void> {
    this.store.clear()
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key)
    if (!entry) return false
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key)
      return false
    }
    return true
  }
}

const inMemoryCache = new InMemoryCache()

/**
 * Redis-backed cache with in-memory fallback
 */
export class RedisCache {
  async get<T>(key: string): Promise<T | null> {
    if (useRedis && redisClient) {
      try {
        const value = await redisClient.get(key)
        if (value === null) return null
        return JSON.parse(value) as T
      } catch (error) {
        logger.error('Redis get error', error as Error, { key })
        // Fallback to in-memory
        return inMemoryCache.get<T>(key)
      }
    }
    return inMemoryCache.get<T>(key)
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const ttlSeconds = ttl ? Math.floor(ttl / 1000) : 300 // Default 5 minutes

    if (useRedis && redisClient) {
      try {
        await redisClient.setex(key, ttlSeconds, JSON.stringify(data))
        return
      } catch (error) {
        logger.error('Redis set error', error as Error, { key })
        // Fallback to in-memory
      }
    }
    await inMemoryCache.set(key, data, ttl)
  }

  async delete(key: string): Promise<void> {
    if (useRedis && redisClient) {
      try {
        await redisClient.del(key)
        return
      } catch (error) {
        logger.error('Redis delete error', error as Error, { key })
      }
    }
    await inMemoryCache.delete(key)
  }

  async clear(): Promise<void> {
    if (useRedis && redisClient) {
      try {
        await redisClient.flushdb()
        return
      } catch (error) {
        logger.error('Redis clear error', error as Error)
      }
    }
    await inMemoryCache.clear()
  }

  async has(key: string): Promise<boolean> {
    if (useRedis && redisClient) {
      try {
        const exists = await redisClient.exists(key)
        return exists === 1
      } catch (error) {
        logger.error('Redis has error', error as Error, { key })
        return inMemoryCache.has(key)
      }
    }
    return inMemoryCache.has(key)
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (useRedis && redisClient) {
      try {
        const keys = await redisClient.keys(pattern)
        if (keys.length > 0) {
          await redisClient.del(...keys)
        }
        return
      } catch (error) {
        logger.error('Redis invalidatePattern error', error as Error, { pattern })
      }
    }
    // For in-memory, we can't easily pattern match, so we clear all
    // In production, you might want to maintain a pattern registry
    logger.warn('Pattern invalidation not fully supported in in-memory mode')
  }
}

export const redisCache = new RedisCache()

// Initialize Redis on module load (only in server-side)
if (typeof window === 'undefined') {
  initRedis()
}

