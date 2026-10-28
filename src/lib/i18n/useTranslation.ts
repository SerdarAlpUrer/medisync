'use client'

import { useTheme } from '@/components/ThemeProvider'
import { translations, Language } from './translations'

export function useTranslation() {
    const { language, setLanguage } = useTheme()

    const t = (path: string, fallback?: string): string => {
        const lang = (language === 'en' ? 'en' : 'tr') as Language
        const keys = path.split('.')
        let current: any = translations[lang]

        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k]
            } else {
                // If not found in current language, try Turkish as fallback
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

    return {
        t,
        language,
        setLanguage,
        isEn: language === 'en',
        isTr: language === 'tr'
    }
}
