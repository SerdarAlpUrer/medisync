'use client'

import { useState, useEffect } from 'react'
import {
    Settings, Database, Bell, Shield, Palette, Globe,
    AlertTriangle, Download, Trash2, Moon, Sun,
    Languages, Clock, Save, CheckCircle2, Loader2, ShieldAlert,
    LayoutGrid, X, Zap, Code, Activity, Server, Key, Webhook,
    FileText, HardDrive, RefreshCw, Info, Eye, EyeOff, Copy,
    Calendar, Type, Gauge, Mail, MessageSquare, Smartphone,
    Volume2, VolumeX, TrendingUp, Cpu, HardDriveIcon, Upload,
    Wrench
} from 'lucide-react'
import { useToast } from '@/components/ToastProvider'
import { useTheme } from '@/components/ThemeProvider'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useSettings } from '@/contexts/SettingsContext'
import { useLicense } from '@/contexts/LicenseContext'

export default function SettingsPage() {
    const { showSuccess, showError } = useToast()
    const { refreshSettings } = useSettings()
    const { theme, setTheme, compactView, setCompactView, language, setLanguage, animations, setAnimations } = useTheme()
    const { data: session } = useSession()
    const router = useRouter()

    const [isLoading, setIsLoading] = useState(false)
    const [backupSchedule, setBackupSchedule] = useState<'manual' | 'daily' | 'weekly' | 'monthly'>('manual')
    const [lastBackupDate, setLastBackupDate] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('general')

    // Password Update State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordLoading, setPasswordLoading] = useState(false)

    // Advanced Settings State
    const [advancedSettings, setAdvancedSettings] = useState({
        timezone: 'Europe/Istanbul',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        numberFormat: 'tr-TR',
        autoSave: true,
        autoSaveInterval: 30, // seconds
        fontSize: 'medium',
        sidebarWidth: 'normal',
        itemsPerPage: 20,
        enableCache: true,
        cacheTTL: 300, // seconds
        enableLazyLoading: true,
        enableQueryOptimization: true,
        logLevel: 'info',
        debugMode: false,
        enableMetrics: true,
        sessionTimeout: 30, // minutes
        maxLoginAttempts: 5,
        enableIPWhitelist: false,
        enableAuditLog: true,
        enableEmailNotifications: true,
        enableSMSNotifications: false,
        enablePushNotifications: true,
        enableInAppNotifications: true,
        notificationSound: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        backupAuto: false,
        backupRetention: 30, // days
        enableRedis: false,
        enablePWA: true,
    })

    // Local Settings State
    const [localSettings, setLocalSettings] = useState({
        emailNotifications: true,
        maintenanceReminders: true,
        calibrationAlerts: true,
        warrantyAlerts: false,
        twoFactor: false,
        sessionTimeout: true,
        demoMode: false
    })

    // Module Settings State
    const [moduleSettings, setModuleSettings] = useState({
        maintenanceEnabled: false,
        calibrationEnabled: false,
        utsEnabled: false,
        complianceEnabled: false,
        reportsEnabled: false,
        branchesEnabled: false,
        trainingEnabled: false,
        procurementEnabled: false,
        decommissioningEnabled: false,
        contractsEnabled: false,
    })
    const [moduleSettingsLoading, setModuleSettingsLoading] = useState(true)
    const [moduleSettingsSaving, setModuleSettingsSaving] = useState(false)

    // System Info State
    const [systemInfo, setSystemInfo] = useState<any>(null)
    const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({})

    // Environment Config State
    const [envConfig, setEnvConfig] = useState({
        host: 'localhost',
        port: 5432,
        database: 'medisync',
        username: 'postgres',
        password: '',
        nextAuthUrl: 'http://localhost:3000',
        nextAuthSecret: ''
    })
    const [envLoading, setEnvLoading] = useState(true)
    const [dbTestLoading, setDbTestLoading] = useState(false)
    const [dbTestResult, setDbTestResult] = useState<{ success: boolean; message?: string; error?: string; data?: any } | null>(null)
    const [envSaving, setEnvSaving] = useState(false)
    const [showDbPassword, setShowDbPassword] = useState(false)

    // Load settings
    useEffect(() => {
        const saved = localStorage.getItem('appSettings_preferences')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setLocalSettings(parsed)
                if (parsed.advancedSettings) {
                    setAdvancedSettings({ ...advancedSettings, ...parsed.advancedSettings })
                }
            } catch (e) {
                console.error("Error parsing local settings", e)
            }
        }

        // Load system info
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setModuleSettings(prev => ({ ...prev, ...data.data }))
                } else {
                    setModuleSettings((prev: any) => ({ ...prev, ...data }))
                }
                setModuleSettingsLoading(false)
            })
            .catch(err => {
                console.error(err)
                setModuleSettingsLoading(false)
            })

        // Load system information
        loadSystemInfo()

        // Load environment config
        loadEnvConfig()
    }, [])

    const loadSystemInfo = async () => {
        try {
            const info = {
                nodeVersion: typeof window !== 'undefined' ? 'N/A' : process.version,
                platform: typeof window !== 'undefined' ? navigator.platform : process.platform,
                userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server',
                screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'N/A',
                language: typeof window !== 'undefined' ? navigator.language : 'tr-TR',
                online: typeof window !== 'undefined' ? navigator.onLine : true,
                cookieEnabled: typeof window !== 'undefined' ? navigator.cookieEnabled : true,
            }
            setSystemInfo(info)
        } catch (error) {
            console.error('Error loading system info:', error)
        }
    }

    const loadEnvConfig = async () => {
        try {
            const res = await fetch('/api/config/env')
            const data = await res.json()
            if (data.success && data.data) {
                // Parse DATABASE_URL if available
                const dbUrl = data.data.DATABASE_URL || ''
                const match = dbUrl.match(/postgresql:\/\/([^:]+):[^@]+@([^:]+):(\d+)\/(.+)/)
                if (match) {
                    setEnvConfig(prev => ({
                        ...prev,
                        username: match[1],
                        host: match[2],
                        port: parseInt(match[3]),
                        database: match[4],
                        nextAuthUrl: data.data.NEXTAUTH_URL || 'http://localhost:3000',
                        nextAuthSecret: data.data.NEXTAUTH_SECRET || ''
                    }))
                }
            }
        } catch (error) {
            console.error('Error loading env config:', error)
        } finally {
            setEnvLoading(false)
        }
    }

    const testDbConnection = async () => {
        setDbTestLoading(true)
        setDbTestResult(null)
        try {
            const res = await fetch('/api/config/test-db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    host: envConfig.host,
                    port: envConfig.port,
                    database: envConfig.database,
                    username: envConfig.username,
                    password: envConfig.password
                })
            })
            const data = await res.json()
            setDbTestResult(data)
            if (data.success) {
                showSuccess('Veritabanı bağlantısı başarılı!')
            } else {
                showError(data.error || 'Bağlantı başarısız')
            }
        } catch (error) {
            setDbTestResult({ success: false, error: 'Bağlantı testi yapılamadı' })
            showError('Bağlantı testi yapılamadı')
        } finally {
            setDbTestLoading(false)
        }
    }

    const saveEnvConfig = async () => {
        setEnvSaving(true)
        try {
            const databaseUrl = `postgresql://${envConfig.username}:${encodeURIComponent(envConfig.password)}@${envConfig.host}:${envConfig.port}/${envConfig.database}`
            const res = await fetch('/api/config/env', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    DATABASE_URL: databaseUrl,
                    NEXTAUTH_SECRET: envConfig.nextAuthSecret,
                    NEXTAUTH_URL: envConfig.nextAuthUrl
                })
            })
            const data = await res.json()
            if (data.success) {
                showSuccess('Yapılandırma kaydedildi. Değişikliklerin etkili olması için uygulamayı yeniden başlatın.')
            } else {
                showError(data.error || 'Kaydetme başarısız')
            }
        } catch (error) {
            showError('Yapılandırma kaydedilemedi')
        } finally {
            setEnvSaving(false)
        }
    }

    const generateNewSecret = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let secret = ''
        for (let i = 0; i < 64; i++) {
            secret += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setEnvConfig(prev => ({ ...prev, nextAuthSecret: secret }))
        showSuccess('Yeni güvenlik anahtarı oluşturuldu')
    }

    const updateLocalSetting = (key: string, value: any) => {
        const newSettings = { ...localSettings, [key]: value }
        setLocalSettings(newSettings)
        localStorage.setItem('appSettings_preferences', JSON.stringify(newSettings))
        showSuccess('Ayar güncellendi')
    }

    const updateAdvancedSetting = (key: string, value: any) => {
        const newSettings = { ...advancedSettings, [key]: value }
        setAdvancedSettings(newSettings)
        const saved = localStorage.getItem('appSettings_preferences')
        const parsed = saved ? JSON.parse(saved) : {}
        parsed.advancedSettings = newSettings
        localStorage.setItem('appSettings_preferences', JSON.stringify(parsed))
        // Trigger appearance update
        window.dispatchEvent(new Event('appearance-settings-updated'))
        showSuccess('Ayar güncellendi')
    }

    const handleModuleToggle = (key: string) => {
        setModuleSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof moduleSettings] }))
    }

    const saveModuleSettings = async () => {
        setModuleSettingsSaving(true)
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(moduleSettings)
            })

            if (res.ok) {
                showSuccess('Modül ayarları ve menü güncellendi')
                await refreshSettings() // Refresh global settings
                router.refresh()
            } else {
                throw new Error('Update failed')
            }
        } catch (error) {
            showError('Ayarlar kaydedilemedi')
        } finally {
            setModuleSettingsSaving(false)
        }
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            showError('Yeni şifreler eşleşmiyor')
            return
        }

        if (newPassword.length < 6) {
            showError('Şifre en az 6 karakter olmalıdır')
            return
        }

        setPasswordLoading(true)

        try {
            const res = await fetch('/api/user/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            })

            if (res.ok) {
                showSuccess('Şifreniz başarıyla değiştirildi')
                setIsPasswordModalOpen(false)
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
            } else {
                const text = await res.text()
                showError(text || 'Şifre değiştirilemedi')
            }
        } catch (error) {
            showError('Bir hata oluştu')
        } finally {
            setPasswordLoading(false)
        }
    }

    const handleThemeToggle = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark'
        setTheme(newTheme)
        showSuccess(`${newTheme === 'dark' ? 'Karanlık' : 'Aydınlık'} mod etkinleştirildi`)
    }

    const handleBackup = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/settings/backup', { method: 'POST' })
            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `backup-${new Date().toISOString().split('T')[0]}.json`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                showSuccess('Yedekleme başarılı')
                setLastBackupDate(new Date().toISOString())
            } else {
                const errorData = await res.json()
                throw new Error(errorData.error || 'Backup failed')
            }
        } catch (error: any) {
            showError(error.message || 'Yedekleme başarısız')
        } finally {
            setIsLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        showSuccess('Panoya kopyalandı')
    }

    const tabs = [
        { id: 'general', label: 'Genel', icon: Settings },
        { id: 'appearance', label: 'Görünüm', icon: Palette },
        { id: 'notifications', label: 'Bildirimler', icon: Bell },
    ]

    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.email === 'admin@medisync.com'

    if (isAdmin) {
        tabs.push(
            { id: 'security', label: 'Güvenlik', icon: Shield },
            { id: 'performance', label: 'Performans', icon: Zap },
            { id: 'database', label: 'Veritabanı', icon: Database },
            { id: 'config', label: 'Yapılandırma', icon: Wrench },
            { id: 'modules', label: 'Modüller', icon: LayoutGrid },
            { id: 'integrations', label: 'Entegrasyonlar', icon: Webhook },
            { id: 'advanced', label: 'Gelişmiş', icon: Code },
            { id: 'system', label: 'Sistem', icon: Server }
        )
    }

    return (
        <div className="space-y-6 relative">
            {/* Password Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Şifre Değiştir</h3>
                            <button
                                onClick={() => setIsPasswordModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Mevcut Şifre
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Yeni Şifre
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Yeni Şifre (Tekrar)
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={passwordLoading}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Güncelle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sistem Ayarları</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Uygulama genel yapılandırması ve tercihler</p>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto space-x-2 border-b border-gray-200 dark:border-gray-700 pb-1">
                {tabs.map(tab => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-white dark:bg-gray-800 border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">

                {activeTab === 'general' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6 animate-fadeIn">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                                <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Genel Ayarlar</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SettingItem label="Uygulama Adı" value="MediSync" description="Sistemin görünen adı" />
                            <SettingItem label="Versiyon" value="1.0" description="Mevcut sürüm numarası" />
                        </div>

                        <div className="border-t dark:border-gray-700 pt-4 space-y-4">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Dil ve Bölge</h3>

                            <SelectSetting
                                label="Dil"
                                value={language}
                                onChange={(val) => { setLanguage(val as any); showSuccess('Dil değiştirildi'); }}
                                options={[
                                    { value: 'tr', label: 'Türkçe' },
                                    { value: 'en', label: 'English' }
                                ]}
                                description="Uygulama dili"
                            />

                            <SelectSetting
                                label="Saat Dilimi"
                                value={advancedSettings.timezone}
                                onChange={(val) => updateAdvancedSetting('timezone', val)}
                                options={[
                                    { value: 'Europe/Istanbul', label: 'İstanbul (GMT+3)' },
                                    { value: 'Europe/London', label: 'Londra (GMT+0)' },
                                    { value: 'America/New_York', label: 'New York (GMT-5)' },
                                    { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' }
                                ]}
                                description="Zaman dilimi ayarı"
                            />

                            <SelectSetting
                                label="Tarih Formatı"
                                value={advancedSettings.dateFormat}
                                onChange={(val) => updateAdvancedSetting('dateFormat', val)}
                                options={[
                                    { value: 'DD/MM/YYYY', label: 'GG/AA/YYYY (31/12/2024)' },
                                    { value: 'MM/DD/YYYY', label: 'AA/GG/YYYY (12/31/2024)' },
                                    { value: 'YYYY-MM-DD', label: 'YYYY-AA-GG (2024-12-31)' },
                                    { value: 'DD.MM.YYYY', label: 'GG.AA.YYYY (31.12.2024)' }
                                ]}
                                description="Tarih gösterim formatı"
                            />

                            <SelectSetting
                                label="Saat Formatı"
                                value={advancedSettings.timeFormat}
                                onChange={(val) => updateAdvancedSetting('timeFormat', val)}
                                options={[
                                    { value: '24h', label: '24 Saat (14:30)' },
                                    { value: '12h', label: '12 Saat (02:30 PM)' }
                                ]}
                                description="Saat gösterim formatı"
                            />

                            <SelectSetting
                                label="Sayı Formatı"
                                value={advancedSettings.numberFormat}
                                onChange={(val) => updateAdvancedSetting('numberFormat', val)}
                                options={[
                                    { value: 'tr-TR', label: 'Türkçe (1.234,56)' },
                                    { value: 'en-US', label: 'İngilizce (1,234.56)' },
                                    { value: 'de-DE', label: 'Almanca (1.234,56)' }
                                ]}
                                description="Sayı ve para birimi formatı"
                            />
                        </div>

                        <div className="border-t dark:border-gray-700 pt-4 space-y-4">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Otomatik Kaydetme</h3>
                            <ToggleSetting
                                label="Otomatik Kaydet"
                                description="Form verilerini otomatik olarak kaydet"
                                enabled={advancedSettings.autoSave}
                                onChange={(val) => updateAdvancedSetting('autoSave', val)}
                            />
                            {advancedSettings.autoSave && (
                                <NumberSetting
                                    label="Kaydetme Aralığı (saniye)"
                                    value={advancedSettings.autoSaveInterval}
                                    onChange={(val) => updateAdvancedSetting('autoSaveInterval', val)}
                                    min={10}
                                    max={300}
                                    description="Otomatik kaydetme sıklığı"
                                />
                            )}
                        </div>

                        {/* Lisans Bilgileri */}
                        <LicenseInfoSection showSuccess={showSuccess} showError={showError} isAdmin={isAdmin} />
                    </div>
                )}

                {activeTab === 'appearance' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4 animate-fadeIn">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                                <Palette className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Görünüm Ayarları</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">Karanlık Mod</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Koyu tema kullan</p>
                                </div>
                                <button onClick={handleThemeToggle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform absolute ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <ToggleSetting
                                label="Kompakt Görünüm"
                                description="Daha fazla içerik göster"
                                enabled={compactView}
                                onChange={(val) => { setCompactView(val); showSuccess('Görünüm güncellendi'); }}
                            />

                            <ToggleSetting
                                label="Animasyonlar"
                                description="Geçiş animasyonlarını göster"
                                enabled={animations}
                                onChange={(val) => { setAnimations(val); showSuccess('Animasyonlar güncellendi'); }}
                            />

                            <SelectSetting
                                label="Font Boyutu"
                                value={advancedSettings.fontSize}
                                onChange={(val) => updateAdvancedSetting('fontSize', val)}
                                options={[
                                    { value: 'small', label: 'Küçük' },
                                    { value: 'medium', label: 'Orta' },
                                    { value: 'large', label: 'Büyük' }
                                ]}
                                description="Metin boyutu"
                            />

                            <SelectSetting
                                label="Sidebar Genişliği"
                                value={advancedSettings.sidebarWidth}
                                onChange={(val) => updateAdvancedSetting('sidebarWidth', val)}
                                options={[
                                    { value: 'narrow', label: 'Dar' },
                                    { value: 'normal', label: 'Normal' },
                                    { value: 'wide', label: 'Geniş' }
                                ]}
                                description="Sol menü genişliği"
                            />

                            <NumberSetting
                                label="Sayfa Başına Öğe"
                                value={advancedSettings.itemsPerPage}
                                onChange={(val) => updateAdvancedSetting('itemsPerPage', val)}
                                min={10}
                                max={100}
                                step={10}
                                description="Liste görünümünde gösterilecek öğe sayısı"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4 animate-fadeIn">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg">
                                <Bell className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bildirim Ayarları</h2>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-900 dark:text-white">Bildirim Kanalları</h3>

                            <ToggleSetting
                                label="E-posta Bildirimleri"
                                description="Önemli durumlarda email al"
                                enabled={advancedSettings.enableEmailNotifications}
                                onChange={(val) => updateAdvancedSetting('enableEmailNotifications', val)}
                                icon={<Mail className="w-4 h-4" />}
                            />

                            <ToggleSetting
                                label="SMS Bildirimleri"
                                description="Kritik durumlar için SMS gönder"
                                enabled={advancedSettings.enableSMSNotifications}
                                onChange={(val) => updateAdvancedSetting('enableSMSNotifications', val)}
                                icon={<Smartphone className="w-4 h-4" />}
                            />

                            <ToggleSetting
                                label="Push Bildirimleri"
                                description="Tarayıcı push bildirimleri"
                                enabled={advancedSettings.enablePushNotifications}
                                onChange={(val) => updateAdvancedSetting('enablePushNotifications', val)}
                                icon={<Bell className="w-4 h-4" />}
                            />

                            <ToggleSetting
                                label="In-App Bildirimleri"
                                description="Uygulama içi bildirimler"
                                enabled={advancedSettings.enableInAppNotifications}
                                onChange={(val) => updateAdvancedSetting('enableInAppNotifications', val)}
                                icon={<MessageSquare className="w-4 h-4" />}
                            />

                            <div className="border-t dark:border-gray-700 pt-4">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Bildirim Tercihleri</h3>

                                <ToggleSetting
                                    label="Bakım Hatırlatıcıları"
                                    description="Yaklaşan bakımlar için bildirim"
                                    enabled={localSettings.maintenanceReminders}
                                    onChange={(val) => updateLocalSetting('maintenanceReminders', val)}
                                />

                                <ToggleSetting
                                    label="Kalibrasyon Uyarıları"
                                    description="Kalibrasyon süreleri için uyarı"
                                    enabled={localSettings.calibrationAlerts}
                                    onChange={(val) => updateLocalSetting('calibrationAlerts', val)}
                                />

                                <ToggleSetting
                                    label="Garanti Bildirimleri"
                                    description="Bitiş tarihleri için uyarı"
                                    enabled={localSettings.warrantyAlerts}
                                    onChange={(val) => updateLocalSetting('warrantyAlerts', val)}
                                />

                                <ToggleSetting
                                    label="Bildirim Sesi"
                                    description="Bildirim geldiğinde ses çal"
                                    enabled={advancedSettings.notificationSound}
                                    onChange={(val) => updateAdvancedSetting('notificationSound', val)}
                                    icon={advancedSettings.notificationSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                />
                            </div>

                            <div className="border-t dark:border-gray-700 pt-4">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Sessiz Saatler</h3>

                                <ToggleSetting
                                    label="Sessiz Saatler"
                                    description="Belirli saatlerde bildirim gönderme"
                                    enabled={advancedSettings.quietHoursEnabled}
                                    onChange={(val) => updateAdvancedSetting('quietHoursEnabled', val)}
                                />

                                {advancedSettings.quietHoursEnabled && (
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Başlangıç
                                            </label>
                                            <input
                                                type="time"
                                                value={advancedSettings.quietHoursStart}
                                                onChange={(e) => updateAdvancedSetting('quietHoursStart', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Bitiş
                                            </label>
                                            <input
                                                type="time"
                                                value={advancedSettings.quietHoursEnd}
                                                onChange={(e) => updateAdvancedSetting('quietHoursEnd', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4 animate-fadeIn">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-red-100 dark:bg-red-900 p-3 rounded-lg">
                                <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Güvenlik Ayarları</h2>
                        </div>

                        <div className="space-y-4">
                            <ToggleSetting
                                label="İki Faktörlü Doğrulama"
                                description="Giriş güvenliğini artır"
                                enabled={localSettings.twoFactor}
                                onChange={(val) => updateLocalSetting('twoFactor', val)}
                            />

                            <ToggleSetting
                                label="Oturum Zaman Aşımı"
                                description="İnaktif oturumları sonlandır"
                                enabled={localSettings.sessionTimeout}
                                onChange={(val) => updateLocalSetting('sessionTimeout', val)}
                            />

                            {localSettings.sessionTimeout && (
                                <NumberSetting
                                    label="Oturum Süresi (dakika)"
                                    value={advancedSettings.sessionTimeout}
                                    onChange={(val) => updateAdvancedSetting('sessionTimeout', val)}
                                    min={5}
                                    max={480}
                                    description="Oturum zaman aşımı süresi"
                                />
                            )}

                            <NumberSetting
                                label="Maksimum Giriş Denemesi"
                                value={advancedSettings.maxLoginAttempts}
                                onChange={(val) => updateAdvancedSetting('maxLoginAttempts', val)}
                                min={3}
                                max={10}
                                description="Hesap kilitleme öncesi deneme sayısı"
                            />

                            <ToggleSetting
                                label="IP Beyaz Listesi"
                                description="Sadece belirli IP'lerden girişe izin ver"
                                enabled={advancedSettings.enableIPWhitelist}
                                onChange={(val) => updateAdvancedSetting('enableIPWhitelist', val)}
                            />

                            <ToggleSetting
                                label="Denetim Günlüğü"
                                description="Tüm işlemleri kaydet"
                                enabled={advancedSettings.enableAuditLog}
                                onChange={(val) => updateAdvancedSetting('enableAuditLog', val)}
                            />

                            <div className="pt-4 border-t dark:border-gray-700">
                                <button
                                    onClick={() => setIsPasswordModalOpen(true)}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Şifre Değiştir
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'performance' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4 animate-fadeIn">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                                <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Performans Ayarları</h2>
                        </div>

                        <div className="space-y-4">
                            <ToggleSetting
                                label="Cache Kullan"
                                description="Verileri cache'le (hızlandırır)"
                                enabled={advancedSettings.enableCache}
                                onChange={(val) => updateAdvancedSetting('enableCache', val)}
                            />

                            {advancedSettings.enableCache && (
                                <NumberSetting
                                    label="Cache Süresi (saniye)"
                                    value={advancedSettings.cacheTTL}
                                    onChange={(val) => updateAdvancedSetting('cacheTTL', val)}
                                    min={60}
                                    max={3600}
                                    description="Cache verilerinin geçerlilik süresi"
                                />
                            )}

                            <ToggleSetting
                                label="Lazy Loading"
                                description="Bileşenleri ihtiyaç duyulduğunda yükle"
                                enabled={advancedSettings.enableLazyLoading}
                                onChange={(val) => updateAdvancedSetting('enableLazyLoading', val)}
                            />

                            <ToggleSetting
                                label="Query Optimizasyonu"
                                description="Veritabanı sorgularını optimize et"
                                enabled={advancedSettings.enableQueryOptimization}
                                onChange={(val) => updateAdvancedSetting('enableQueryOptimization', val)}
                            />

                            <ToggleSetting
                                label="Redis Cache"
                                description="Redis kullanarak dağıtık cache"
                                enabled={advancedSettings.enableRedis}
                                onChange={(val) => updateAdvancedSetting('enableRedis', val)}
                            />

                            <ToggleSetting
                                label="PWA Desteği"
                                description="Progressive Web App özellikleri"
                                enabled={advancedSettings.enablePWA}
                                onChange={(val) => updateAdvancedSetting('enablePWA', val)}
                            />

                            <ToggleSetting
                                label="Performans Metrikleri"
                                description="Performans verilerini topla"
                                enabled={advancedSettings.enableMetrics}
                                onChange={(val) => updateAdvancedSetting('enableMetrics', val)}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'database' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4 animate-fadeIn">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                                <Database className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Veritabanı Yönetimi</h2>
                        </div>

                        <div className="space-y-4">
                            <SettingItem label="Veritabanı Tipi" value="PostgreSQL" description="İlişkisel veritabanı sunucusu" />

                            <ToggleSetting
                                label="Otomatik Yedekleme"
                                description="Düzenli aralıklarla otomatik yedekle"
                                enabled={advancedSettings.backupAuto}
                                onChange={(val) => updateAdvancedSetting('backupAuto', val)}
                            />

                            {advancedSettings.backupAuto && (
                                <>
                                    <SelectSetting
                                        label="Yedekleme Sıklığı"
                                        value={backupSchedule}
                                        onChange={(val) => setBackupSchedule(val as any)}
                                        options={[
                                            { value: 'daily', label: 'Günlük' },
                                            { value: 'weekly', label: 'Haftalık' },
                                            { value: 'monthly', label: 'Aylık' }
                                        ]}
                                        description="Otomatik yedekleme zamanlaması"
                                    />

                                    <NumberSetting
                                        label="Yedek Saklama Süresi (gün)"
                                        value={advancedSettings.backupRetention}
                                        onChange={(val) => updateAdvancedSetting('backupRetention', val)}
                                        min={7}
                                        max={365}
                                        description="Eski yedeklerin saklanma süresi"
                                    />
                                </>
                            )}

                            <div className="pt-4 border-t dark:border-gray-700">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Yedekleme İşlemleri</h3>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleBackup}
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                        Yedekle
                                    </button>
                                    <button
                                        onClick={() => {
                                            const input = document.createElement('input')
                                            input.type = 'file'
                                            input.accept = '.json'
                                            input.onchange = async (e) => {
                                                const file = (e.target as HTMLInputElement).files?.[0]
                                                if (file) {
                                                    if (!confirm('Mevcut veritabanı yedeklenecek ve seçilen dosya ile değiştirilecek. Devam etmek istiyor musunuz?')) {
                                                        return
                                                    }
                                                    setIsLoading(true)
                                                    try {
                                                        const reader = new FileReader();
                                                        reader.onload = async () => {
                                                            const base64 = (reader.result as string).split(',')[1];

                                                            try {
                                                                const res = await fetch('/api/settings/restore', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({
                                                                        data: base64,
                                                                        filename: file.name
                                                                    })
                                                                })

                                                                const result = await res.json()

                                                                if (res.ok) {
                                                                    showSuccess('Yedek başarıyla geri yüklendi')
                                                                    setTimeout(() => window.location.reload(), 2000)
                                                                } else {
                                                                    throw new Error(result.error || 'Restore failed')
                                                                }
                                                            } catch (error: any) {
                                                                showError(error.message || 'Yedek geri yüklenemedi')
                                                                setIsLoading(false)
                                                            }
                                                        };
                                                        reader.onerror = () => {
                                                            showError('Dosya okunamadı')
                                                            setIsLoading(false)
                                                        };
                                                        reader.readAsDataURL(file);
                                                        return; // Wait for reader.onload
                                                    } catch (error: any) {
                                                        showError(error.message || 'Yedek geri yüklenemedi')
                                                        setIsLoading(false)
                                                    }
                                                }
                                            }
                                            input.click()
                                        }}
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Geri Yükle
                                    </button>
                                </div>
                                {lastBackupDate && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        Son yedekleme: {new Date(lastBackupDate).toLocaleString('tr-TR')}
                                    </p>
                                )}
                            </div>

                            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg mt-4 border border-red-100 dark:border-red-800">
                                <h4 className="text-red-800 dark:text-red-300 font-medium flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Tehlikeli Bölge
                                </h4>
                                <p className="text-sm text-red-600 dark:text-red-400 mt-1 mb-3">Bu işlemler geri alınamaz.</p>
                                <button
                                    onClick={() => {
                                        if (confirm('Tüm veriler silinecek. Emin misiniz?')) {
                                            fetch('/api/settings/reset', { method: 'POST' })
                                                .then(() => {
                                                    showSuccess('Veritabanı sıfırlandı')
                                                    setTimeout(() => window.location.reload(), 2000)
                                                })
                                                .catch(() => showError('Sıfırlama başarısız'))
                                        }
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" /> Tüm Verileri Sıfırla
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'modules' && isAdmin && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-fadeIn">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/10">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                                    <LayoutGrid className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Modül Yönetimi</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Sol menüde görünecek modülleri seçin.</p>
                                </div>
                            </div>
                        </div>

                        {moduleSettingsLoading ? (
                            <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
                        ) : (
                            <div className="p-6 divide-y divide-gray-100 dark:divide-gray-700">
                                {[
                                    { key: 'maintenanceEnabled', label: 'Bakım Yönetimi', desc: 'Periyodik bakımlar ve arıza takibi' },
                                    { key: 'calibrationEnabled', label: 'Kalibrasyon', desc: 'Sertifika ve kalibrasyon yönetimi' },
                                    { key: 'contractsEnabled', label: 'Sözleşme Yönetimi', desc: 'Bakım ve hizmet sözleşmeleri takibi' },
                                    { key: 'utsEnabled', label: 'UTS Entegrasyonu', desc: 'Ürün Takip Sistemi sorgulama' },
                                    { key: 'complianceEnabled', label: 'Uyumluluk', desc: 'Yasal mevzuat ve standartlar' },
                                    { key: 'reportsEnabled', label: 'Raporlar', desc: 'İstatistik ve analiz ekranları' },
                                    { key: 'branchesEnabled', label: 'Şubeler', desc: 'Çoklu hastane/şube yönetimi' },
                                    { key: 'trainingEnabled', label: 'Eğitimler', desc: 'Personel ve cihaz eğitimleri' },
                                    { key: 'procurementEnabled', label: 'Teslim Alma', desc: 'Yeni cihaz kabul ve kurulumu' },
                                    { key: 'decommissioningEnabled', label: 'Kullanım Dışı Bırakma', desc: 'Cihaz hurdaya ayırma işlemleri' },
                                ].map((item) => (
                                    <div key={item.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={moduleSettings[item.key as keyof typeof moduleSettings]}
                                                onChange={() => handleModuleToggle(item.key)}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                            <button
                                onClick={saveModuleSettings}
                                disabled={moduleSettingsSaving}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
                            >
                                {moduleSettingsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Kaydet ve Uygula
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'integrations' && isAdmin && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4 animate-fadeIn">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-lg">
                                <Webhook className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Entegrasyonlar</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white mb-3">API Ayarları</h3>
                                <div className="space-y-3">
                                    <ApiKeySetting
                                        label="API Key"
                                        value="sk_live_********************"
                                        description="Ana API anahtarı"
                                        onCopy={() => copyToClipboard('sk_live_********************')}
                                        show={showApiKey['api'] || false}
                                        onToggle={() => setShowApiKey(prev => ({ ...prev, api: !prev['api'] }))}
                                    />
                                    <ApiKeySetting
                                        label="Webhook Secret"
                                        value="whsec_********************"
                                        description="Webhook doğrulama anahtarı"
                                        onCopy={() => copyToClipboard('whsec_********************')}
                                        show={showApiKey['webhook'] || false}
                                        onToggle={() => setShowApiKey(prev => ({ ...prev, webhook: !prev['webhook'] }))}
                                    />
                                </div>
                            </div>

                            <div className="border-t dark:border-gray-700 pt-4">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Üçüncü Parti Entegrasyonlar</h3>
                                <div className="space-y-3">
                                    <ToggleSetting
                                        label="Twilio SMS"
                                        description="SMS bildirimleri için Twilio entegrasyonu"
                                        enabled={advancedSettings.enableSMSNotifications}
                                        onChange={(val) => updateAdvancedSetting('enableSMSNotifications', val)}
                                    />
                                    <ToggleSetting
                                        label="Email Servisi"
                                        description="E-posta gönderimi için SMTP entegrasyonu"
                                        enabled={advancedSettings.enableEmailNotifications}
                                        onChange={(val) => updateAdvancedSetting('enableEmailNotifications', val)}
                                    />
                                </div>
                            </div>

                            <div className="border-t dark:border-gray-700 pt-4">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Webhook URL'leri</h3>
                                <div className="space-y-3">
                                    <TextSetting
                                        label="Bildirim Webhook"
                                        value="https://example.com/webhook/notifications"
                                        onChange={(val) => { }}
                                        description="Bildirimler için webhook URL'i"
                                        placeholder="https://..."
                                    />
                                    <TextSetting
                                        label="Hata Webhook"
                                        value="https://example.com/webhook/errors"
                                        onChange={(val) => { }}
                                        description="Hata bildirimleri için webhook URL'i"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'advanced' && isAdmin && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4 animate-fadeIn">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
                                <Code className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gelişmiş Ayarlar</h2>
                        </div>

                        <div className="space-y-4">
                            <SelectSetting
                                label="Log Seviyesi"
                                value={advancedSettings.logLevel}
                                onChange={(val) => updateAdvancedSetting('logLevel', val)}
                                options={[
                                    { value: 'error', label: 'Sadece Hatalar' },
                                    { value: 'warn', label: 'Uyarılar ve Hatalar' },
                                    { value: 'info', label: 'Bilgi (Önerilen)' },
                                    { value: 'debug', label: 'Tüm Detaylar' }
                                ]}
                                description="Sistem loglama seviyesi"
                            />

                            <ToggleSetting
                                label="Debug Modu"
                                description="Geliştiriciler için detaylı hata mesajları"
                                enabled={advancedSettings.debugMode}
                                onChange={(val) => updateAdvancedSetting('debugMode', val)}
                            />

                            <ToggleSetting
                                label="Performans Metrikleri"
                                description="Performans verilerini topla ve göster"
                                enabled={advancedSettings.enableMetrics}
                                onChange={(val) => updateAdvancedSetting('enableMetrics', val)}
                            />

                            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <h4 className="text-yellow-800 dark:text-yellow-300 font-medium flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-4 h-4" /> Uyarı
                                </h4>
                                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                    Gelişmiş ayarları değiştirmeden önce yedek alın. Yanlış yapılandırma uygulamanın çalışmasını etkileyebilir.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'system' && isAdmin && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4 animate-fadeIn">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                                <Server className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sistem Bilgileri</h2>
                        </div>

                        {systemInfo && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SettingItem label="Platform" value={systemInfo.platform || 'N/A'} description="İşletim sistemi" />
                                <SettingItem label="Ekran Çözünürlüğü" value={systemInfo.screenResolution || 'N/A'} description="Görüntü çözünürlüğü" />
                                <SettingItem label="Dil" value={systemInfo.language || 'N/A'} description="Tarayıcı dili" />
                                <SettingItem label="Çevrimiçi" value={systemInfo.online ? 'Evet' : 'Hayır'} description="İnternet bağlantısı" />
                                <SettingItem label="Cookie Desteği" value={systemInfo.cookieEnabled ? 'Aktif' : 'Pasif'} description="Cookie durumu" />
                                <SettingItem label="User Agent" value={systemInfo.userAgent?.substring(0, 50) + '...' || 'N/A'} description="Tarayıcı bilgisi" />
                            </div>
                        )}

                        <div className="border-t dark:border-gray-700 pt-4">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Sistem Durumu</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        <span className="text-sm font-medium text-green-800 dark:text-green-300">Durum</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">Aktif</p>
                                </div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Performans</span>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">İyi</p>
                                </div>
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <HardDriveIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                        <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Depolama</span>
                                    </div>
                                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">Yeterli</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'config' && isAdmin && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6 animate-fadeIn">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-lg">
                                <Wrench className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sistem Yapılandırması</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">.env dosyası ayarlarını görsel olarak düzenleyin</p>
                            </div>
                        </div>

                        {envLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            </div>
                        ) : (
                            <>
                                {/* Veritabanı Bağlantısı */}
                                <div className="space-y-4">
                                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        <Database className="w-5 h-5 text-blue-500" />
                                        Veritabanı Bağlantısı
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Sunucu Adresi
                                            </label>
                                            <input
                                                type="text"
                                                value={envConfig.host}
                                                onChange={(e) => setEnvConfig(prev => ({ ...prev, host: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                placeholder="localhost"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Port
                                            </label>
                                            <input
                                                type="number"
                                                value={envConfig.port}
                                                onChange={(e) => setEnvConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 5432 }))}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                placeholder="5432"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Veritabanı Adı
                                        </label>
                                        <input
                                            type="text"
                                            value={envConfig.database}
                                            onChange={(e) => setEnvConfig(prev => ({ ...prev, database: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                            placeholder="medisync"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Kullanıcı Adı
                                            </label>
                                            <input
                                                type="text"
                                                value={envConfig.username}
                                                onChange={(e) => setEnvConfig(prev => ({ ...prev, username: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                placeholder="postgres"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Şifre
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showDbPassword ? 'text' : 'password'}
                                                    value={envConfig.password}
                                                    onChange={(e) => setEnvConfig(prev => ({ ...prev, password: e.target.value }))}
                                                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowDbPassword(!showDbPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showDbPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bağlantı Testi */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={testDbConnection}
                                            disabled={dbTestLoading || !envConfig.password}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {dbTestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                            Bağlantıyı Test Et
                                        </button>
                                        {dbTestResult && (
                                            <div className={`flex items-center gap-2 text-sm ${dbTestResult.success ? 'text-green-600' : 'text-red-600'}`}>
                                                {dbTestResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                                {dbTestResult.success ? 'Bağlantı başarılı' : dbTestResult.error}
                                            </div>
                                        )}
                                    </div>

                                    {dbTestResult?.success && dbTestResult.data && (
                                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm">
                                            <p className="text-green-800 dark:text-green-300">PostgreSQL {dbTestResult.data.version}</p>
                                            <p className="text-green-600 dark:text-green-400">Boyut: {dbTestResult.data.databaseSize}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Uygulama Ayarları */}
                                <div className="border-t dark:border-gray-700 pt-6 space-y-4">
                                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-green-500" />
                                        Uygulama Ayarları
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Uygulama URL&apos;i
                                        </label>
                                        <input
                                            type="text"
                                            value={envConfig.nextAuthUrl}
                                            onChange={(e) => setEnvConfig(prev => ({ ...prev, nextAuthUrl: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                            placeholder="http://localhost:3000"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Uygulamaya erişeceğiniz tam URL adresi
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Güvenlik Anahtarı
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={envConfig.nextAuthSecret}
                                                onChange={(e) => setEnvConfig(prev => ({ ...prev, nextAuthSecret: e.target.value }))}
                                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                                placeholder="En az 32 karakter"
                                            />
                                            <button
                                                type="button"
                                                onClick={generateNewSecret}
                                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                                            >
                                                Yenile
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Oturum şifreleme için kullanılır. En az 32 karakter olmalıdır.
                                        </p>
                                    </div>
                                </div>

                                {/* Uyarı */}
                                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-amber-800 dark:text-amber-300">Önemli</p>
                                            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                                Yapılandırma değişiklikleri .env dosyasına kaydedilir. Değişikliklerin etkili olması için uygulamayı yeniden başlatmanız gerekir.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Kaydet */}
                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={saveEnvConfig}
                                        disabled={envSaving || !envConfig.password || envConfig.nextAuthSecret.length < 32}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {envSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Yapılandırmayı Kaydet
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function SettingItem({ label, value, description }: { label: string; value: string; description: string }) {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
                <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
            </div>
            <div className="text-right"><p className="font-semibold text-gray-900 dark:text-white">{value}</p></div>
        </div>
    )
}

function ToggleSetting({ label, description, enabled, onChange, icon }: { label: string; description: string; enabled: boolean; onChange: (val: boolean) => void; icon?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex-1 flex items-center gap-3">
                {icon && <div className="text-gray-500 dark:text-gray-400">{icon}</div>}
                <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                </div>
            </div>
            <button onClick={() => onChange(!enabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    )
}

function SelectSetting({ label, value, onChange, options, description }: { label: string; value: string; onChange: (val: string) => void; options: Array<{ value: string; label: string }>; description: string }) {
    return (
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{description}</p>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    )
}

function NumberSetting({ label, value, onChange, min, max, step = 1, description }: { label: string; value: number; onChange: (val: number) => void; min: number; max: number; step?: number; description: string }) {
    return (
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{description}</p>
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || min)))}
                    min={min}
                    max={max}
                    step={step}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="button"
                    onClick={() => onChange(Math.max(min, value - step))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    -
                </button>
                <button
                    type="button"
                    onClick={() => onChange(Math.min(max, value + step))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    +
                </button>
            </div>
        </div>
    )
}

function TextSetting({ label, value, onChange, description, placeholder }: { label: string; value: string; onChange: (val: string) => void; description: string; placeholder?: string }) {
    return (
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{description}</p>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
        </div>
    )
}

function ApiKeySetting({ label, value, description, onCopy, show, onToggle }: { label: string; value: string; description: string; onCopy: () => void; show: boolean; onToggle: () => void }) {
    return (
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{description}</p>
            <div className="flex items-center gap-2">
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                />
                <button
                    type="button"
                    onClick={onToggle}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                    type="button"
                    onClick={onCopy}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <Copy className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

function LicenseInfoSection({ showSuccess, showError, isAdmin }: { showSuccess: (msg: string) => void; showError: (msg: string) => void; isAdmin: boolean }) {
    const { checkLicense: refreshGlobalLicense } = useLicense()
    const [licenseInfo, setLicenseInfo] = useState<{
        type: string
        remainingHours: number
        totalHours: number
        expiryDate: string | null
        isActive: boolean
        licenseKey?: string
        deviceFingerprint?: string
    } | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isResetting, setIsResetting] = useState(false)
    const [newLicenseKey, setNewLicenseKey] = useState('')
    const [isActivating, setIsActivating] = useState(false)

    const fetchLicenseInfo = async () => {
        try {
            const res = await fetch('/api/license/check')
            const data = await res.json()
            setLicenseInfo(data)
        } catch (error) {
            console.error('Lisans bilgisi alınamadı:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchLicenseInfo()
    }, [])

    const handleResetLicense = async () => {
        if (!confirm('Lisansı sıfırlamak istediğinizden emin misiniz? Bu işlem demo süresini yeniden başlatacaktır.')) {
            return
        }

        setIsResetting(true)
        try {
            const res = await fetch('/api/license/reset', { method: 'POST' })
            const data = await res.json()

            if (data.success) {
                showSuccess('Lisans başarıyla sıfırlandı')
                fetchLicenseInfo()
            } else {
                showError(data.message || 'Lisans sıfırlanamadı')
            }
        } catch (error) {
            showError('Lisans sıfırlama sırasında hata oluştu')
        } finally {
            setIsResetting(false)
        }
    }

    const handleActivateLicense = async () => {
        if (!newLicenseKey.trim()) {
            showError('Lütfen lisans anahtarı girin')
            return
        }

        setIsActivating(true)
        try {
            const res = await fetch('/api/license/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ licenseKey: newLicenseKey.trim() })
            })
            const data = await res.json()

            if (data.success) {
                showSuccess('Lisans başarıyla aktive edildi')
                setNewLicenseKey('')
                fetchLicenseInfo()
                refreshGlobalLicense() // Demo timer'ı güncelle
            } else {
                showError(data.message || 'Lisans aktive edilemedi')
            }
        } catch (error) {
            showError('Lisans aktivasyonu sırasında hata oluştu')
        } finally {
            setIsActivating(false)
        }
    }

    if (isLoading) {
        return (
            <div className="border-t dark:border-gray-700 pt-4">
                <div className="animate-pulse flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-300 rounded"></div>
                    <div className="h-4 w-32 bg-gray-300 rounded"></div>
                </div>
            </div>
        )
    }

    if (!licenseInfo) return null

    const getStatusColor = () => {
        if (licenseInfo.type === 'EXPIRED') return 'text-red-600 bg-red-100 dark:bg-red-900/30'
        if (licenseInfo.type === 'FULL') return 'text-green-600 bg-green-100 dark:bg-green-900/30'
        if (licenseInfo.remainingHours < 24) return 'text-red-600 bg-red-100 dark:bg-red-900/30'
        if (licenseInfo.remainingHours < 72) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
    }

    const getStatusLabel = () => {
        if (licenseInfo.type === 'EXPIRED') return 'Süresi Dolmuş'
        if (licenseInfo.type === 'FULL') return 'Tam Sürüm'
        return 'Demo Modu'
    }

    return (
        <div className="border-t dark:border-gray-700 pt-4 space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Lisans Bilgileri
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lisans Durumu */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lisans Durumu</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor()}`}>
                        {getStatusLabel()}
                    </span>
                </div>

                {/* Kalan Süre */}
                {licenseInfo.type === 'DEMO' && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Kalan Süre</p>
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                                {licenseInfo.remainingHours} saat
                            </span>
                            <span className="text-sm text-gray-500">
                                ({Math.floor(licenseInfo.remainingHours / 24)} gün)
                            </span>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${(licenseInfo.remainingHours / licenseInfo.totalHours) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {licenseInfo.totalHours} saatlik demo süresinden {licenseInfo.remainingHours} saat kaldı
                        </p>
                    </div>
                )}

                {/* Tam Sürüm için Bitiş Tarihi */}
                {licenseInfo.type === 'FULL' && licenseInfo.expiryDate && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lisans Bitiş Tarihi</p>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {new Date(licenseInfo.expiryDate).toLocaleDateString('tr-TR')}
                        </span>
                    </div>
                )}

                {licenseInfo.type === 'FULL' && !licenseInfo.expiryDate && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lisans Süresi</p>
                        <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                            ♾️ Sınırsız
                        </span>
                    </div>
                )}
            </div>

            {/* Donanım Kimliği (HWID) */}
            {licenseInfo.deviceFingerprint && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Donanım Kimliği (HWID)</p>
                    <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-gray-900 dark:text-white break-all flex-1">
                            {licenseInfo.deviceFingerprint}
                        </code>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(licenseInfo.deviceFingerprint || '')
                                showSuccess('HWID kopyalandı')
                            }}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                            title="Kopyala"
                        >
                            <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Lisans üretimi için bu kimliği kullanın</p>
                </div>
            )}

            {/* Lisans Anahtarı */}
            {licenseInfo.licenseKey && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lisans Anahtarı</p>
                    <code className="text-sm font-mono text-gray-900 dark:text-white break-all">
                        {licenseInfo.licenseKey}
                    </code>
                </div>
            )}

            {/* Lisans Anahtarı Girişi - Admin ve Yöneticiler */}
            {isAdmin && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="font-medium text-blue-800 dark:text-blue-300 mb-2">Lisans Anahtarı Gir</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">Tam sürüme geçmek için lisans anahtarınızı girin</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newLicenseKey}
                            onChange={(e) => setNewLicenseKey(e.target.value)}
                            placeholder="XXXX-XXXX-XXXX-XXXX"
                            className="flex-1 px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleActivateLicense}
                            disabled={isActivating || !newLicenseKey.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                        >
                            {isActivating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Key className="w-4 h-4" />
                            )}
                            Aktive Et
                        </button>
                    </div>
                </div>
            )}

            {/* Lisans Sıfırlama Butonu - Sadece Admin */}
            {isAdmin && (
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div>
                        <p className="font-medium text-red-800 dark:text-red-300">Lisansı Sıfırla</p>
                        <p className="text-xs text-red-600 dark:text-red-400">Demo süresini yeniden başlatır. Sadece test amaçlıdır.</p>
                    </div>
                    <button
                        onClick={handleResetLicense}
                        disabled={isResetting}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                    >
                        {isResetting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                        Sıfırla
                    </button>
                </div>
            )}
        </div>
    )
}
