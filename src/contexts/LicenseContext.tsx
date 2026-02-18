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
        isDemo: true,
        isActive: true,
        isExpired: false, // Varsayılan olarak expired değil, yüklenene kadar
        remainingHours: 240,
        remainingMinutes: 0,
        totalHours: 240,
        isLoading: true,
        deviceFingerprint: ''
    })

    const checkLicense = async () => {
        try {
            const res = await fetch('/api/license/check')
            const data = await res.json()

            setState({
                isDemo: data.type === 'DEMO',
                isActive: data.isActive,
                isExpired: data.type === 'EXPIRED',
                remainingHours: data.remainingHours || 0,
                remainingMinutes: data.remainingMinutes || 0,
                totalHours: data.totalHours || 240,
                isLoading: false,
                deviceFingerprint: data.deviceFingerprint
            })
        } catch (error) {
            console.error("Lisans kontrol hatası:", error)
            setState(s => ({ ...s, isLoading: false }))
        }
    }

    useEffect(() => {
        checkLicense()
        // Her 5 dakikada bir kontrol et
        const interval = setInterval(checkLicense, 5 * 60 * 1000)
        return () => clearInterval(interval)
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
