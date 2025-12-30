'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface AppearanceSettings {
    fontSize: 'small' | 'medium' | 'large'
    sidebarWidth: 'narrow' | 'normal' | 'wide'
    itemsPerPage: number
    compactView: boolean
    animations: boolean
}

const defaultSettings: AppearanceSettings = {
    fontSize: 'medium',
    sidebarWidth: 'normal',
    itemsPerPage: 20,
    compactView: false,
    animations: true
}

interface AppearanceContextType extends AppearanceSettings {
    updateSetting: <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => void
    fontSizeClass: string
    sidebarWidthClass: string
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined)

export function AppearanceProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<AppearanceSettings>(defaultSettings)

    // Load settings from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('appSettings_preferences')
            if (saved) {
                const parsed = JSON.parse(saved)
                if (parsed.advancedSettings) {
                    setSettings(prev => ({
                        ...prev,
                        fontSize: parsed.advancedSettings.fontSize || prev.fontSize,
                        sidebarWidth: parsed.advancedSettings.sidebarWidth || prev.sidebarWidth,
                        itemsPerPage: parsed.advancedSettings.itemsPerPage || prev.itemsPerPage,
                    }))
                }
                if (parsed.compactView !== undefined) {
                    setSettings(prev => ({ ...prev, compactView: parsed.compactView }))
                }
                if (parsed.animations !== undefined) {
                    setSettings(prev => ({ ...prev, animations: parsed.animations }))
                }
            }
        } catch (error) {
            console.error('Error loading appearance settings:', error)
        }
    }, [])

    // Apply font size to document
    useEffect(() => {
        const root = document.documentElement
        root.classList.remove('text-sm', 'text-base', 'text-lg')

        switch (settings.fontSize) {
            case 'small':
                root.classList.add('text-sm')
                break
            case 'large':
                root.classList.add('text-lg')
                break
            default:
                root.classList.add('text-base')
        }
    }, [settings.fontSize])

    // Listen for settings changes
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'appSettings_preferences' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue)
                    if (parsed.advancedSettings) {
                        setSettings(prev => ({
                            ...prev,
                            fontSize: parsed.advancedSettings.fontSize || prev.fontSize,
                            sidebarWidth: parsed.advancedSettings.sidebarWidth || prev.sidebarWidth,
                            itemsPerPage: parsed.advancedSettings.itemsPerPage || prev.itemsPerPage,
                        }))
                    }
                } catch (error) {
                    console.error('Error parsing settings:', error)
                }
            }
        }

        window.addEventListener('storage', handleStorageChange)

        // Custom event for same-window updates
        const handleSettingsUpdate = () => {
            try {
                const saved = localStorage.getItem('appSettings_preferences')
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (parsed.advancedSettings) {
                        setSettings(prev => ({
                            ...prev,
                            fontSize: parsed.advancedSettings.fontSize || prev.fontSize,
                            sidebarWidth: parsed.advancedSettings.sidebarWidth || prev.sidebarWidth,
                            itemsPerPage: parsed.advancedSettings.itemsPerPage || prev.itemsPerPage,
                        }))
                    }
                }
            } catch (error) {
                console.error('Error updating settings:', error)
            }
        }

        window.addEventListener('appearance-settings-updated', handleSettingsUpdate)

        return () => {
            window.removeEventListener('storage', handleStorageChange)
            window.removeEventListener('appearance-settings-updated', handleSettingsUpdate)
        }
    }, [])

    const updateSetting = <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    // Compute CSS classes
    const fontSizeClass = settings.fontSize === 'small' ? 'text-sm' : settings.fontSize === 'large' ? 'text-lg' : 'text-base'

    const sidebarWidthClass = settings.sidebarWidth === 'narrow' ? 'w-56' : settings.sidebarWidth === 'wide' ? 'w-72' : 'w-64'

    return (
        <AppearanceContext.Provider value={{
            ...settings,
            updateSetting,
            fontSizeClass,
            sidebarWidthClass
        }}>
            {children}
        </AppearanceContext.Provider>
    )
}

export function useAppearance() {
    const context = useContext(AppearanceContext)
    if (context === undefined) {
        throw new Error('useAppearance must be used within an AppearanceProvider')
    }
    return context
}
