export type Role =
    | 'ADMIN'
    | 'HOSPITAL_ADMIN'
    | 'MANAGER'
    | 'ENGINEER'
    | 'TECHNICIAN'
    | 'DOCTOR'
    | 'NURSE'
    | 'USER'
    | 'VIEWER'

export type Permission =
    | 'dashboard:view'
    | 'users:manage'
    | 'devices:view'
    | 'devices:create'
    | 'devices:edit'
    | 'devices:delete'
    | 'maintenance:view'
    | 'maintenance:create'
    | 'maintenance:edit'
    | 'maintenance:delete'
    | 'maintenance:approve'
    | 'calibration:view'
    | 'calibration:manage'
    | 'reports:view'
    | 'settings:manage'
    | 'contracts:view'
    | 'files:manage'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    ADMIN: [
        'dashboard:view',
        'users:manage',
        'devices:view', 'devices:create', 'devices:edit', 'devices:delete',
        'maintenance:view', 'maintenance:create', 'maintenance:edit', 'maintenance:delete', 'maintenance:approve',
        'calibration:view', 'calibration:manage',
        'reports:view',
        'settings:manage',
        'contracts:view',
        'files:manage'
    ],
    HOSPITAL_ADMIN: [
        'dashboard:view',
        'users:manage',
        'devices:view', 'devices:create', 'devices:edit', 'devices:delete',
        'maintenance:view', 'maintenance:create', 'maintenance:edit', 'maintenance:delete', 'maintenance:approve',
        'calibration:view', 'calibration:manage',
        'reports:view',
        'contracts:view',
        'files:manage'
    ],
    ENGINEER: [
        'dashboard:view',
        'devices:view', 'devices:create', 'devices:edit', 'devices:delete',
        'maintenance:view', 'maintenance:create', 'maintenance:edit', 'maintenance:delete', 'maintenance:approve',
        'calibration:view', 'calibration:manage',
        'reports:view',
        'contracts:view',
        'files:manage'
    ],
    TECHNICIAN: [
        'dashboard:view',
        'devices:view', 'devices:create', 'devices:edit', 'devices:delete',
        'maintenance:view', 'maintenance:create', 'maintenance:edit', 'maintenance:delete', 'maintenance:approve',
        'calibration:view', 'calibration:manage',
        'reports:view',
        'contracts:view',
        'files:manage'
    ],
    MANAGER: [
        'dashboard:view',
        'devices:view',
        'maintenance:view',
        'calibration:view',
        'reports:view',
        'contracts:view'
    ],
    DOCTOR: [
        'dashboard:view',
        'devices:view',
        'maintenance:view', 'maintenance:create',
        'calibration:view'
    ],
    NURSE: [
        'dashboard:view',
        'devices:view',
        'maintenance:view', 'maintenance:create',
        'calibration:view'
    ],
    USER: [
        'dashboard:view',
        'devices:view',
        'maintenance:view', 'maintenance:create',
        'calibration:view'
    ],
    VIEWER: [
        'dashboard:view',
        'devices:view',
        'maintenance:view',
        'calibration:view',
        'reports:view'
    ]
}

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
    if (!role) return false

    // Normalize role string
    const normalized = role.trim().toUpperCase()

    // 1. ADMIN and SUPERVISOR have unrestricted access
    if (normalized === 'ADMIN' || normalized === 'SUPERVISOR') {
        return true
    }

    // 2. ENGINEER and TECHNICIAN have guaranteed access to all technical operations
    if (
        normalized === 'ENGINEER' ||
        normalized === 'TECHNICIAN' ||
        normalized === 'BIOMEDICAL_ENGINEER' ||
        normalized === 'BIOMEDICAL' ||
        normalized.includes('MÜHENDİS') ||
        normalized.includes('MUHENDIS') ||
        normalized.includes('TEKNİSYEN') ||
        normalized.includes('TEKNISYEN') ||
        normalized.includes('TEKNİKER') ||
        normalized.includes('TEKNIKER')
    ) {
        // Only exclude pure admin user/settings management
        if (permission !== 'users:manage' && permission !== 'settings:manage') {
            return true
        }
    }

    // 3. Map string to defined Role enum
    let userRole: Role = 'USER'
    if (normalized === 'HOSPITAL_ADMIN') userRole = 'HOSPITAL_ADMIN'
    else if (normalized === 'ENGINEER' || normalized === 'BIOMEDICAL_ENGINEER' || normalized === 'BIOMEDICAL' || normalized.includes('MÜHENDİS') || normalized.includes('MUHENDIS')) userRole = 'ENGINEER'
    else if (normalized === 'TECHNICIAN' || normalized.includes('TEKNİSYEN') || normalized.includes('TEKNISYEN') || normalized.includes('TEKNİKER') || normalized.includes('TEKNIKER')) userRole = 'TECHNICIAN'
    else if (normalized === 'MANAGER' || normalized.includes('MÜDÜR') || normalized.includes('MUDUR')) userRole = 'MANAGER'
    else if (normalized === 'DOCTOR' || normalized.includes('DOKTOR')) userRole = 'DOCTOR'
    else if (normalized === 'NURSE' || normalized.includes('HEMŞİRE') || normalized.includes('HEMSIRE')) userRole = 'NURSE'
    else if (normalized === 'VIEWER' || normalized.includes('İZLEYİCİ') || normalized.includes('IZLEYICI')) userRole = 'VIEWER'
    else userRole = (normalized as Role) || 'USER'

    const permissions = ROLE_PERMISSIONS[userRole]
    if (!permissions) return false

    return permissions.includes(permission)
}

export function can(user: any, permission: Permission): boolean {
    return hasPermission(user?.role, permission)
}
