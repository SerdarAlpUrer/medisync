import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

interface AuditLogInput {
    userId?: string
    userName: string
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW' | 'EXPORT' | 'SIGN'
    entity: string
    entityId?: string
    beforeValue?: object
    afterValue?: object
    ipAddress?: string
    userAgent?: string
}

/**
 * Creates an audit log entry - FDA 21 CFR Part 11 Compliant
 */
export async function createAuditLog(input: AuditLogInput) {
    const {
        userId,
        userName,
        action,
        entity,
        entityId,
        beforeValue,
        afterValue,
        ipAddress,
        userAgent
    } = input

    // Create hash for tamper detection
    const dataToHash = JSON.stringify({
        userId,
        userName,
        action,
        entity,
        entityId,
        beforeValue,
        afterValue,
        timestamp: new Date().toISOString()
    })

    const hash = crypto
        .createHash('sha256')
        .update(dataToHash)
        .digest('hex')

    const auditLog = await prisma.auditLog.create({
        data: {
            userId: userId || null,
            userName,
            action,
            entity,
            entityId: entityId || null,
            beforeValue: beforeValue ? JSON.stringify(beforeValue) : null,
            afterValue: afterValue ? JSON.stringify(afterValue) : null,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
            hash
        }
    })

    return auditLog
}

/**
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs(options: {
    entity?: string
    action?: string
    userId?: string
    startDate?: Date
    endDate?: Date
    page?: number
    limit?: number
    hospitalId?: string | null
}) {
    const {
        entity,
        action,
        userId,
        startDate,
        endDate,
        page = 1,
        limit = 50,
        hospitalId
    } = options

    const where: any = {}

    if (hospitalId) where.user = { hospitalId }
    if (entity) where.entity = entity
    if (action) where.action = action
    if (userId) where.userId = userId
    if (startDate || endDate) {
        where.timestamp = {}
        if (startDate) where.timestamp.gte = startDate
        if (endDate) where.timestamp.lte = endDate
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { timestamp: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        }),
        prisma.auditLog.count({ where })
    ])

    return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    }
}

/**
 * Verify audit log hash integrity
 */
export function verifyAuditLogHash(log: any): boolean {
    const dataToHash = JSON.stringify({
        userId: log.userId,
        userName: log.userName,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        beforeValue: log.beforeValue ? JSON.parse(log.beforeValue) : undefined,
        afterValue: log.afterValue ? JSON.parse(log.afterValue) : undefined,
        timestamp: log.timestamp.toISOString()
    })

    const expectedHash = crypto
        .createHash('sha256')
        .update(dataToHash)
        .digest('hex')

    return log.hash === expectedHash
}
