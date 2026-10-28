'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import LoginPage from './login/page'

export default function Home() {
    const { status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === 'authenticated') {
            router.replace('/dashboard')
        }
    }, [status, router])

    if (status === 'authenticated') {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 text-sm">
                Yönlendiriliyor...
            </div>
        )
    }

    return <LoginPage />
}
