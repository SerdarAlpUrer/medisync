import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Only log queries in development to avoid performance impact in production
const logLevel = (process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error']) as any

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: logLevel,
        // Connection pool settings (for PostgreSQL)
        // Note: SQLite doesn't support connection pooling
        // When migrating to PostgreSQL, add:
        // datasources: {
        //   db: {
        //     url: process.env.DATABASE_URL + '?connection_limit=10&pool_timeout=20'
        //   }
        // }
    })

globalForPrisma.prisma = prisma
