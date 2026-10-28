'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
    Plus,
    Wrench,
    Package,
    QrCode,
    FileText,
    FileCheck,
    ChevronDown,
    Zap,
    Upload
} from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'

export function QuickActions() {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const { language, t } = useTheme()
    const isEn = language === 'en'

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const actions = [
        {
            title: isEn ? 'Report Fault / Open Ticket' : 'Arıza Bildir / Bakım Aç',
            description: isEn ? 'Start urgent or scheduled fault ticket' : 'Acil veya planlı arıza/bakım kaydı başlat',
            href: '/report-fault',
            icon: Wrench,
            color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40',
        },
        {
            title: isEn ? 'Register New Device' : 'Yeni Cihaz Tanımla',
            description: isEn ? 'Register medical equipment to inventory' : 'Envantere yeni tıbbi ekipman kaydet',
            href: '/dashboard/devices?action=new',
            icon: Package,
            color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40',
        },
        {
            title: isEn ? 'Scan QR / Barcode' : 'Hızlı QR / Barkod Tara',
            description: isEn ? 'Instantly view device info and history' : 'Cihaz künyesini ve geçmişini anında aç',
            href: '/scan',
            icon: QrCode,
            color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
        },
        {
            title: isEn ? 'Schedule Calibration' : 'Kalibrasyon Planla',
            description: isEn ? 'Create periodic calibration record' : 'Yaklaşan periyodik kalibrasyon kaydı oluştur',
            href: '/dashboard/calibration?action=new',
            icon: FileCheck,
            color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40',
        },
        {
            title: isEn ? 'Upload Documents & Reports' : 'Döküman & Rapor Yükle',
            description: isEn ? 'Upload manuals, service reports, invoices' : 'Kullanım kılavuzu, servis formu veya fatura yükle',
            href: '/dashboard/files',
            icon: Upload,
            color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40',
        },
    ]

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-sm hover:shadow transition-all font-medium text-xs sm:text-sm"
            >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                <span className="hidden sm:inline">{isEn ? 'Quick Actions' : 'Hızlı Eylem'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl shadow-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700/60">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {isEn ? 'Frequently Used Actions' : 'Sık Kullanılan İşlemler'}
                        </p>
                    </div>

                    <div className="p-1.5 space-y-1">
                        {actions.map((item, idx) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={idx}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-start space-x-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                                >
                                    <div className={`p-2 rounded-lg ${item.color} flex-shrink-0 group-hover:scale-105 transition-transform`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                            {item.title}
                                        </p>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                                            {item.description}
                                        </p>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
