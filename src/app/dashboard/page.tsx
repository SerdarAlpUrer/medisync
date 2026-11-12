'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Activity,
    Package,
    Wrench,
    AlertTriangle,
    TrendingUp,
    Calendar,
    DollarSign,
    Shield,
    Settings,
    Eye,
    EyeOff,
    QrCode,
    FileCheck,
    Upload
} from 'lucide-react'

interface DashboardData {
    stats: {
        totalDevices: number
        activeDevices: number
        inMaintenance: number
        needsCalibration: number
        monthlyMaintenanceCost: number
        warrantyExpiringCount?: number
    }
    recentMaintenances: Array<{
        id: string
        device: string
        type: string
        status: string
        cost: number
        date: string
    }>
    upcomingCalibrations: Array<{
        device: string
        dueDate: string
        priority: string
    }>

    upcomingWarrantyExpiries?: Array<{
        id: string
        device: string
        serialNumber: string
        expiryDate: string
        daysRemaining: number
        priority: string
    }>
    charts?: {
        statusDistribution: Array<{ name: string; value: number }>
        costDistribution: Array<{ name: string; value: number }>
        categoryDistribution: Array<{ name: string; value: number }>
    }
}

import { useHospital } from '@/contexts/HospitalContext'
import { SkeletonStats, SkeletonCard } from '@/components/LoadingStates'
import { DashboardCharts } from '@/components/DashboardCharts'

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [settings, setSettings] = useState<any>(null)
    const { activeHospital } = useHospital()
    const [showWidgetSettings, setShowWidgetSettings] = useState(false)
    const [widgetPrefs, setWidgetPrefs] = useState({
        showStats: true,
        showMaintenance: true,
        showCalibration: true,
        showWarranty: true,
        showCost: true,
        showQuickActions: true
    })

    // Load widget preferences from localStorage
    useEffect(() => {
        const savedPrefs = localStorage.getItem('dashboardWidgetPrefs')
        if (savedPrefs) {
            try {
                setWidgetPrefs(JSON.parse(savedPrefs))
            } catch (e) { }
        }
    }, [])

    // Save widget preferences
    const saveWidgetPrefs = (prefs: typeof widgetPrefs) => {
        setWidgetPrefs(prefs)
        localStorage.setItem('dashboardWidgetPrefs', JSON.stringify(prefs))
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const hospitalQuery = activeHospital ? `?hospitalId=${activeHospital.id}` : ''
                
                // Fetch settings and dashboard in parallel for faster load
                const [settingsResponse, response] = await Promise.all([
                    fetch('/api/settings'),
                    fetch(`/api/dashboard${hospitalQuery}`)
                ])

                if (settingsResponse.ok) {
                    const settingsData = await settingsResponse.json()
                    setSettings(settingsData)
                }

                if (response.ok) {
                    const result = await response.json()
                    // Handle both old format (direct object) and new format (wrapped in success/data)
                    const dashboardData = result.success ? result.data : result
                    setData(dashboardData)
                } else {
                    console.error('Dashboard Fetch Error:', response.status, response.statusText)
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [activeHospital])

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <SkeletonStats />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-red-600">
                <AlertTriangle className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-bold">Veri Yüklenemedi</h3>
                <p className="text-gray-600 mb-4">Sunucu ile iletişim kurulamadı.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Tekrar Dene
                </button>
            </div>
        )
    }

    const stats = data?.stats || {
        totalDevices: 0,
        activeDevices: 0,
        inMaintenance: 0,
        needsCalibration: 0,
        monthlyMaintenanceCost: 0,
    }

    // Ensure monthlyMaintenanceCost is a valid number
    const monthlyMaintenanceCost = Number(stats.monthlyMaintenanceCost) || 0

    const recentMaintenances = data?.recentMaintenances || []
    const upcomingCalibrations = data?.upcomingCalibrations || []

    return (
        <div className="space-y-6">
            {/* Widget Settings Modal */}
            {showWidgetSettings && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                            <Settings className="h-5 w-5 mr-2" />
                            Widget Ayarları
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Görmek istediğiniz widget'ları seçin</p>
                        <div className="space-y-3">
                            {[
                                { key: 'showStats', label: 'İstatistik Kartları' },
                                { key: 'showMaintenance', label: 'Son Bakımlar' },
                                { key: 'showCalibration', label: 'Yaklaşan Kalibrasyonlar' },
                                { key: 'showWarranty', label: 'Garanti Uyarıları' },
                                { key: 'showCost', label: 'Aylık Maliyet' },
                                { key: 'showQuickActions', label: 'Hızlı İşlemler' }
                            ].map(item => (
                                <label key={item.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                                    <button
                                        onClick={() => saveWidgetPrefs({ ...widgetPrefs, [item.key]: !widgetPrefs[item.key as keyof typeof widgetPrefs] })}
                                        className={`p-2 rounded-lg transition-colors ${widgetPrefs[item.key as keyof typeof widgetPrefs] ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-gray-200 dark:bg-gray-600 text-gray-400'}`}
                                    >
                                        {widgetPrefs[item.key as keyof typeof widgetPrefs] ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                    </button>
                                </label>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowWidgetSettings(false)}
                            className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            Tamam
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm lg:text-base">Tıbbi cihaz yönetim sistemine hoş geldiniz</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowWidgetSettings(true)}
                        className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-colors"
                        title="Widget Ayarları"
                    >
                        <Settings className="h-5 w-5" />
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Son güncelleme: {new Date().toLocaleString('tr-TR')}
                    </span>
                </div>
            </div>

            {/* Quick Action Tiles for 1-Click Operations */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <Link
                    href="/report-fault"
                    className="flex flex-col sm:flex-row items-center sm:items-start p-3 sm:p-4 rounded-xl bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-950/40 dark:to-red-900/30 border border-rose-200 dark:border-rose-800/40 hover:shadow-md hover:scale-[1.02] transition-all group"
                >
                    <div className="p-2.5 rounded-lg bg-rose-500 text-white mb-2 sm:mb-0 sm:mr-3 shadow-sm group-hover:rotate-6 transition-transform flex-shrink-0">
                        <Wrench className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Arıza Bildir</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">Anında iş emri aç</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/devices?action=new"
                    className="flex flex-col sm:flex-row items-center sm:items-start p-3 sm:p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/40 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800/40 hover:shadow-md hover:scale-[1.02] transition-all group"
                >
                    <div className="p-2.5 rounded-lg bg-blue-600 text-white mb-2 sm:mb-0 sm:mr-3 shadow-sm group-hover:rotate-6 transition-transform flex-shrink-0">
                        <Package className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Cihaz Ekle</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">Envantere kaydet</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/calibration?action=new"
                    className="flex flex-col sm:flex-row items-center sm:items-start p-3 sm:p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950/40 dark:to-yellow-900/30 border border-amber-200 dark:border-amber-800/40 hover:shadow-md hover:scale-[1.02] transition-all group"
                >
                    <div className="p-2.5 rounded-lg bg-amber-500 text-white mb-2 sm:mb-0 sm:mr-3 shadow-sm group-hover:rotate-6 transition-transform flex-shrink-0">
                        <FileCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Kalibrasyon</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">Metroloji kaydı gir</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/reports"
                    className="flex flex-col sm:flex-row items-center sm:items-start p-3 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/40 dark:to-teal-900/30 border border-emerald-200 dark:border-emerald-800/40 hover:shadow-md hover:scale-[1.02] transition-all group"
                >
                    <div className="p-2.5 rounded-lg bg-emerald-600 text-white mb-2 sm:mb-0 sm:mr-3 shadow-sm group-hover:rotate-6 transition-transform flex-shrink-0">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Denetim Raporu</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">SKS & maliyet dökümü</div>
                    </div>
                </Link>
            </div>

            {/* Charts Area */}
            {data?.charts && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <DashboardCharts data={data.charts} />
                </div>
            )}

            {/* Stats Grid */}
            {widgetPrefs.showStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Toplam Cihaz"
                        value={stats.totalDevices}
                        icon={<Package className="h-6 w-6" />}
                        color="blue"
                    />
                    <StatCard
                        title="Aktif Cihazlar"
                        value={stats.activeDevices}
                        icon={<Activity className="h-6 w-6" />}
                        color="green"
                    />
                    {settings?.maintenanceEnabled && (
                        <StatCard
                            title="Bakımda"
                            value={stats.inMaintenance}
                            icon={<Wrench className="h-6 w-6" />}
                            color="orange"
                        />
                    )}
                    {settings?.calibrationEnabled && (
                        <StatCard
                            title="Kalibrasyon Gereken"
                            value={stats.needsCalibration}
                            icon={<AlertTriangle className="h-6 w-6" />}
                            color="red"
                        />
                    )}
                </div>
            )}

            {/* Charts and Data */}
            {((settings?.maintenanceEnabled && widgetPrefs.showMaintenance) || (settings?.calibrationEnabled && widgetPrefs.showCalibration)) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Maintenances */}
                    {settings?.maintenanceEnabled && widgetPrefs.showMaintenance && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Son Bakım İşlemleri</h2>
                                <Wrench className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="space-y-4">
                                {recentMaintenances.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">Kayıt bulunamadı.</p>
                                ) : (
                                    recentMaintenances.map((maintenance) => (
                                        <div key={maintenance.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900 dark:text-white">{maintenance.device}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{getMaintenanceTypeLabel(maintenance.type)}</p>
                                            </div>
                                            <div className="text-right">
                                                <StatusBadge status={maintenance.status} />
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{maintenance.date}</p>
                                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">
                                                    {maintenance.cost ? `₺${maintenance.cost.toLocaleString('tr-TR')}` : '₺0'}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Upcoming Calibrations */}
                    {settings?.calibrationEnabled && widgetPrefs.showCalibration && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Yaklaşan Kalibrasyonlar</h2>
                                <Calendar className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="space-y-4">
                                {upcomingCalibrations.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">Yaklaşan kalibrasyon yok.</p>
                                ) : (
                                    upcomingCalibrations.map((calibration, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900 dark:text-white">{calibration.device}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Hedef: {calibration.dueDate}</p>
                                            </div>
                                            <PriorityBadge priority={calibration.priority} />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Warranty Expiry Widget */}
            {widgetPrefs.showWarranty && (data?.upcomingWarrantyExpiries && data.upcomingWarrantyExpiries.length > 0) && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <Shield className="h-6 w-6 text-orange-500" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Garanti Süresi Dolacak Cihazlar</h2>
                        </div>
                        <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium">
                            {data.upcomingWarrantyExpiries.length} cihaz
                        </span>
                    </div>
                    <div className="space-y-3">
                        {data.upcomingWarrantyExpiries.map((warranty, index) => (
                            <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${warranty.priority === 'high'
                                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                : warranty.priority === 'medium'
                                    ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                                    : 'bg-gray-50 dark:bg-gray-700/50'
                                }`}>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 dark:text-white truncate">{warranty.device}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        S/N: {warranty.serialNumber} • Bitiş: {warranty.expiryDate}
                                    </p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ml-2 ${warranty.priority === 'high'
                                    ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                                    : warranty.priority === 'medium'
                                        ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
                                        : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                                    }`}>
                                    {warranty.daysRemaining} gün kaldı
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Monthly Cost */}
            {settings?.maintenanceEnabled && widgetPrefs.showCost && (
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 mb-1">Aylık Bakım Maliyeti</p>
                            <p className="text-4xl font-bold">₺{monthlyMaintenanceCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <p className="text-blue-100 text-sm mt-2 flex items-center">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                Bu ayki toplam maliyet
                            </p>
                        </div>
                        <DollarSign className="h-16 w-16 text-blue-200 opacity-50" />
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            {widgetPrefs.showQuickActions && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hızlı İşlemler & Kısayollar</h2>
                        <span className="text-xs text-gray-400">Tek tıkla sık kullanılan işlemler</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <QuickActionButton
                            title="Yeni Cihaz Tanımla"
                            description="Envantere yeni tıbbi ekipman ekle"
                            icon={<Package className="h-5 w-5" />}
                            href="/dashboard/devices?action=new"
                        />
                        <QuickActionButton
                            title="Arıza Bildir / Bakım Talebi"
                            description="Hızlı arıza veya bakım kaydı oluştur"
                            icon={<Wrench className="h-5 w-5" />}
                            href="/report-fault"
                        />
                        <QuickActionButton
                            title="Hızlı QR / Barkod Oku"
                            description="Cihaz künyesini kamerayla tara"
                            icon={<QrCode className="h-5 w-5" />}
                            href="/scan"
                        />
                        {settings?.calibrationEnabled && (
                            <QuickActionButton
                                title="Kalibrasyon Planla"
                                description="Periyodik kalibrasyon randevusu ata"
                                icon={<FileCheck className="h-5 w-5" />}
                                href="/dashboard/calibration?action=new"
                            />
                        )}
                        <QuickActionButton
                            title="Döküman & Dosya Yükle"
                            description="Kılavuz, servis formu ve faturalar"
                            icon={<Upload className="h-5 w-5" />}
                            href="/dashboard/files"
                        />
                        {settings?.reportsEnabled && (
                            <QuickActionButton
                                title="Analitik & Maliyet Raporu"
                                description="Bakım ve envanter maliyetlerini incele"
                                icon={<TrendingUp className="h-5 w-5" />}
                                href="/dashboard/reports"
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function StatCard({
    title,
    value,
    icon,
    color
}: {
    title: string
    value: number
    icon: React.ReactNode
    color: string
}) {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        orange: 'from-orange-500 to-orange-600',
        red: 'from-red-500 to-red-600',
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
                <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} w-12 h-12 rounded-lg flex items-center justify-center text-white`}>
                    {icon}
                </div>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { label: string; className: string }> = {
        // Küçük harfli
        completed: { label: 'Tamamlandı', className: 'badge-success' },
        'in-progress': { label: 'Devam Ediyor', className: 'badge-warning' },
        scheduled: { label: 'Planlandı', className: 'badge-info' },
        // Büyük harfli (API'den gelen)
        COMPLETED: { label: 'Tamamlandı', className: 'badge-success' },
        IN_PROGRESS: { label: 'Devam Ediyor', className: 'badge-warning' },
        SCHEDULED: { label: 'Planlandı', className: 'badge-info' },
        OPEN: { label: 'Açık', className: 'badge-warning' },
        PENDING: { label: 'Beklemede', className: 'badge-info' },
        CANCELLED: { label: 'İptal', className: 'badge-gray' },
    }

    const config = statusConfig[status] || { label: status, className: 'badge-gray' }

    return (
        <span className={`badge ${config.className}`}>
            {config.label}
        </span>
    )
}

// Bakım tipi çevirisi
function getMaintenanceTypeLabel(type: string): string {
    const types: Record<string, string> = {
        PREVENTIVE: 'Önleyici Bakım',
        CORRECTIVE: 'Arıza Onarımı',
        PREDICTIVE: 'Öngörücü Bakım',
        INSPECTION: 'Muayene',
        EMERGENCY: 'Acil Müdahale',
        CALIBRATION: 'Kalibrasyon',
        'Arıza Bildirimi': 'Arıza Bildirimi',
    }
    return types[type] || type
}

function PriorityBadge({ priority }: { priority: string }) {
    const priorityConfig = {
        high: { label: 'Yüksek', className: 'badge-danger' },
        medium: { label: 'Orta', className: 'badge-warning' },
        low: { label: 'Düşük', className: 'badge-info' },
    }

    const config = priorityConfig[priority as keyof typeof priorityConfig]

    return (
        <span className={`badge ${config.className}`}>
            {config.label}
        </span>
    )
}

function QuickActionButton({
    title,
    description,
    icon,
    href,
}: {
    title: string
    description: string
    icon: React.ReactNode
    href: string
}) {
    return (
        <Link
            href={href}
            className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-blue-50/50 dark:hover:bg-gray-700 hover:border-blue-200 dark:hover:border-blue-900 border border-transparent transition-all duration-150 group shadow-sm hover:shadow"
        >
            <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{description}</p>
            </div>
        </Link>
    )
}
