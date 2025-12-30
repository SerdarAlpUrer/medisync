"use client"

import { useLicense } from "@/contexts/LicenseContext"
import { Clock, AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"

export function DemoTimer() {
    const { isDemo, remainingHours: initialHours, remainingMinutes: initialMinutes, isActive, isExpired, isLoading, checkLicense } = useLicense()

    // Lokal sayaç state'i
    const [displayHours, setDisplayHours] = useState(initialHours)
    const [displayMinutes, setDisplayMinutes] = useState(initialMinutes)

    // Context değiştiğinde güncelle
    useEffect(() => {
        setDisplayHours(initialHours)
        setDisplayMinutes(initialMinutes)
    }, [initialHours, initialMinutes])

    // Her dakika geri sayım yap
    useEffect(() => {
        if (isLoading || (!isDemo && isActive) || isExpired) return

        const interval = setInterval(() => {
            setDisplayMinutes(prev => {
                if (prev <= 0) {
                    setDisplayHours(h => {
                        if (h <= 0) {
                            // Süre bitti, lisansı yeniden kontrol et
                            checkLicense()
                            return 0
                        }
                        return h - 1
                    })
                    return 59
                }
                return prev - 1
            })
        }, 60000) // Her 60 saniyede bir güncelle

        return () => clearInterval(interval)
    }, [isLoading, isDemo, isActive, isExpired, checkLicense])

    if (isLoading) return null
    if (!isDemo && isActive) return null // Tam sürüm ve aktif

    // Toplam kalan saat hesaplama (renk için)
    const totalRemainingHours = displayHours + (displayMinutes > 0 ? 1 : 0)

    // Renk belirleme
    let colorClass = "bg-blue-100 text-blue-800 border-blue-200"
    if (totalRemainingHours < 24) {
        colorClass = "bg-red-100 text-red-800 border-red-200 animate-pulse"
    } else if (totalRemainingHours < 72) {
        colorClass = "bg-orange-100 text-orange-800 border-orange-200"
    }

    if (isExpired) {
        return (
            <div className="fixed top-0 left-0 w-full bg-red-600 text-white p-2 text-center z-50 font-bold flex items-center justify-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span>DENEME SÜRESİ DOLDU - Lütfen lisans satın alın</span>
            </div>
        )
    }

    // Saat ve dakikayı formatla (2 haneli)
    const formattedHours = String(displayHours).padStart(2, '0')
    const formattedMinutes = String(displayMinutes).padStart(2, '0')

    return (
        <div className={`fixed top-0 left-1/2 -translate-x-1/2 z-[60] px-6 py-2 rounded-b-xl border-x border-b shadow-lg flex items-center gap-2 font-semibold text-sm ${colorClass}`}>
            <Clock className="h-4 w-4" />
            <span>
                Demo Modu: <strong className="font-mono">{formattedHours}:{formattedMinutes}</strong> kaldı
            </span>
        </div>
    )
}
