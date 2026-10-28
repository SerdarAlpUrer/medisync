'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { translations, Language } from '@/lib/i18n/translations'

type Theme = 'light' | 'dark'
export type { Language }

interface ThemeContextType {
    theme: Theme
    setTheme: (theme: Theme) => void
    compactView: boolean
    setCompactView: (compact: boolean) => void
    language: Language
    setLanguage: (lang: Language) => void
    t: (path: string, fallback?: string) => string
    animations: boolean
    setAnimations: (enabled: boolean) => void
    sidebarCollapsed: boolean
    setSidebarCollapsed: (collapsed: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light')
    const [compactView, setCompactViewState] = useState(false)
    const [language, setLanguageState] = useState<Language>('tr')
    const [animations, setAnimationsState] = useState(true)
    const [sidebarCollapsed, setSidebarCollapsedState] = useState(false)

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('appSettings')
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings)
                if (settings.theme) setThemeState(settings.theme)
                if (settings.compactView !== undefined) setCompactViewState(settings.compactView)
                if (settings.language) setLanguageState(settings.language)
                if (settings.animations !== undefined) setAnimationsState(settings.animations)
                if (settings.sidebarCollapsed !== undefined) setSidebarCollapsedState(settings.sidebarCollapsed)
            } catch (e) {
                console.error('Error loading settings:', e)
            }
        }
    }, [])

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement
        if (theme === 'dark') {
            root.classList.add('dark')
            root.classList.remove('light')
        } else {
            root.classList.add('light')
            root.classList.remove('dark')
        }
        const savedSettings = localStorage.getItem('appSettings')
        const settings = savedSettings ? JSON.parse(savedSettings) : {}
        localStorage.setItem('appSettings', JSON.stringify({ ...settings, theme }))
    }, [theme])

    // Apply compact view
    useEffect(() => {
        const root = document.documentElement
        if (compactView) {
            root.classList.add('compact-view')
        } else {
            root.classList.remove('compact-view')
        }
        const savedSettings = localStorage.getItem('appSettings')
        const settings = savedSettings ? JSON.parse(savedSettings) : {}
        localStorage.setItem('appSettings', JSON.stringify({ ...settings, compactView }))
    }, [compactView])

    // Apply animations
    useEffect(() => {
        const root = document.documentElement
        if (animations) {
            root.classList.add('animations-enabled')
        } else {
            root.classList.remove('animations-enabled')
        }
        const savedSettings = localStorage.getItem('appSettings')
        const settings = savedSettings ? JSON.parse(savedSettings) : {}
        localStorage.setItem('appSettings', JSON.stringify({ ...settings, animations }))
    }, [animations])

    // Apply sidebar collapsed
    useEffect(() => {
        const savedSettings = localStorage.getItem('appSettings')
        const settings = savedSettings ? JSON.parse(savedSettings) : {}
        localStorage.setItem('appSettings', JSON.stringify({ ...settings, sidebarCollapsed }))
    }, [sidebarCollapsed])

    // Apply language and notify DOM/event listeners
    useEffect(() => {
        document.documentElement.lang = language
        const savedSettings = localStorage.getItem('appSettings')
        const settings = savedSettings ? JSON.parse(savedSettings) : {}
        localStorage.setItem('appSettings', JSON.stringify({ ...settings, language }))
        window.dispatchEvent(new CustomEvent('language-change', { detail: language }))
    }, [language])

    const setTheme = (newTheme: Theme) => setThemeState(newTheme)
    const setCompactView = (compact: boolean) => setCompactViewState(compact)
    const setLanguage = (lang: Language) => setLanguageState(lang)
    const setAnimations = (enabled: boolean) => setAnimationsState(enabled)
    const setSidebarCollapsed = (collapsed: boolean) => setSidebarCollapsedState(collapsed)

    // Translation resolver helper
    const t = (path: string, fallback?: string): string => {
        const lang = (language === 'en' ? 'en' : 'tr') as Language
        const keys = path.split('.')
        let current: any = translations[lang]

        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k]
            } else {
                let trCurrent: any = translations.tr
                for (const trK of keys) {
                    if (trCurrent && typeof trCurrent === 'object' && trK in trCurrent) {
                        trCurrent = trCurrent[trK]
                    } else {
                        return fallback || path
                    }
                }
                return typeof trCurrent === 'string' ? trCurrent : (fallback || path)
            }
        }

        return typeof current === 'string' ? current : (fallback || path)
    }

    return (
        <ThemeContext.Provider value={{
            theme, setTheme,
            compactView, setCompactView,
            language, setLanguage,
            t,
            animations, setAnimations,
            sidebarCollapsed, setSidebarCollapsed
        }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
