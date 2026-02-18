export type Role = 'ADMIN' | 'TECHNICIAN' | 'USER'

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

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    ADMIN: [
        'dashboard:view',
        'users:manage',
        'devices:view', 'devices:create', 'devices:edit', 'devices:delete',
        'maintenance:view', 'maintenance:create', 'maintenance:edit', 'maintenance:delete', 'maintenance:approve',
        'calibration:view', 'calibration:manage',
        'reports:view',
        'settings:manage'
    ],
    TECHNICIAN: [
        'dashboard:view',
        'devices:view', 'devices:edit',
        'maintenance:view', 'maintenance:create', 'maintenance:edit',
        'calibration:view', 'calibration:manage',
        'reports:view'
    ],
    USER: [
        'dashboard:view',
        'devices:view',
        'maintenance:view',
        'calibration:view'
    ]
}

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
    if (!role) return false

    // Normalize role string to uppercase to match Role type
    const userRole = role.toUpperCase() as Role

    // Check if role exists in definitions
    const permissions = ROLE_PERMISSIONS[userRole]
    if (!permissions) return false

    return permissions.includes(permission)
}

export function can(user: any, permission: Permission): boolean {
    return hasPermission(user?.role, permission)
}
