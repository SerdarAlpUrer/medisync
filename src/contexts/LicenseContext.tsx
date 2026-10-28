"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

interface LicenseState {
    isDemo: boolean
    isActive: boolean
    isExpired: boolean
    remainingHours: number
    remainingMinutes: number
    totalHours: number
    isLoading: boolean
    deviceFingerprint?: string
    checkLicense: () => Promise<void>
}

const LicenseContext = createContext<LicenseState | undefined>(undefined)

export function LicenseProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<Omit<LicenseState, 'checkLicense'>>({
        isDemo: false,
        isActive: true,
        isExpired: false,
        remainingHours: 99999,
        remainingMinutes: 0,
        totalHours: 99999,
        isLoading: true,
        deviceFingerprint: ''
    })

    const checkLicense = async () => {
        try {
            const res = await fetch('/api/license/check')
            if (res.ok) {
                const data = await res.json()
                setState({
                    isDemo: data.type === 'DEMO',
                    isActive: data.isActive,
                    isExpired: !data.isActive || data.type === 'EXPIRED',
                    remainingHours: data.remainingHours ?? 9999,
                    remainingMinutes: data.remainingMinutes ?? 0,
                    totalHours: data.totalHours ?? 9999,
                    isLoading: false,
                    deviceFingerprint: data.deviceFingerprint || ''
                })
                return
            }
        } catch (error) {
            console.error('License check error:', error)
        }
        setState(prev => ({ ...prev, isLoading: false }))
    }

    useEffect(() => {
        checkLicense()
    }, [])

    return (
        <LicenseContext.Provider value={{ ...state, checkLicense }}>
            {children}
        </LicenseContext.Provider>
    )
}

export function useLicense() {
    const context = useContext(LicenseContext)
    if (context === undefined) {
        throw new Error('useLicense must be used within a LicenseProvider')
    }
    return context
}
