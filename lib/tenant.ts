import { AuthenticatedUser } from '@/lib/auth-middleware'

/**
 * Multi-Tenant Security & Hospital Isolation Helper
 * 
 * In a true SaaS environment, every tenant's data must be strictly isolated.
 * If a user belongs to a specific hospital (tenant), they can NEVER access or mutate
 * another hospital's records, even if they manipulate query parameters or API payloads.
 */
export function resolveTenantHospitalId(
    user: AuthenticatedUser | null | undefined,
    requestedHospitalId?: string | null
): string | undefined {
    if (!user) {
        return undefined
    }

    // If user is locked to a specific hospital, enforce it strictly
    if (user.hospitalId) {
        return user.hospitalId
    }

    // If user is a global Super Admin (no hospitalId constraint), allow filtering by requestedHospitalId
    if (user.role === 'ADMIN' && requestedHospitalId) {
        return requestedHospitalId
    }

    return undefined
}

/**
 * Generates a Prisma where clause condition for tenant isolation
 */
export function buildTenantWhere(
    user: AuthenticatedUser | null | undefined,
    requestedHospitalId?: string | null
): { hospitalId?: string } {
    const hospitalId = resolveTenantHospitalId(user, requestedHospitalId)
    return hospitalId ? { hospitalId } : {}
}
