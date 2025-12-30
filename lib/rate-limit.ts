/**
 * Simple In-Memory Rate Limiting
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

class RateLimiter {
  private store: RateLimitStore = {}
  private maxRequests: number
  private windowMs: number
  private cleanupInterval: NodeJS.Timeout

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs

    // Cleanup old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000) as any
  }

  private cleanup() {
    const now = Date.now()
    for (const key in this.store) {
      if (this.store[key].resetTime < now) {
        delete this.store[key]
      }
    }
  }

  private getKey(identifier: string): string {
    return identifier
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const key = this.getKey(identifier)
    const now = Date.now()

    if (!this.store[key] || this.store[key].resetTime < now) {
      // Create new window
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs,
      }
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: this.store[key].resetTime,
      }
    }

    // Increment count
    this.store[key].count++

    if (this.store[key].count > this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: this.store[key].resetTime,
      }
    }

    return {
      allowed: true,
      remaining: this.maxRequests - this.store[key].count,
      resetTime: this.store[key].resetTime,
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval)
    this.store = {}
  }
}

// Get rate limit config from environment
function getRateLimitConfig() {
  try {
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10)
    return { maxRequests, windowMs }
  } catch {
    return { maxRequests: 100, windowMs: 60000 }
  }
}

const { maxRequests, windowMs } = getRateLimitConfig()
export const rateLimiter = new RateLimiter(maxRequests, windowMs)

/**
 * Rate limit middleware for API routes
 */
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  options?: {
    maxRequests?: number
    windowMs?: number
    getIdentifier?: (req: Request) => string
  }
) {
  return async (req: Request): Promise<Response> => {
    const limiter = options?.maxRequests
      ? new RateLimiter(options.maxRequests, options.windowMs || 60000)
      : rateLimiter

    const getIdentifier = options?.getIdentifier || ((req: Request) => {
      // Try to get IP from headers (works with most proxies)
      const forwarded = req.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
      return ip
    })

    const identifier = getIdentifier(req)
    const result = limiter.check(identifier)

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.',
            code: 'RATE_LIMIT_EXCEEDED',
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // Add rate limit headers to response
    const response = await handler(req)
    response.headers.set('X-RateLimit-Limit', maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString())

    return response
  }
}

