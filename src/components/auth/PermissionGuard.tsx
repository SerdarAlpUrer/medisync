'use client'

import { useSession } from 'next-auth/react'
import { Permission, hasPermission } from '@/lib/rbac'
import { ReactNode } from 'react'

interface PermissionGuardProps {
    permission: Permission
    children: ReactNode
    fallback?: ReactNode
}

export default function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
    const { data: session } = useSession()

    if (!session?.user) {
        return <>{fallback}</>
    }

    if (hasPermission(session.user.role, permission)) {
        return <>{children}</>
    }

    return <>{fallback}</>
}
