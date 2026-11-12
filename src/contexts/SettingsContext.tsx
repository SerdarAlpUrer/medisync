'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface AppSettings {
    id: string
    maintenanceEnabled: boolean
    calibrationEnabled: boolean
    contractsEnabled?: boolean
    utsEnabled: boolean
    complianceEnabled: boolean
    reportsEnabled: boolean
    branchesEnabled: boolean
    trainingEnabled?: boolean
    procurementEnabled?: boolean
    decommissioningEnabled?: boolean
    deviceTagFormat?: string
    labelHeaderText?: string
    defaultLabelFormat?: 'tze-24mm' | 'tze-32mm' | 'thermal-50x30' | 'thermal-80x50' | 'standard'
    showSerialOnLabel?: boolean
    showLocationOnLabel?: boolean
    calibrationAlertDays?: number
    maintenanceAlertDays?: number
    warrantyAlertDays?: number
    defaultMaintenanceInterval?: number
    defaultCalibrationInterval?: number
    criticalSlaHours?: number
    itemsPerPage?: number
    fontSize?: 'small' | 'medium' | 'large'
    sidebarWidth?: 'narrow' | 'normal' | 'wide'
    emergencyPhone?: string
    reportHeaderTitle?: string
    [key: string]: any
}

interface SettingsContextType {
    settings: AppSettings | null
    loading: boolean
    refreshSettings: () => Promise<void>
    updateSetting: (key: string, value: any) => Promise<boolean>
    updateSettings: (partial: Record<string, any>) => Promise<boolean>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<AppSettings | null>(null)
    const [loading, setLoading] = useState(true)

    const refreshSettings = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/settings', { cache: 'no-store' })
            if (!res.ok) throw new Error('Failed to fetch settings')
            const data = await res.json()

            const actualSettings = data.success === undefined ? data : data.data
            setSettings(actualSettings)
        } catch (error) {
            console.error('Error fetching settings:', error)
            if (!settings) setSettings({} as AppSettings)
        } finally {
            setLoading(false)
        }
    }

    const updateSettings = async (partial: Record<string, any>) => {
        const prevSettings = settings
        setSettings(prev => prev ? { ...prev, ...partial } : (partial as AppSettings))

        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(partial)
            })
            if (!res.ok) throw new Error('Failed to save settings')
            const data = await res.json()
            if (data?.data) {
                setSettings(data.data)
            }
            return true
        } catch (error) {
            console.error('Failed to update settings:', error)
            setSettings(prevSettings)
            return false
        }
    }

    const updateSetting = async (key: string, value: any) => {
        return updateSettings({ [key]: value })
    }

    useEffect(() => {
        refreshSettings()
    }, [])

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings, updateSetting, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider')
    }
    return context
}
