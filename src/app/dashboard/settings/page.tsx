'use client'

import { useState, useEffect } from 'react'
import {
    Settings, Database, Bell, Shield, ShieldCheck, Palette,
    AlertTriangle, Download, Trash2,
    Clock, Save, CheckCircle2, Loader2,
    LayoutGrid, X, Activity, Server, Key,
    RefreshCw, Eye, EyeOff, Copy,
    Mail, MessageSquare, Smartphone,
    Volume2, VolumeX, Cpu, HardDriveIcon, Upload,
    Wrench, Tag, QrCode, Building2, Layers, Truck,
    Plus, Pencil, Phone, User, MapPin, Lock, Bug, ExternalLink, Send
} from 'lucide-react'
import { useToast } from '@/components/ToastProvider'
import { useTheme } from '@/components/ThemeProvider'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useSettings } from '@/contexts/SettingsContext'
import { useLicense } from '@/contexts/LicenseContext'
import { useHospital } from '@/contexts/HospitalContext'
import { translateText } from '@/lib/i18n/masterDictionary'

export default function SettingsPage() {
    const { showSuccess, showError } = useToast()
    const { refreshSettings } = useSettings()
    const { theme, setTheme, compactView, setCompactView, language, setLanguage, animations, setAnimations } = useTheme()
    const { data: session } = useSession()
    const { activeHospital } = useHospital()
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

    // Advanced & Appearance Settings State
    const [advancedSettings, setAdvancedSettings] = useState({
        timezone: 'Europe/Istanbul',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        numberFormat: 'tr-TR',
        autoSave: true,
        autoSaveInterval: 30,
        fontSize: 'medium',
        sidebarWidth: 'normal',
        itemsPerPage: 20,
        sessionTimeout: 30,
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
        backupRetention: 30,
    })

    // Local Settings State
    const [localSettings, setLocalSettings] = useState({
        emailNotifications: true,
        maintenanceReminders: true,
        calibrationAlerts: true,
        warrantyAlerts: true,
        twoFactor: false,
        sessionTimeout: true
    })

    // Module Settings State
    const [moduleSettings, setModuleSettings] = useState({
        maintenanceEnabled: true,
        calibrationEnabled: true,
        utsEnabled: true,
        complianceEnabled: true,
        reportsEnabled: true,
        branchesEnabled: true,
        trainingEnabled: true,
        procurementEnabled: true,
        decommissioningEnabled: true,
        contractsEnabled: true,
    })
    const [moduleSettingsLoading, setModuleSettingsLoading] = useState(true)
    const [moduleSettingsSaving, setModuleSettingsSaving] = useState(false)

    // Biomedical & QR Label Extended Settings State
    const [bioSettings, setBioSettings] = useState({
        labelHeaderText: 'Özel PARKHAYAT Hastanesi',
        defaultLabelFormat: 'tze-24mm' as 'tze-24mm' | 'tze-32mm' | 'tze-18mm' | 'tze-24mm-horizontal' | 'thermal-50x30' | 'thermal-80x50' | 'standard',
        showSerialOnLabel: true,
        showLocationOnLabel: true,
        calibrationAlertDays: 30,
        maintenanceAlertDays: 14,
        warrantyAlertDays: 30,
        defaultMaintenanceInterval: 180,
        defaultCalibrationInterval: 365,
        criticalSlaHours: 4,
        emergencyPhone: '',
        reportHeaderTitle: 'BİYOMEDİKAL MÜHENDİSLİK BİRİMİ',
        telegramBugAlertsEnabled: true,
        telegramBotToken: '',
        telegramChatId: '',
        emailBugAlertsEnabled: false,
        supportAlertEmail: '',
        faultTelegramAlertsEnabled: true,
        faultTelegramBotToken: '',
        faultTelegramChatId: '',
        whatsappAlertsEnabled: false,
        whatsappProvider: 'ultramsg' as 'ultramsg' | 'generic_webhook' | 'greenapi',
        whatsappApiUrl: '',
        whatsappToken: '',
        whatsappPhoneNumber: ''
    })
    const [bioSaving, setBioSaving] = useState(false)
    const [testNotificationLoading, setTestNotificationLoading] = useState<'telegram' | 'hospitalTelegram' | 'email' | 'whatsapp' | null>(null)

    // Locations & Categories CRUD State
    const [locations, setLocations] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [defsLoading, setDefsLoading] = useState(false)
    const [newLocationName, setNewLocationName] = useState('')
    const [newLocationDesc, setNewLocationDesc] = useState('')
    const [editingLocation, setEditingLocation] = useState<any | null>(null)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryDesc, setNewCategoryDesc] = useState('')
    const [editingCategory, setEditingCategory] = useState<any | null>(null)

    // Suppliers CRUD State
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [suppliersLoading, setSuppliersLoading] = useState(false)
    const [supplierForm, setSupplierForm] = useState({
        id: '',
        name: '',
        contactName: '',
        phone: '',
        email: '',
        address: ''
    })
    const [supplierSaving, setSupplierSaving] = useState(false)

    // System Info State
    const [systemInfo, setSystemInfo] = useState<Record<string, string | boolean | null> | null>(null)

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
    const [deviceTagFormat, setDeviceTagFormat] = useState('KUNYE-{YYYY}-{SEQ}')
    const [tagFormatSaving, setTagFormatSaving] = useState(false)
    const [retagLoading, setRetagLoading] = useState(false)

    const handleBulkRetag = async () => {
        if (!confirm(`Tüm cihazların künye numaraları '${deviceTagFormat}' formatına göre yeniden adlandırılacak. Onaylıyor musunuz?`)) {
            return
        }
        setRetagLoading(true)
        try {
            await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceTagFormat })
            })
            const res = await fetch('/api/devices/bulk-retag', { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
                showSuccess(data.message || 'Cihazlar başarıyla yeni formata dönüştürüldü')
            } else {
                showError(data.error || 'Güncelleme yapılamadı')
            }
        } catch (err: any) {
            showError('Hata: ' + (err.message || 'Bağlantı hatası'))
        } finally {
            setRetagLoading(false)
        }
    }

    // Load settings
    useEffect(() => {
        const saved = localStorage.getItem('appSettings_preferences')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setLocalSettings(prev => ({ ...prev, ...parsed }))
                if (parsed.advancedSettings) {
                    setAdvancedSettings(prev => ({ ...prev, ...parsed.advancedSettings }))
                }
            } catch (e) {
                console.error('Error parsing local settings', e)
            }
        }

        // Load backend settings
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                const s = data.data || data
                if (s.deviceTagFormat) setDeviceTagFormat(s.deviceTagFormat)

                setModuleSettings(prev => ({
                    ...prev,
                    maintenanceEnabled: s.maintenanceEnabled ?? prev.maintenanceEnabled,
                    calibrationEnabled: s.calibrationEnabled ?? prev.calibrationEnabled,
                    utsEnabled: s.utsEnabled ?? prev.utsEnabled,
                    complianceEnabled: s.complianceEnabled ?? prev.complianceEnabled,
                    reportsEnabled: s.reportsEnabled ?? prev.reportsEnabled,
                    branchesEnabled: s.branchesEnabled ?? prev.branchesEnabled,
                    trainingEnabled: s.trainingEnabled ?? prev.trainingEnabled,
                    procurementEnabled: s.procurementEnabled ?? prev.procurementEnabled,
                    decommissioningEnabled: s.decommissioningEnabled ?? prev.decommissioningEnabled,
                    contractsEnabled: s.contractsEnabled ?? prev.contractsEnabled,
                }))

                setBioSettings(prev => ({
                    ...prev,
                    labelHeaderText: s.labelHeaderText ?? prev.labelHeaderText,
                    defaultLabelFormat: s.defaultLabelFormat ?? prev.defaultLabelFormat,
                    showSerialOnLabel: s.showSerialOnLabel ?? prev.showSerialOnLabel,
                    showLocationOnLabel: s.showLocationOnLabel ?? prev.showLocationOnLabel,
                    calibrationAlertDays: s.calibrationAlertDays ?? prev.calibrationAlertDays,
                    maintenanceAlertDays: s.maintenanceAlertDays ?? prev.maintenanceAlertDays,
                    warrantyAlertDays: s.warrantyAlertDays ?? prev.warrantyAlertDays,
                    defaultMaintenanceInterval: s.defaultMaintenanceInterval ?? prev.defaultMaintenanceInterval,
                    defaultCalibrationInterval: s.defaultCalibrationInterval ?? prev.defaultCalibrationInterval,
                    criticalSlaHours: s.criticalSlaHours ?? prev.criticalSlaHours,
                    emergencyPhone: s.emergencyPhone ?? prev.emergencyPhone,
                    reportHeaderTitle: s.reportHeaderTitle ?? prev.reportHeaderTitle,
                    telegramBugAlertsEnabled: s.telegramBugAlertsEnabled ?? prev.telegramBugAlertsEnabled,
                    telegramBotToken: s.telegramBotToken ?? prev.telegramBotToken,
                    telegramChatId: s.telegramChatId ?? prev.telegramChatId,
                    emailBugAlertsEnabled: s.emailBugAlertsEnabled ?? prev.emailBugAlertsEnabled,
                    supportAlertEmail: s.supportAlertEmail ?? prev.supportAlertEmail,
                    faultTelegramAlertsEnabled: s.faultTelegramAlertsEnabled ?? prev.faultTelegramAlertsEnabled,
                    faultTelegramBotToken: s.faultTelegramBotToken ?? prev.faultTelegramBotToken,
                    faultTelegramChatId: s.faultTelegramChatId ?? prev.faultTelegramChatId,
                    whatsappAlertsEnabled: s.whatsappAlertsEnabled ?? prev.whatsappAlertsEnabled,
                    whatsappProvider: s.whatsappProvider ?? prev.whatsappProvider,
                    whatsappApiUrl: s.whatsappApiUrl ?? prev.whatsappApiUrl,
                    whatsappToken: s.whatsappToken ?? prev.whatsappToken,
                    whatsappPhoneNumber: s.whatsappPhoneNumber ?? prev.whatsappPhoneNumber,
                }))

                if (s.itemsPerPage || s.fontSize || s.sidebarWidth) {
                    setAdvancedSettings(prev => ({
                        ...prev,
                        itemsPerPage: s.itemsPerPage ?? prev.itemsPerPage,
                        fontSize: s.fontSize ?? prev.fontSize,
                        sidebarWidth: s.sidebarWidth ?? prev.sidebarWidth,
                    }))
                }

                setModuleSettingsLoading(false)
            })
            .catch(err => {
                console.error(err)
                setModuleSettingsLoading(false)
            })

        loadSystemInfo()
        loadEnvConfig()
    }, [])

    useEffect(() => {
        if (activeTab === 'definitions') {
            fetchDefinitions()
        } else if (activeTab === 'suppliers') {
            fetchSuppliers()
        }
    }, [activeTab, activeHospital])

    const fetchDefinitions = async () => {
        setDefsLoading(true)
        try {
            const query = activeHospital ? `?hospitalId=${activeHospital.id}` : ''
            const [locRes, catRes] = await Promise.all([
                fetch(`/api/locations${query}`),
                fetch('/api/categories')
            ])
            if (locRes.ok) {
                setLocations(await locRes.json())
            }
            if (catRes.ok) {
                setCategories(await catRes.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setDefsLoading(false)
        }
    }

    const fetchSuppliers = async () => {
        setSuppliersLoading(true)
        try {
            const res = await fetch('/api/suppliers')
            if (res.ok) {
                setSuppliers(await res.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSuppliersLoading(false)
        }
    }

    const handleSaveLocation = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newLocationName.trim()) return
        try {
            const method = editingLocation ? 'PUT' : 'POST'
            const body = editingLocation
                ? { id: editingLocation.id, name: newLocationName.trim(), description: newLocationDesc.trim() }
                : { name: newLocationName.trim(), description: newLocationDesc.trim(), hospitalId: activeHospital?.id }

            const res = await fetch('/api/locations', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                showSuccess(editingLocation ? 'Bölüm güncellendi' : 'Yeni bölüm eklendi')
                setNewLocationName('')
                setNewLocationDesc('')
                setEditingLocation(null)
                fetchDefinitions()
            } else {
                showError(data.error || 'İşlem başarısız')
            }
        } catch {
            showError('Bölüm kaydedilemedi')
        }
    }

    const handleDeleteLocation = async (id: string, name: string) => {
        if (!confirm(`"${name}" bölümünü silmek istediğinize emin misiniz?`)) return
        try {
            const res = await fetch(`/api/locations?id=${id}`, { method: 'DELETE' })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                showSuccess('Bölüm silindi')
                fetchDefinitions()
            } else {
                showError(data.error || 'Bölüm silinemedi')
            }
        } catch {
            showError('Silme işlemi başarısız')
        }
    }

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCategoryName.trim()) return
        try {
            const method = editingCategory ? 'PUT' : 'POST'
            const body = editingCategory
                ? { id: editingCategory.id, name: newCategoryName.trim(), description: newCategoryDesc.trim() }
                : { name: newCategoryName.trim(), description: newCategoryDesc.trim() }

            const res = await fetch('/api/categories', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                showSuccess(editingCategory ? 'Kategori güncellendi' : 'Yeni kategori eklendi')
                setNewCategoryName('')
                setNewCategoryDesc('')
                setEditingCategory(null)
                fetchDefinitions()
            } else {
                showError(data.error || 'İşlem başarısız')
            }
        } catch {
            showError('Kategori kaydedilemedi')
        }
    }

    const handleDeleteCategory = async (id: string, name: string) => {
        if (!confirm(`"${name}" kategorisini silmek istediğinize emin misiniz?`)) return
        try {
            const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                showSuccess('Kategori silindi')
                fetchDefinitions()
            } else {
                showError(data.error || 'Kategori silinemedi')
            }
        } catch {
            showError('Silme işlemi başarısız')
        }
    }

    const handleSaveSupplier = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!supplierForm.name.trim()) return
        setSupplierSaving(true)
        try {
            const method = supplierForm.id ? 'PUT' : 'POST'
            const res = await fetch('/api/suppliers', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(supplierForm)
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                showSuccess(supplierForm.id ? 'Firma bilgileri güncellendi' : 'Yeni tedarikçi/servis firması eklendi')
                setSupplierForm({ id: '', name: '', contactName: '', phone: '', email: '', address: '' })
                fetchSuppliers()
            } else {
                showError(data.error || 'Firma kaydedilemedi')
            }
        } catch {
            showError('Bir hata oluştu')
        } finally {
            setSupplierSaving(false)
        }
    }

    const handleDeleteSupplier = async (id: string, name: string) => {
        if (!confirm(`"${name}" firmasını silmek istediğinize emin misiniz?`)) return
        try {
            const res = await fetch(`/api/suppliers?id=${id}`, { method: 'DELETE' })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                showSuccess('Firma silindi')
                fetchSuppliers()
            } else {
                showError(data.error || 'Firma silinemedi')
            }
        } catch {
            showError('Silme işlemi başarısız')
        }
    }

    const saveBioSettings = async () => {
        setBioSaving(true)
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bioSettings)
            })
            if (res.ok) {
                showSuccess('Biyomedikal ve QR etiket ayarları kaydedildi')
                await refreshSettings()
            } else {
                showError('Ayarlar kaydedilemedi')
            }
        } catch {
            showError('Bir hata oluştu')
        } finally {
            setBioSaving(false)
        }
    }

    const handleTestNotification = async (channel: 'telegram' | 'hospitalTelegram' | 'email' | 'whatsapp') => {
        setTestNotificationLoading(channel)
        try {
            if (channel === 'whatsapp') {
                const res = await fetch('/api/bug-reports/test-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'whatsapp',
                        provider: bioSettings.whatsappProvider,
                        apiUrl: bioSettings.whatsappApiUrl,
                        token: bioSettings.whatsappToken,
                        phoneNumber: bioSettings.whatsappPhoneNumber
                    })
                })
                const data = await res.json()
                if (res.ok && data.success) {
                    showSuccess(data.message || 'WhatsApp test mesajı başarıyla gönderildi!')
                } else {
                    showError(data.message || data.error || 'WhatsApp test mesajı gönderilemedi')
                }
                return
            }

            const isHospital = channel === 'hospitalTelegram'
            const botToken = isHospital ? bioSettings.faultTelegramBotToken : bioSettings.telegramBotToken
            const chatId = isHospital ? bioSettings.faultTelegramChatId : bioSettings.telegramChatId

            const res = await fetch('/api/bug-reports/test-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: channel === 'email' ? 'email' : 'telegram',
                    botToken,
                    chatId,
                    targetEmail: bioSettings.supportAlertEmail
                })
            })
            const data = await res.json()
            if (res.ok && data.success) {
                showSuccess(data.message || 'Test bildirimi başarıyla gönderildi!')
            } else {
                showError(data.message || data.error || 'Test bildirimi gönderilemedi')
            }
        } catch {
            showError('Test bildirimi sırasında bağlantı hatası oluştu')
        } finally {
            setTestNotificationLoading(null)
        }
    }

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
        } catch {
            setDbTestResult({ success: false, error: 'Bağlantı testi yapılamadı' })
            showError('Bağlantı testi yapılamadı')
        } finally {
            setDbTestLoading(false)
        }
    }

    const saveEnvConfig = async () => {
        setEnvSaving(true)
        try {
            const databaseUrl = envConfig.password
                ? `postgresql://${envConfig.username}:${encodeURIComponent(envConfig.password)}@${envConfig.host}:${envConfig.port}/${envConfig.database}`
                : `postgresql://${envConfig.username}@${envConfig.host}:${envConfig.port}/${envConfig.database}`
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
        } catch {
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

    const updateLocalSetting = (key: string, value: boolean | string | number) => {
        const newSettings = { ...localSettings, [key]: value }
        setLocalSettings(newSettings)
        localStorage.setItem('appSettings_preferences', JSON.stringify({ ...newSettings, advancedSettings }))
        showSuccess('Ayar güncellendi')
    }

    const updateAdvancedSetting = (key: string, value: string | number | boolean) => {
        const newSettings = { ...advancedSettings, [key]: value }
        setAdvancedSettings(newSettings)
        const saved = localStorage.getItem('appSettings_preferences')
        const parsed = saved ? JSON.parse(saved) : {}
        parsed.advancedSettings = newSettings
        localStorage.setItem('appSettings_preferences', JSON.stringify(parsed))
        window.dispatchEvent(new Event('appearance-settings-updated'))

        // Persist server-backed appearance/pagination settings as well
        if (['itemsPerPage', 'fontSize', 'sidebarWidth'].includes(key)) {
            fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value })
            }).catch(() => {})
        }

        showSuccess('Ayar güncellendi')
    }

    const SUPERVISOR_MODULES = ['procurementEnabled', 'decommissioningEnabled', 'utsEnabled', 'complianceEnabled', 'trainingEnabled']

    const handleModuleToggle = (key: string) => {
        if (SUPERVISOR_MODULES.includes(key) && !isSupervisor) {
            showError('Bu modül kurumsal lisans ve yetki korumalıdır. Yalnızca Sistem Süpervizörü tarafından açılabilir/kapatılabilir.')
            return
        }
        setModuleSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof moduleSettings] }))
    }

    const saveTagFormat = async () => {
        setTagFormatSaving(true)
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceTagFormat })
            })
            if (res.ok) {
                showSuccess('Künye numarası formatı başarıyla güncellendi')
                await refreshSettings()
            } else {
                showError('Künye formatı kaydedilemedi')
            }
        } catch {
            showError('Bir hata oluştu')
        } finally {
            setTagFormatSaving(false)
        }
    }

    const saveModuleSettings = async () => {
        setModuleSettingsSaving(true)
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(moduleSettings)
            })

            const data = await res.json()
            if (res.ok) {
                showSuccess('Modül ayarları ve menü güncellendi')
                await refreshSettings()
                router.refresh()
            } else {
                throw new Error(data.error || 'Update failed')
            }
        } catch (error: any) {
            showError(error.message || 'Ayarlar kaydedilemedi')
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
            const res = await fetch('/api/users/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            })

            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                showSuccess('Şifreniz başarıyla değiştirildi')
                setIsPasswordModalOpen(false)
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
            } else {
                showError(data.error || 'Şifre değiştirilemedi')
            }
        } catch {
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

    const isEn = language === 'en'

    const tabs = [
        { id: 'general', label: isEn ? 'General & Info' : 'Genel & Künye', icon: Settings },
        { id: 'biomedical', label: isEn ? 'Biomedical & Tags' : 'Biyomedikal & Etiket', icon: QrCode },
        { id: 'definitions', label: isEn ? 'Depts & Categories' : 'Bölümler & Kategoriler', icon: Layers },
        { id: 'suppliers', label: isEn ? 'Suppliers & Service' : 'Tedarikçi & Servisler', icon: Truck },
        { id: 'appearance', label: isEn ? 'Appearance' : 'Görünüm', icon: Palette },
        { id: 'notifications', label: isEn ? 'Notifications' : 'Bildirimler', icon: Bell },
    ]

    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.email === 'admin@medisync.com'
    const isSupervisor = (session?.user as any)?.role === 'ADMIN' && (!(session?.user as any)?.hospitalId || session?.user?.email === 'admin@biomedicapp.com' || session?.user?.email === 'supervisor@medisync.com')

    if (isAdmin) {
        tabs.push(
            { id: 'modules', label: isEn ? 'Modules' : 'Modüller', icon: LayoutGrid },
            { id: 'security', label: isEn ? 'Security' : 'Güvenlik', icon: Shield },
            { id: 'database', label: isEn ? 'Backup & DB' : 'Yedekleme & DB', icon: Database },
            { id: 'config', label: isEn ? 'Server (.env)' : 'Sunucu (.env)', icon: Wrench },
            { id: 'system', label: isEn ? 'System Status' : 'Sistem Durumu', icon: Server }
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{isEn ? 'System Settings' : 'Sistem Ayarları'}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{isEn ? 'Enterprise biomedical configuration, tag standards, definitions and preferences' : 'Kurumsal biyomedikal yapılandırma, etiket standartları, tanımlar ve tercihler'}</p>
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

                {/* TAB 1: GENEL & KÜNYE */}
                {activeTab === 'general' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6 animate-fadeIn">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                                <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isEn ? 'General Settings' : 'Genel Ayarlar'}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SettingItem label={isEn ? "Application Name" : "Uygulama Adı"} value="MediSync" description={isEn ? "System display name" : "Sistemin görünen adı"} />
                            <SettingItem label={isEn ? "Version" : "Versiyon"} value="1.5.0" description={isEn ? "Current corporate release version" : "Mevcut kurumsal sürüm numarası"} />
                        </div>

                        <div className="border-t dark:border-gray-700 pt-4 space-y-4">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-2">{isEn ? 'Language and Region' : 'Dil ve Bölge'}</h3>

                            <SelectSetting
                                label={isEn ? "Language" : "Dil"}
                                value={language}
                                onChange={(val) => { setLanguage(val as any); showSuccess(val === 'en' ? 'Language switched to English' : 'Dil Türkçe olarak ayarlandı'); }}
                                options={[
                                    { value: 'tr', label: 'Türkçe' },
                                    { value: 'en', label: 'English' }
                                ]}
                                description={isEn ? "Application interface language" : "Uygulama arayüz dili"}
                            />

                            <SelectSetting
                                label={isEn ? "Timezone" : "Saat Dilimi"}
                                value={advancedSettings.timezone}
                                onChange={(val) => updateAdvancedSetting('timezone', val)}
                                options={[
                                    { value: 'Europe/Istanbul', label: 'İstanbul (GMT+3)' },
                                    { value: 'Europe/London', label: 'Londra (GMT+0)' },
                                    { value: 'America/New_York', label: 'New York (GMT-5)' },
                                    { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' }
                                ]}
                                description={isEn ? "Timezone configuration" : "Zaman dilimi ayarı"}
                            />

                            <SelectSetting
                                label="Tarih Formatı"
                                value={advancedSettings.dateFormat}
                                onChange={(val) => updateAdvancedSetting('dateFormat', val)}
                                options={[
                                    { value: 'DD/MM/YYYY', label: 'GG/AA/YYYY (31/12/2026)' },
                                    { value: 'MM/DD/YYYY', label: 'AA/GG/YYYY (12/31/2026)' },
                                    { value: 'YYYY-MM-DD', label: 'YYYY-AA-GG (2026-12-31)' },
                                    { value: 'DD.MM.YYYY', label: 'GG.AA.YYYY (31.12.2026)' }
                                ]}
                                description="Tarih gösterim formatı"
                            />
                        </div>

                        {/* Künye & Barkod Numaralandırma Formatı */}
                        <div className="border-t dark:border-gray-700 pt-5 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center space-x-2">
                                    <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Biyomedikal Künye & Barkod Formatı</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={saveTagFormat}
                                    disabled={tagFormatSaving}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                                >
                                    {tagFormatSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    <span>Formatı Kaydet</span>
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Sistemde yeni bir tıbbi cihaz eklendiğinde veya toplu içe aktarıldığında cihaz künye ve barkod numaralarının hangi kurala göre otomatik atanacağını belirleyin.
                            </p>

                            {/* Hazır Şablonlar */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                                    Hızlı Şablonlar (Örnek Formatlar)
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {[
                                        { label: 'Sağlık Bakanlığı Standart', format: 'KUNYE-{YYYY}-{SEQ}', desc: 'KUNYE-2026-0001' },
                                        { label: 'Kurum Kodlu Standart', format: '{HOSP}-{YYYY}-{SEQ}', desc: 'PARK-2026-0001' },
                                        { label: 'Biyomedikal Ön Ekli', format: 'BM-{YYYY}-{SEQ}', desc: 'BM-2026-0001' },
                                        { label: 'Tarih & Ay Detaylı', format: 'TAG-{YYYY}-{MM}-{SEQ}', desc: 'TAG-2026-10-0001' },
                                        { label: 'Kısa Kurum + Sıra', format: '{HOSP}-{SEQ}', desc: 'PARK-0001' },
                                        { label: '5 Haneli Geniş Sıra', format: 'KUNYE-{YYYY}-{SEQ:5}', desc: 'KUNYE-2026-00001' },
                                    ].map((preset) => (
                                        <button
                                            key={preset.format}
                                            type="button"
                                            onClick={() => setDeviceTagFormat(preset.format)}
                                            className={`p-2.5 text-left border rounded-lg transition-all text-xs ${
                                                deviceTagFormat === preset.format
                                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20 font-semibold'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            <div className="font-medium truncate">{preset.label}</div>
                                            <div className="font-mono text-gray-500 dark:text-gray-400 mt-0.5">{preset.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Format Giriş Alanı */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Özel Format Şablonu
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={deviceTagFormat}
                                        onChange={(e) => setDeviceTagFormat(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                        placeholder="KUNYE-{YYYY}-{SEQ}"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setDeviceTagFormat('KUNYE-{YYYY}-{SEQ}')}
                                        className="px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        title="Varsayılana Sıfırla"
                                    >
                                        Sıfırla
                                    </button>
                                </div>
                            </div>

                            {/* Değişken Butonları (Chips) */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                                    Kullanılabilir Dinamik Değişkenler (Tıklayarak Ekleyin)
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { tag: '{YYYY}', desc: '4 Haneli Yıl' },
                                        { tag: '{YY}', desc: '2 Haneli Yıl' },
                                        { tag: '{MM}', desc: '2 Haneli Ay' },
                                        { tag: '{DD}', desc: 'Gün' },
                                        { tag: '{HOSP}', desc: 'Kurum Kodu' },
                                        { tag: '{SEQ}', desc: '4 Haneli Sıra (0001)' },
                                        { tag: '{SEQ:5}', desc: '5 Haneli Sıra (00001)' },
                                        { tag: '{SEQ:6}', desc: '6 Haneli Sıra (000001)' },
                                    ].map((item) => (
                                        <button
                                            key={item.tag}
                                            type="button"
                                            onClick={() => setDeviceTagFormat(prev => prev + item.tag)}
                                            className="px-2.5 py-1 bg-gray-100 hover:bg-blue-100 dark:bg-gray-700 dark:hover:bg-blue-900/40 text-gray-800 dark:text-gray-200 rounded-md font-mono text-xs transition-colors border border-gray-200 dark:border-gray-600"
                                            title={item.desc}
                                        >
                                            <span className="font-bold text-blue-600 dark:text-blue-400">{item.tag}</span>
                                            <span className="text-[10px] text-gray-500 ml-1">({item.desc})</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Canlı Önizleme Kartı */}
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                                        Canlı Künye Önizlemesi (Gelecek Cihaz)
                                    </div>
                                    <div className="text-xl font-bold font-mono text-blue-900 dark:text-blue-100 mt-1">
                                        {deviceTagFormat
                                            .replace(/\{YYYY\}/gi, new Date().getFullYear().toString())
                                            .replace(/\{YY\}/gi, new Date().getFullYear().toString().substring(2))
                                            .replace(/\{MM\}/gi, (new Date().getMonth() + 1).toString().padStart(2, '0'))
                                            .replace(/\{DD\}/gi, new Date().getDate().toString().padStart(2, '0'))
                                            .replace(/\{HOSP\}|\{KURUM\}|\{CODE\}/gi, activeHospital?.code || 'PARK')
                                            .replace(/\{SEQ:(\d+)\}/gi, (_, len) => '1'.padStart(parseInt(len, 10) || 4, '0'))
                                            .replace(/\{SEQ\}/gi, '0001')}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Aktif Kurum ({activeHospital?.name || 'Hastane'}) için otomatik üretilecek künye etiketi
                                    </p>
                                </div>
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-blue-100 dark:border-blue-900">
                                    <Tag className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>

                            {/* Toplu Yeniden Künyeleme Aksiyonu */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                                <div className="space-y-0.5">
                                    <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                        <RefreshCw className="w-4 h-4 text-amber-600" />
                                        Mevcut Cihazların Künyelerini Güncelle
                                    </div>
                                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                                        Formatı değiştirdiğinizde daha önce kayıtlı cihazların künye numaralarını bu formata göre sırayla yeniden adlandırır.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleBulkRetag}
                                    disabled={retagLoading}
                                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                                >
                                    {retagLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                    <span>Tümünü Bu Formata Dönüştür</span>
                                </button>
                            </div>
                        </div>

                        {/* Lisans Bilgileri */}
                        <LicenseInfoSection showSuccess={showSuccess} showError={showError} isAdmin={isAdmin} />
                    </div>
                )}

                {/* TAB 2: BİYOMEDİKAL & ETİKET AYARLARI */}
                {activeTab === 'biomedical' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-8 animate-fadeIn">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                            <div className="flex items-center space-x-3">
                                <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-lg">
                                    <QrCode className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Biyomedikal Operasyon & QR Etiket Ayarları</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Termal yazıcı etiket şablonunu, kalibrasyon/bakım uyarı eşiklerini ve varsayılan periyotları özelleştirin
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={saveBioSettings}
                                disabled={bioSaving}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
                            >
                                {bioSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Ayarları Kaydet
                            </button>
                        </div>

                        {/* QR Etiket ve Termal Yazıcı Ayarları */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                            <div className="lg:col-span-2 space-y-4">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <QrCode className="w-5 h-5 text-blue-600" />
                                    Termal & A4 QR Künye Etiketi Özelleştirme
                                </h3>

                                <TextSetting
                                    label="QR Etiket Üst Başlığı (Kurum / Birim Adı)"
                                    value={bioSettings.labelHeaderText}
                                    onChange={(val) => setBioSettings(prev => ({ ...prev, labelHeaderText: val }))}
                                    description="Basılan tüm 50x30mm, 40x20mm ve A4 QR etiketlerinin en üstünde yer alacak resmi başlık"
                                    placeholder="Örn: ÖZEL PARKHAYAT BİYOMEDİKAL"
                                />

                                <SelectSetting
                                    label="Varsayılan Yazıcı & Etiket Boyutu"
                                    value={bioSettings.defaultLabelFormat}
                                    onChange={(val) => setBioSettings(prev => ({ ...prev, defaultLabelFormat: val as any }))}
                                    options={[
                                        { value: 'tze-24mm', label: 'Brother TZe 24mm Dikey — (Fotoğraftaki Standart: 24 x 50 mm)' },
                                        { value: 'tze-32mm', label: 'Brother TZe 32/36mm Dikey — (Geniş Şerit: 32 x 65 mm)' },
                                        { value: 'tze-18mm', label: 'Brother TZe 18mm Dikey — (Dar Şerit: 18 x 42 mm)' },
                                        { value: 'tze-24mm-horizontal', label: 'Brother TZe 24mm Yatay — (60 x 24 mm)' },
                                        { value: 'thermal-50x30', label: 'Termal Rulo Etiket — (50 x 30 mm Zebra / TSC)' },
                                        { value: 'thermal-80x50', label: 'Büyük Termal Etiket — (80 x 50 mm)' },
                                        { value: 'standard', label: 'Standart A4 Sayfa — (Cihaz Künye Kartı)' }
                                    ]}
                                    description="Cihaz listesinde 'QR Kod' butonuna tıklandığında otomatik seçili gelecek yazdırma formatı"
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <ToggleSetting
                                        label="Etikette Seri Numarası Göster"
                                        description="QR etiketin altında SN bilgisini yazdır"
                                        enabled={bioSettings.showSerialOnLabel}
                                        onChange={(val) => setBioSettings(prev => ({ ...prev, showSerialOnLabel: val }))}
                                    />
                                    <ToggleSetting
                                        label="Etikette Bölüm / Klinik Göster"
                                        description="Cihazın bulunduğu lokasyonu etikette yazdır"
                                        enabled={bioSettings.showLocationOnLabel}
                                        onChange={(val) => setBioSettings(prev => ({ ...prev, showLocationOnLabel: val }))}
                                    />
                                </div>
                            </div>

                            {/* Canlı Termal / Brother TZe Etiket Önizleme Kutusu */}
                            <div className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col items-center">
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                                    Canlı Etiket Önizlemesi ({
                                        bioSettings.defaultLabelFormat === 'tze-24mm' ? 'Brother TZe 24mm Dikey' :
                                        bioSettings.defaultLabelFormat === 'tze-32mm' ? 'Brother TZe 32mm Dikey' :
                                        bioSettings.defaultLabelFormat === 'tze-18mm' ? 'Brother TZe 18mm Dikey' :
                                        bioSettings.defaultLabelFormat === 'tze-24mm-horizontal' ? 'Brother TZe 24mm Yatay' :
                                        bioSettings.defaultLabelFormat === 'thermal-80x50' ? 'Termal 80x50mm' :
                                        bioSettings.defaultLabelFormat === 'standard' ? 'A4 Kart' : 'Termal 50x30mm'
                                    })
                                </span>

                                {bioSettings.defaultLabelFormat === 'tze-24mm' || bioSettings.defaultLabelFormat === 'tze-32mm' || bioSettings.defaultLabelFormat === 'tze-18mm' ? (
                                    /* FOTOĞRAFTAKİ BİREBİR DİKEY BROTHER TZE ŞERİT ÖNİZLEMESİ */
                                    <div className="w-[170px] bg-white text-black border-2 border-black rounded shadow-md p-3 font-sans text-center flex flex-col items-center">
                                        <div className="w-28 h-28 border border-gray-300 rounded flex items-center justify-center bg-white p-1">
                                            <QrCode className="w-24 h-24 text-black" />
                                        </div>
                                        <div className="w-full mt-2">
                                            <div className="text-[10px] font-bold text-black truncate">
                                                {bioSettings.labelHeaderText || activeHospital?.name || 'Özel PARKHAYAT Hastanesi'}
                                            </div>
                                            <div className="text-[10px] font-extrabold uppercase text-black truncate mt-0.5">
                                                THERMOHYGROMETRE
                                            </div>
                                            <div className="text-sm font-black font-mono tracking-wider text-black my-1">
                                                BH000204
                                            </div>
                                            <div className="text-[9px] font-semibold text-gray-800 truncate">
                                                2.Kat Kadın Doğum Servisi
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* DİĞER FORMATLAR İÇİN ÖNİZLEME */
                                    <div className="w-full max-w-[260px] bg-white text-black border-2 border-black rounded-lg p-3 shadow-md font-sans">
                                        <div className="text-[10px] font-extrabold text-center border-b-2 border-black pb-1 mb-2 uppercase tracking-wider truncate">
                                            {bioSettings.labelHeaderText || 'Özel PARKHAYAT Hastanesi'}
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-16 h-16 border border-gray-300 rounded flex items-center justify-center bg-gray-50 shrink-0">
                                                <QrCode className="w-12 h-12 text-black" />
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="text-[11px] font-extrabold leading-tight truncate">HASTA BAŞI MONİTÖRÜ</div>
                                                <div className="text-[9px] text-gray-700 font-semibold truncate mt-0.5">Philips • IntelliVue MX450</div>
                                                <div className="inline-block mt-1 px-1.5 py-0.5 bg-gray-100 border border-black rounded text-[9px] font-mono font-black">
                                                    BH000204
                                                </div>
                                                {bioSettings.showSerialOnLabel && (
                                                    <div className="text-[8px] font-bold text-gray-700 mt-0.5 truncate">
                                                        SN: DE84920194
                                                    </div>
                                                )}
                                                {bioSettings.showLocationOnLabel && (
                                                    <div className="text-[8px] font-bold text-gray-700 truncate">
                                                        Bölüm: Yoğun Bakım
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Alarm & Periyot Eşikleri */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amber-500" />
                                Biyomedikal Alarm Eşikleri & Varsayılan Periyotlar
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Genel Bakış (Dashboard) ekranındaki kritik uyarıların kaç gün önceden devreye gireceğini ve yeni cihaz/kalibrasyon kayıtlarında otomatik atanacak varsayılan süreleri belirleyin.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <NumberSetting
                                    label="Kalibrasyon Uyarı Eşiği (Gün)"
                                    value={bioSettings.calibrationAlertDays}
                                    onChange={(val) => setBioSettings(prev => ({ ...prev, calibrationAlertDays: val }))}
                                    min={1}
                                    max={180}
                                    step={5}
                                    description="Kalibrasyon bitimine kaç gün kala Dashboard'da uyarı verilsin?"
                                />
                                <NumberSetting
                                    label="Periyodik Bakım Uyarı Eşiği (Gün)"
                                    value={bioSettings.maintenanceAlertDays}
                                    onChange={(val) => setBioSettings(prev => ({ ...prev, maintenanceAlertDays: val }))}
                                    min={1}
                                    max={180}
                                    step={5}
                                    description="Planlı bakıma kaç gün kala hatırlatma gösterilsin?"
                                />
                                <NumberSetting
                                    label="Garanti Bitiş Uyarı Eşiği (Gün)"
                                    value={bioSettings.warrantyAlertDays}
                                    onChange={(val) => setBioSettings(prev => ({ ...prev, warrantyAlertDays: val }))}
                                    min={7}
                                    max={365}
                                    step={15}
                                    description="Garanti süresinin dolmasına kaç gün kala uyarı verilsin?"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <NumberSetting
                                    label="Varsayılan Bakım Periyodu (Gün)"
                                    value={bioSettings.defaultMaintenanceInterval}
                                    onChange={(val) => setBioSettings(prev => ({ ...prev, defaultMaintenanceInterval: val }))}
                                    min={30}
                                    max={730}
                                    step={30}
                                    description="Yeni cihaz eklenirken otomatik gelen bakım aralığı (Örn: 180 gün = 6 ay)"
                                />
                                <NumberSetting
                                    label="Varsayılan Kalibrasyon Periyodu (Gün)"
                                    value={bioSettings.defaultCalibrationInterval}
                                    onChange={(val) => setBioSettings(prev => ({ ...prev, defaultCalibrationInterval: val }))}
                                    min={30}
                                    max={1095}
                                    step={30}
                                    description="Yeni kalibrasyon kaydında otomatik geçerlilik süresi (Örn: 365 gün = 1 yıl)"
                                />
                                <NumberSetting
                                    label="Kritik Arıza Hedef Müdahale / SLA (Saat)"
                                    value={bioSettings.criticalSlaHours}
                                    onChange={(val) => setBioSettings(prev => ({ ...prev, criticalSlaHours: val }))}
                                    min={1}
                                    max={72}
                                    step={1}
                                    description="Kritik/Acil arıza bildirimlerinde hedeflenen ilk müdahale süresi"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <TextSetting
                                    label="Acil Biyomedikal Nöbetçi / Dahili Telefon"
                                    value={bioSettings.emergencyPhone}
                                    onChange={(val) => setBioSettings(prev => ({ ...prev, emergencyPhone: val }))}
                                    description="Klinik personelin kullandığı 'Hızlı Arıza Bildir' ekranında üst bilgi olarak gösterilir"
                                    placeholder="Örn: Dahili 4455 veya 0532 XXX XX XX"
                                />
                                <TextSetting
                                    label="Resmi Rapor & Form Alt Başlığı"
                                    value={bioSettings.reportHeaderTitle}
                                    onChange={(val) => setBioSettings(prev => ({ ...prev, reportHeaderTitle: val }))}
                                    description="Servis formları ve çıktı raporlarında yer alacak birim unvanı"
                                    placeholder="Örn: BİYOMEDİKAL MÜHENDİSLİK BİRİMİ"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: BÖLÜMLER & KATEGORİLER YÖNETİMİ */}
                {activeTab === 'definitions' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                        {/* Hastane Bölümleri / Birimler */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-5">
                            <div className="flex items-center space-x-3">
                                <div className="bg-emerald-100 dark:bg-emerald-900/40 p-3 rounded-lg">
                                    <MapPin className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Hastane Bölümleri & Klinikler</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Cihazların konumlandırıldığı klinikleri, yoğun bakımları ve katları yönetin
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSaveLocation} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                                <div className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                    {editingLocation ? `Bölümü Düzenle: ${editingLocation.name}` : 'Yeni Bölüm / Klinik Ekle'}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <input
                                        type="text"
                                        required
                                        value={newLocationName}
                                        onChange={(e) => setNewLocationName(e.target.value)}
                                        placeholder="Bölüm Adı (Örn: Koroner Yoğun Bakım)"
                                        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                    <input
                                        type="text"
                                        value={newLocationDesc}
                                        onChange={(e) => setNewLocationDesc(e.target.value)}
                                        placeholder="Açıklama / Kat / Blok (İsteğe bağlı)"
                                        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    {editingLocation && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingLocation(null)
                                                setNewLocationName('')
                                                setNewLocationDesc('')
                                            }}
                                            className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg"
                                        >
                                            İptal
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        {editingLocation ? 'Güncelle' : 'Bölüm Ekle'}
                                    </button>
                                </div>
                            </form>

                            {defsLoading ? (
                                <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[420px] overflow-y-auto pr-1">
                                    {locations.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-6">Henüz kayıtlı bölüm bulunmuyor.</p>
                                    ) : (
                                        locations.map((loc) => (
                                            <div key={loc.id} className="py-3 flex items-center justify-between gap-2">
                                                <div>
                                                    <div className="font-medium text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                                        <span>{loc.name}</span>
                                                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                            {loc._count?.devices ?? 0} cihaz
                                                        </span>
                                                    </div>
                                                    {loc.description && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{loc.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingLocation(loc)
                                                            setNewLocationName(loc.name)
                                                            setNewLocationDesc(loc.description || '')
                                                        }}
                                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                        title="Düzenle"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteLocation(loc.id, loc.name)}
                                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                        title="Sil"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Cihaz Kategorileri */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-5">
                            <div className="flex items-center space-x-3">
                                <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg">
                                    <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tıbbi Cihaz Kategorileri</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Envanterdeki cihaz gruplarını (Görüntüleme, Yaşam Destek, Laboratuvar vb.) yönetin
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSaveCategory} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                                <div className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                    {editingCategory ? `Kategoriyi Düzenle: ${editingCategory.name}` : 'Yeni Cihaz Kategorisi Ekle'}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <input
                                        type="text"
                                        required
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="Kategori Adı (Örn: Sterilizasyon Cihazları)"
                                        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                    <input
                                        type="text"
                                        value={newCategoryDesc}
                                        onChange={(e) => setNewCategoryDesc(e.target.value)}
                                        placeholder="Açıklama (İsteğe bağlı)"
                                        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    {editingCategory && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingCategory(null)
                                                setNewCategoryName('')
                                                setNewCategoryDesc('')
                                            }}
                                            className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg"
                                        >
                                            İptal
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        {editingCategory ? 'Güncelle' : 'Kategori Ekle'}
                                    </button>
                                </div>
                            </form>

                            {defsLoading ? (
                                <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[420px] overflow-y-auto pr-1">
                                    {categories.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-6">Henüz kayıtlı kategori bulunmuyor.</p>
                                    ) : (
                                        categories.map((cat) => (
                                            <div key={cat.id} className="py-3 flex items-center justify-between gap-2">
                                                <div>
                                                    <div className="font-medium text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                                        <span>{cat.name}</span>
                                                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                                            {cat._count?.devices ?? 0} cihaz
                                                        </span>
                                                    </div>
                                                    {cat.description && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{cat.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingCategory(cat)
                                                            setNewCategoryName(cat.name)
                                                            setNewCategoryDesc(cat.description || '')
                                                        }}
                                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                        title="Düzenle"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                        title="Sil"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 4: TEDARİKÇİ & YETKİLİ SERVİS FİRMALARI */}
                {activeTab === 'suppliers' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6 animate-fadeIn">
                        <div className="flex items-center space-x-3">
                            <div className="bg-amber-100 dark:bg-amber-900/40 p-3 rounded-lg">
                                <Truck className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tedarikçi & Yetkili Servis Firmaları</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Cihaz satın alınan, bakım sözleşmesi yapılan veya dış servis hizmeti alınan firmaları yönetin
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveSupplier} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                            <div className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                {supplierForm.id ? 'Firma Bilgilerini Güncelle' : 'Yeni Tedarikçi / Yetkili Servis Firması Ekle'}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                <input
                                    type="text"
                                    required
                                    value={supplierForm.name}
                                    onChange={(e) => setSupplierForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Firma Unvanı / Adı *"
                                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                                <input
                                    type="text"
                                    value={supplierForm.contactName}
                                    onChange={(e) => setSupplierForm(prev => ({ ...prev, contactName: e.target.value }))}
                                    placeholder="Yetkili Kişi Adı Soyadı"
                                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                                <input
                                    type="text"
                                    value={supplierForm.phone}
                                    onChange={(e) => setSupplierForm(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="Telefon Numarası"
                                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                                <input
                                    type="email"
                                    value={supplierForm.email}
                                    onChange={(e) => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="E-posta Adresi"
                                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                                <input
                                    type="text"
                                    value={supplierForm.address}
                                    onChange={(e) => setSupplierForm(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="Adres / Şehir"
                                    className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                {supplierForm.id && (
                                    <button
                                        type="button"
                                        onClick={() => setSupplierForm({ id: '', name: '', contactName: '', phone: '', email: '', address: '' })}
                                        className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg"
                                    >
                                        İptal
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={supplierSaving}
                                    className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                >
                                    {supplierSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {supplierForm.id ? 'Değişiklikleri Kaydet' : 'Firma Ekle'}
                                </button>
                            </div>
                        </form>

                        {suppliersLoading ? (
                            <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th className="px-4 py-3">Firma Adı</th>
                                            <th className="px-4 py-3">Yetkili Kişi</th>
                                            <th className="px-4 py-3">İletişim</th>
                                            <th className="px-4 py-3">Kayıtlı Cihaz / Sözleşme</th>
                                            <th className="px-4 py-3 text-right">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {suppliers.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                    Henüz kayıtlı tedarikçi veya yetkili servis firması bulunmuyor.
                                                </td>
                                            </tr>
                                        ) : (
                                            suppliers.map((sup) => (
                                                <tr key={sup.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                        <div>{sup.name}</div>
                                                        {sup.address && <div className="text-xs text-gray-500">{sup.address}</div>}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                        {sup.contactName || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                        {sup.phone && <div className="flex items-center gap-1 text-xs"><Phone className="w-3 h-3" /> {sup.phone}</div>}
                                                        {sup.email && <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">{sup.email}</div>}
                                                        {!sup.phone && !sup.email && '-'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                                {sup._count?.devices ?? 0} Cihaz
                                                            </span>
                                                            <span className="px-2 py-0.5 text-xs rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                                                {sup._count?.contracts ?? 0} Sözleşme
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="inline-flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => setSupplierForm({
                                                                    id: sup.id,
                                                                    name: sup.name || '',
                                                                    contactName: sup.contactName || '',
                                                                    phone: sup.phone || '',
                                                                    email: sup.email || '',
                                                                    address: sup.address || ''
                                                                })}
                                                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                                                                title="Düzenle"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteSupplier(sup.id, sup.name)}
                                                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                                                title="Sil"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 5: GÖRÜNÜM */}
                {activeTab === 'appearance' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4 animate-fadeIn">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                                <Palette className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Görünüm ve Tablo Ayarları</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">Karanlık Mod</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Koyu renk teması kullan</p>
                                </div>
                                <button onClick={handleThemeToggle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform absolute ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <ToggleSetting
                                label="Kompakt Görünüm"
                                description="Tablolarda ve listelerde daha sıkı satır aralığı kullan"
                                enabled={compactView}
                                onChange={(val) => { setCompactView(val); showSuccess('Görünüm güncellendi'); }}
                            />

                            <ToggleSetting
                                label="Arayüz Animasyonları"
                                description="Sayfa ve pencere geçiş animasyonlarını göster"
                                enabled={animations}
                                onChange={(val) => { setAnimations(val); showSuccess('Animasyonlar güncellendi'); }}
                            />

                            <SelectSetting
                                label="Yazı Boyutu"
                                value={advancedSettings.fontSize}
                                onChange={(val) => updateAdvancedSetting('fontSize', val)}
                                options={[
                                    { value: 'small', label: 'Küçük (Yoğun Ekranlar)' },
                                    { value: 'medium', label: 'Orta (Standart)' },
                                    { value: 'large', label: 'Büyük (Kolay Okuma)' }
                                ]}
                                description="Uygulama genelindeki metin boyutu"
                            />

                            <SelectSetting
                                label="Sol Menü (Sidebar) Genişliği"
                                value={advancedSettings.sidebarWidth}
                                onChange={(val) => updateAdvancedSetting('sidebarWidth', val)}
                                options={[
                                    { value: 'narrow', label: 'Dar (224px)' },
                                    { value: 'normal', label: 'Normal (256px)' },
                                    { value: 'wide', label: 'Geniş (288px)' }
                                ]}
                                description="Sol navigasyon menüsünün genişliği"
                            />

                            <NumberSetting
                                label="Tablolarda Sayfa Başına Cihaz Sayısı"
                                value={advancedSettings.itemsPerPage}
                                onChange={(val) => updateAdvancedSetting('itemsPerPage', val)}
                                min={10}
                                max={100}
                                step={10}
                                description="Cihaz Envanteri tablosunda her sayfada listelenecek kayıt sayısı"
                            />
                        </div>
                    </div>
                )}

                {/* TAB 6: BİLDİRİMLER */}
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
                                label="Uygulama İçi Bildirim Merkezi"
                                description="Üst bardaki çan ikonunda anlık arıza ve bakım bildirimlerini göster"
                                enabled={advancedSettings.enableInAppNotifications}
                                onChange={(val) => updateAdvancedSetting('enableInAppNotifications', val)}
                                icon={<MessageSquare className="w-4 h-4" />}
                            />

                            <ToggleSetting
                                label="Tarayıcı Push Bildirimleri"
                                description="Masaüstü tarayıcı bildirimlerini etkinleştir"
                                enabled={advancedSettings.enablePushNotifications}
                                onChange={(val) => updateAdvancedSetting('enablePushNotifications', val)}
                                icon={<Bell className="w-4 h-4" />}
                            />

                            <ToggleSetting
                                label="E-posta Bildirimleri"
                                description="Kritik arıza ve kalibrasyon uyarılarında e-posta gönder"
                                enabled={advancedSettings.enableEmailNotifications}
                                onChange={(val) => updateAdvancedSetting('enableEmailNotifications', val)}
                                icon={<Mail className="w-4 h-4" />}
                            />

                            <div className="border-t dark:border-gray-700 pt-4">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Biyomedikal Uyarı Tercihleri</h3>

                                <ToggleSetting
                                    label="Periyodik Bakım Hatırlatıcıları"
                                    description="Yaklaşan ve geciken bakımlar için uyarı oluştur"
                                    enabled={localSettings.maintenanceReminders}
                                    onChange={(val) => updateLocalSetting('maintenanceReminders', val)}
                                />

                                <ToggleSetting
                                    label="Kalibrasyon Süresi Uyarıları"
                                    description="Kalibrasyon geçerlilik tarihi yaklaşan cihazlar için uyarı"
                                    enabled={localSettings.calibrationAlerts}
                                    onChange={(val) => updateLocalSetting('calibrationAlerts', val)}
                                />

                                <ToggleSetting
                                    label="Garanti ve Sözleşme Bitiş Uyarıları"
                                    description="Garanti veya servis sözleşmesi dolmak üzere olan cihazlar için uyarı"
                                    enabled={localSettings.warrantyAlerts}
                                    onChange={(val) => updateLocalSetting('warrantyAlerts', val)}
                                />

                                <ToggleSetting
                                    label="Bildirim Sesi"
                                    description="Yeni arıza bildirimi geldiğinde sesli uyarı çal"
                                    enabled={advancedSettings.notificationSound}
                                    onChange={(val) => updateAdvancedSetting('notificationSound', val)}
                                    icon={advancedSettings.notificationSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                />
                            </div>

                            {/* Yazılım Hatası & Canlı Çökme Bildirim Kanalları (Telegram & E-Posta) */}
                            <div className="border-t dark:border-gray-700 pt-6 space-y-5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-4 rounded-xl border border-blue-200 dark:border-blue-900">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-sm">
                                            <Bug className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                                Yazılım Hatası & Canlı Çökme Alarm Kanalları
                                            </h3>
                                            <p className="text-xs text-gray-600 dark:text-gray-300">
                                                Kullanıcıların veya arayüzün karşılaştığı hata, çökme ve ekran görüntülü arıza raporlarını anında cebinize ve e-postanıza iletir.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={saveBioSettings}
                                        disabled={bioSaving}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
                                    >
                                        {bioSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Değişiklikleri Kaydet
                                    </button>
                                </div>

                                {/* 1. Hastane İçi Cihaz Arıza & Bakım Telegram Bildirimleri (Teknisyen Ekibi İçin Ayrı) */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-amber-500 text-white rounded-lg">
                                                <Wrench className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">Hastane Cihaz Arıza & İş Emri Telegram Bildirimleri</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Klinik çalışanları QR kod okutup arıza bildirdiğinde veya teknik servis bakım kaydı açıldığında hastanenin biyomedikal grubuna anında mesaj gönderir.
                                                </p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={bioSettings.faultTelegramAlertsEnabled}
                                                onChange={(e) => setBioSettings(prev => ({ ...prev, faultTelegramAlertsEnabled: e.target.checked }))}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                        </label>
                                    </div>

                                    {bioSettings.faultTelegramAlertsEnabled && (
                                        <div className="space-y-3 pt-2">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                        Hastane Telegram Bot Token
                                                    </label>
                                                    <input
                                                        type="password"
                                                        value={bioSettings.faultTelegramBotToken}
                                                        onChange={(e) => setBioSettings(prev => ({ ...prev, faultTelegramBotToken: e.target.value }))}
                                                        placeholder="Örn: 1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                        Hastane Teknisyen Grubu / Chat ID
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={bioSettings.faultTelegramChatId}
                                                        onChange={(e) => setBioSettings(prev => ({ ...prev, faultTelegramChatId: e.target.value }))}
                                                        placeholder="Örn: -100123456789 (Grup ID) veya Kullanıcı ID"
                                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg text-xs text-amber-900 dark:text-amber-200">
                                                <div className="space-y-0.5">
                                                    <span className="font-semibold block">Teknisyen / Biyomedikal Grubu Kurulumu:</span>
                                                    <span>1. Telegram'da hastane biyomedikal ekibiniz için bir grup açın ve botunuzu gruba ekleyin.</span>
                                                    <span className="block">2. Botu gruba yönetici yapıp grubun Chat ID'sini (örn: <code>-100...</code>) girin.</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleTestNotification('hospitalTelegram')}
                                                    disabled={testNotificationLoading === 'hospitalTelegram' || !bioSettings.faultTelegramBotToken || !bioSettings.faultTelegramChatId}
                                                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                                                >
                                                    {testNotificationLoading === 'hospitalTelegram' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                                    Hastane Grubuna Test Gönder
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 1.1 Hastane İçi Teknisyen & Mühendis WhatsApp Bildirimleri */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-sm">
                                                <Smartphone className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">Hastane Teknisyen & Mühendis WhatsApp Bildirimleri</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Arıza ve bakım bildirimlerini nöbetçi biyomedikal personeline veya WhatsApp grubuna anlık olarak WhatsApp mesajı olarak iletir.
                                                </p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={bioSettings.whatsappAlertsEnabled}
                                                onChange={(e) => setBioSettings(prev => ({ ...prev, whatsappAlertsEnabled: e.target.checked }))}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                        </label>
                                    </div>

                                    {bioSettings.whatsappAlertsEnabled && (
                                        <div className="space-y-3 pt-2">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                        WhatsApp Sağlayıcısı / Entegrasyon
                                                    </label>
                                                    <select
                                                        value={bioSettings.whatsappProvider}
                                                        onChange={(e) => setBioSettings(prev => ({ ...prev, whatsappProvider: e.target.value as any }))}
                                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                                    >
                                                        <option value="ultramsg">UltraMsg (Önerilen - Kolay API)</option>
                                                        <option value="greenapi">Green API</option>
                                                        <option value="generic_webhook">Özel Webhook / HTTP API</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                        Hedef WhatsApp No / Grup ID
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={bioSettings.whatsappPhoneNumber}
                                                        onChange={(e) => setBioSettings(prev => ({ ...prev, whatsappPhoneNumber: e.target.value }))}
                                                        placeholder="Örn: 905321234567 veya 120363...@g.us"
                                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                        API Token / Instance Token
                                                    </label>
                                                    <input
                                                        type="password"
                                                        value={bioSettings.whatsappToken}
                                                        onChange={(e) => setBioSettings(prev => ({ ...prev, whatsappToken: e.target.value }))}
                                                        placeholder="API Token veya Gizli Anahtar"
                                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                    Özel API / Webhook URL <span className="font-normal text-gray-500">(UltraMsg varsayılanı için boş bırakılabilir)</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={bioSettings.whatsappApiUrl}
                                                    onChange={(e) => setBioSettings(prev => ({ ...prev, whatsappApiUrl: e.target.value }))}
                                                    placeholder="https://api.ultramsg.com/instanceXXXXX/messages/chat"
                                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                                />
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg text-xs text-emerald-900 dark:text-emerald-200">
                                                <div className="space-y-0.5">
                                                    <span className="font-semibold block">WhatsApp Bildirim Modeli:</span>
                                                    <span>UltraMsg, GreenAPI veya kendi yerel WhatsApp gateway sunucunuz üzerinden nöbetçi personele ya da Biyomedikal WhatsApp grubuna anlık bildirim gider.</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleTestNotification('whatsapp')}
                                                    disabled={testNotificationLoading === 'whatsapp' || !bioSettings.whatsappPhoneNumber || (!bioSettings.whatsappToken && !bioSettings.whatsappApiUrl)}
                                                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                                                >
                                                    {testNotificationLoading === 'whatsapp' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                                    WhatsApp Test Gönder
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 2. Yazılım Hatası & Geliştirici Destek Kanalı (Serdar Alp Ürer) */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-sky-500 text-white rounded-lg">
                                                <Send className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">Yazılım Hatası & Geliştirici Bildirim Kanalı (Özel)</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Programdaki yazılım arızaları, ekran hataları ve yeni kurulum aktivasyon istekleri doğrudan sistem geliştiricisine iletilir.
                                                </p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={bioSettings.telegramBugAlertsEnabled}
                                                onChange={(e) => setBioSettings(prev => ({ ...prev, telegramBugAlertsEnabled: e.target.checked }))}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                                        </label>
                                    </div>

                                    {bioSettings.telegramBugAlertsEnabled && (
                                        <div className="space-y-3 pt-2">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                        Geliştirici Bot Token (Gizli / Sabit)
                                                    </label>
                                                    <input
                                                        type="password"
                                                        value={bioSettings.telegramBotToken}
                                                        onChange={(e) => setBioSettings(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                                                        placeholder="8295345493:AAEP8VLR9BU6b8xxsa0x3NeAlLLVR_vzJ8c"
                                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                        Geliştirici Chat ID
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={bioSettings.telegramChatId}
                                                        onChange={(e) => setBioSettings(prev => ({ ...prev, telegramChatId: e.target.value }))}
                                                        placeholder="1539699467"
                                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none font-mono"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 rounded-lg text-xs text-sky-900 dark:text-sky-200">
                                                <div className="space-y-0.5">
                                                    <span className="font-semibold block">Geliştirici Hattı:</span>
                                                    <span>Sistem çökme logları ve kurulum onay istekleri bu kanala yönlendirilir.</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleTestNotification('telegram')}
                                                    disabled={testNotificationLoading === 'telegram' || !bioSettings.telegramBotToken || !bioSettings.telegramChatId}
                                                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                                                >
                                                    {testNotificationLoading === 'telegram' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                                    Geliştiriciye Test Gönder
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* E-Posta Destek Bildirimi */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-indigo-500 text-white rounded-lg">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">E-Posta Hata & Arıza Raporu</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Kritik sistem çökmeleri ve kullanıcı hata bildirimlerini sorumlu geliştirici e-postasına iletir.
                                                </p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={bioSettings.emailBugAlertsEnabled}
                                                onChange={(e) => setBioSettings(prev => ({ ...prev, emailBugAlertsEnabled: e.target.checked }))}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>

                                    {bioSettings.emailBugAlertsEnabled && (
                                        <div className="space-y-3 pt-2">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                    Bildirimin Gideceği E-Posta Adresi
                                                </label>
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <input
                                                        type="email"
                                                        value={bioSettings.supportAlertEmail}
                                                        onChange={(e) => setBioSettings(prev => ({ ...prev, supportAlertEmail: e.target.value }))}
                                                        placeholder="Örn: yazilim.destek@hastane.com"
                                                        className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                    <button
                                                        onClick={() => handleTestNotification('email')}
                                                        disabled={testNotificationLoading === 'email' || !bioSettings.supportAlertEmail}
                                                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
                                                    >
                                                        {testNotificationLoading === 'email' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                                                        E-Posta Test Gönder
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    * E-postaların başarıyla ulaşması için sistem SMTP ayarlarının yapılandırılmış olması gerekir.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 7: GÜVENLİK */}
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
                                label="Oturum Zaman Aşımı"
                                description="Belirli süre işlem yapılmayan oturumları otomatik sonlandır"
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
                                label="Maksimum Başarısız Giriş Denemesi"
                                value={advancedSettings.maxLoginAttempts}
                                onChange={(val) => updateAdvancedSetting('maxLoginAttempts', val)}
                                min={3}
                                max={10}
                                description="Geçici kilitleme öncesi izin verilen deneme sayısı"
                            />

                            <ToggleSetting
                                label="Denetim Günlüğü (Audit Log)"
                                description="Kullanıcıların yaptığı kritik veri değişikliklerini kayıt altına al"
                                enabled={advancedSettings.enableAuditLog}
                                onChange={(val) => updateAdvancedSetting('enableAuditLog', val)}
                            />

                            <div className="pt-4 border-t dark:border-gray-700">
                                <button
                                    onClick={() => setIsPasswordModalOpen(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Hesap Şifremi Değiştir
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 8: VERİTABANI & YEDEKLEME */}
                {activeTab === 'database' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4 animate-fadeIn">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                                <Database className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Veritabanı & Yedekleme Yönetimi</h2>
                        </div>

                        <div className="space-y-4">
                            <SettingItem label="Veritabanı Motoru" value="PostgreSQL" description="Kurumsal ilişkisel veritabanı sunucusu" />

                            <div className="pt-4 border-t dark:border-gray-700">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Anlık Yedekleme ve Geri Yükleme</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                    Tüm hastane, cihaz, bakım, kalibrasyon ve sözleşme verilerinizi tek tıkla JSON formatında bilgisayarınıza indirebilir veya daha önce alınan bir yedeği geri yükleyebilirsiniz.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleBackup}
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                        Veritabanını Yedekle (.json)
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
                                                        const reader = new FileReader()
                                                        reader.onload = async () => {
                                                            const base64 = (reader.result as string).split(',')[1]
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
                                                        }
                                                        reader.onerror = () => {
                                                            showError('Dosya okunamadı')
                                                            setIsLoading(false)
                                                        }
                                                        reader.readAsDataURL(file)
                                                        return
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
                                        Yedekten Geri Yükle
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
                                    <AlertTriangle className="w-4 h-4" /> Tehlikeli Bölge (Fabrika Ayarlarına Sıfırlama)
                                </h4>
                                <p className="text-sm text-red-600 dark:text-red-400 mt-1 mb-3">
                                    Bu işlem mevcut cihaz, bakım ve kalibrasyon kayıtlarını temizleyerek sistemi sıfırlar. İşlem öncesinde otomatik güvenlik yedeği alınır.
                                </p>
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

                {/* TAB 9: MODÜLLER */}
                {activeTab === 'modules' && isAdmin && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-fadeIn">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/10">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                                    <LayoutGrid className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Modül Yönetimi</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Hastanenizin ihtiyaçlarına göre sol menüde görünecek aktif modülleri seçin.</p>
                                </div>
                            </div>
                        </div>

                        {moduleSettingsLoading ? (
                            <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
                        ) : (
                            <div className="p-6 divide-y divide-gray-100 dark:divide-gray-700">
                                {[
                                    { key: 'maintenanceEnabled', label: 'Arıza & Bakım Yönetimi', desc: 'Periyodik bakımlar, arıza takibi ve bakım takvimi' },
                                    { key: 'calibrationEnabled', label: 'Kalibrasyon Takibi', desc: 'Sertifika, ölçüm belirsizliği ve kalibrasyon yönetimi' },
                                    { key: 'contractsEnabled', label: 'Servis Sözleşmeleri', desc: 'Yıllık bakım ve hizmet sözleşmeleri takibi' },
                                    { key: 'reportsEnabled', label: 'Maliyet & Analitik Raporlar', desc: 'İstatistik, TCO ve performans analiz ekranları' },
                                    { key: 'procurementEnabled', label: 'Kabul & Muayene (Satınalma)', desc: 'Yeni cihaz kabul, kurulum ve muayene komisyonu', supervisorOnly: true },
                                    { key: 'decommissioningEnabled', label: 'HEK / Hurda Süreci', desc: 'Cihaz kullanım dışı bırakma ve hurdaya ayırma işlemleri', supervisorOnly: true },
                                    { key: 'utsEnabled', label: 'ÜTS Bildirimleri', desc: 'Sağlık Bakanlığı Ürün Takip Sistemi sorgulama ve bildirim', supervisorOnly: true },
                                    { key: 'complianceEnabled', label: 'Denetim & Uyumluluk (SKS)', desc: 'SKS denetim bulguları, DÖF (CAPA) ve advers olay takibi', supervisorOnly: true },
                                    { key: 'trainingEnabled', label: 'Personel & Eğitim Yönetimi', desc: 'Biyomedikal personel ve kullanıcı cihaz eğitimleri', supervisorOnly: true },
                                    { key: 'branchesEnabled', label: 'Şubeler & Birimler', desc: 'Çoklu hastane ve kampüs yönetimi' },
                                ].map((item) => {
                                    const isLocked = item.supervisorOnly && !isSupervisor
                                    return (
                                        <div key={item.key} className={`flex items-center justify-between py-4 first:pt-0 last:pb-0 ${isLocked ? 'opacity-80' : ''}`}>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                    {item.label}
                                                    {item.supervisorOnly && (
                                                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${isSupervisor ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                                                            <Lock className="w-3 h-3" />
                                                            {isSupervisor ? 'Süpervizör Yetkisi' : 'Yalnızca Süpervizör Açabilir'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {item.desc}
                                                    {isLocked && (
                                                        <span className="block text-xs text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                                                            🔒 Bu modül lisans/yetki korumalıdır. Yalnızca Sistem Süpervizörü tarafından açılabilir.
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <label className={`relative inline-flex items-center ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`} title={isLocked ? 'Bu modülü yalnızca Sistem Süpervizörü açabilir' : undefined}>
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    disabled={isLocked}
                                                    checked={moduleSettings[item.key as keyof typeof moduleSettings]}
                                                    onChange={() => handleModuleToggle(item.key)}
                                                />
                                                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${isLocked ? 'opacity-50 cursor-not-allowed peer-checked:bg-gray-400' : 'peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:bg-blue-600'}`}></div>
                                            </label>
                                        </div>
                                    )
                                })}
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

                {/* TAB 10: SİSTEM DURUMU */}
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
                                <SettingItem label="Uygulama Sürümü" value="MediSync v1.5.0" description="Kurumsal On-Premise Sürüm" />
                                <SettingItem label="Platform" value={String(systemInfo.platform || 'N/A')} description="İşletim sistemi" />
                                <SettingItem label="Ekran Çözünürlüğü" value={String(systemInfo.screenResolution || 'N/A')} description="Görüntü çözünürlüğü" />
                                <SettingItem label="Dil" value={String(systemInfo.language || 'N/A')} description="Tarayıcı dili" />
                                <SettingItem label="Ağ Bağlantısı" value={systemInfo.online ? 'Aktif (Çevrimiçi)' : 'Çevrimdışı'} description="Yerel ağ / internet durumu" />
                                <SettingItem label="Oturum Çerezleri" value={systemInfo.cookieEnabled ? 'Aktif' : 'Pasif'} description="Cookie durumu" />
                            </div>
                        )}

                        <div className="border-t dark:border-gray-700 pt-4">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Servis Durumu</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        <span className="text-sm font-medium text-green-800 dark:text-green-300">Web Sunucu</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">Aktif</p>
                                </div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Veritabanı</span>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">Bağlı</p>
                                </div>
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <HardDriveIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                        <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Depolama</span>
                                    </div>
                                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">Hazır</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 11: SUNUCU YAPILANDIRMASI (.ENV) */}
                {activeTab === 'config' && isAdmin && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6 animate-fadeIn">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-lg">
                                <Wrench className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sunucu & Veritabanı Yapılandırması (.env)</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">On-Premise hastane sunucusu bağlantı parametrelerini yönetin</p>
                            </div>
                        </div>

                        {envLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        <Database className="w-5 h-5 text-blue-500" />
                                        PostgreSQL Veritabanı Bağlantısı
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Sunucu Adresi (Host)
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

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={testDbConnection}
                                            disabled={dbTestLoading || !envConfig.host || !envConfig.database || !envConfig.username}
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

                                <div className="border-t dark:border-gray-700 pt-6 space-y-4">
                                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-green-500" />
                                        Ağ & Oturum Ayarları
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Uygulama Erişim URL&apos;i (NEXTAUTH_URL)
                                        </label>
                                        <input
                                            type="text"
                                            value={envConfig.nextAuthUrl}
                                            onChange={(e) => setEnvConfig(prev => ({ ...prev, nextAuthUrl: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                            placeholder="http://192.168.1.100:3000"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Hastane yerel ağında (LAN) diğer bilgisayar ve telefonların erişeceği sabit sunucu IP adresi (Örn: http://192.168.1.50:3000)
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Güvenlik Anahtarı (NEXTAUTH_SECRET)
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
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={saveEnvConfig}
                                        disabled={envSaving || !envConfig.host || !envConfig.database || !envConfig.username || envConfig.nextAuthSecret.length < 32}
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
    const { language } = useTheme()
    const isEn = language === 'en'
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
                <p className="font-medium text-gray-900 dark:text-white">{isEn ? translateText(label, 'en') : label}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{isEn ? translateText(description, 'en') : description}</p>
            </div>
            <div className="text-right"><p className="font-semibold text-gray-900 dark:text-white">{isEn ? translateText(value, 'en') : value}</p></div>
        </div>
    )
}

function ToggleSetting({ label, description, enabled, onChange, icon }: { label: string; description: string; enabled: boolean; onChange: (val: boolean) => void; icon?: React.ReactNode }) {
    const { language } = useTheme()
    const isEn = language === 'en'
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex-1 flex items-center gap-3">
                {icon && <div className="text-gray-500 dark:text-gray-400">{icon}</div>}
                <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{isEn ? translateText(label, 'en') : label}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{isEn ? translateText(description, 'en') : description}</p>
                </div>
            </div>
            <button type="button" onClick={() => onChange(!enabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    )
}

function SelectSetting({ label, value, onChange, options, description }: { label: string; value: string; onChange: (val: string) => void; options: Array<{ value: string; label: string }>; description: string }) {
    const { language } = useTheme()
    const isEn = language === 'en'
    return (
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isEn ? translateText(label, 'en') : label}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{isEn ? translateText(description, 'en') : description}</p>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{isEn ? translateText(opt.label, 'en') : opt.label}</option>
                ))}
            </select>
        </div>
    )
}

function NumberSetting({ label, value, onChange, min, max, step = 1, description }: { label: string; value: number; onChange: (val: number) => void; min: number; max: number; step?: number; description: string }) {
    const { language } = useTheme()
    const isEn = language === 'en'
    return (
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isEn ? translateText(label, 'en') : label}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{isEn ? translateText(description, 'en') : description}</p>
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
    const { language } = useTheme()
    const isEn = language === 'en'
    return (
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isEn ? translateText(label, 'en') : label}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{isEn ? translateText(description, 'en') : description}</p>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={isEn && placeholder ? translateText(placeholder, 'en') : placeholder}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
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
        } catch {
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
                refreshGlobalLicense()
            } else {
                showError(data.message || 'Lisans aktive edilemedi')
            }
        } catch {
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
        if (!licenseInfo.isActive) return 'text-red-600 bg-red-100 dark:bg-red-900/30'
        return 'text-green-600 bg-green-100 dark:bg-green-900/30'
    }

    const getStatusLabel = () => {
        if (!licenseInfo.isActive) return 'Onay Bekliyor / Kilitli'
        return '✅ Aktif & Onaylı (Sınırsız Açık Kaynak)'
    }

    return (
        <div className="border-t dark:border-gray-700 pt-4 space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Kurulum & Lisans Aktivasyon Durumu
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/60 rounded-xl border border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold uppercase tracking-wider">Sistem Aktivasyonu</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor()}`}>
                        {getStatusLabel()}
                    </span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                        Bu sunucu donanım kimliğiyle yetkilendirilmiş ve tam yetkiyle çalışmaktadır.
                    </p>
                </div>

                {licenseInfo.deviceFingerprint && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/60 rounded-xl border border-gray-200 dark:border-gray-600">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold uppercase tracking-wider">Donanım Kimliği (HWID)</p>
                        <div className="flex items-center gap-2">
                            <code className="text-base font-bold font-mono text-blue-600 dark:text-blue-400 break-all flex-1 tracking-wider">
                                {licenseInfo.deviceFingerprint}
                            </code>
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(licenseInfo.deviceFingerprint || '')
                                    showSuccess('HWID kopyalandı')
                                }}
                                className="px-2.5 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-md transition-colors text-xs font-semibold flex items-center gap-1"
                                title="Kopyala"
                            >
                                <Copy className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                                <span>Kopyala</span>
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1.5">Geliştiriciden onay kodu talep ederken bu kimliği kullanın</p>
                    </div>
                )}
            </div>

            {licenseInfo.licenseKey && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/60 rounded-xl border border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold uppercase tracking-wider">Aktif Lisans / Onay Anahtarı</p>
                    <code className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200 break-all bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 inline-block">
                        {licenseInfo.licenseKey}
                    </code>
                </div>
            )}

            {isAdmin && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2">
                    <p className="font-semibold text-xs text-blue-900 dark:text-blue-200 uppercase tracking-wider">Yeni Aktivasyon Kodu Tanımla</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Bu sunucuya yeni bir aktivasyon veya onay anahtarı girmek için kullanın:</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newLicenseKey}
                            onChange={(e) => setNewLicenseKey(e.target.value)}
                            placeholder="MEDISYNC-ACTIVE-XXXXXXXX-XXXXXXXX"
                            className="flex-1 px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-xs uppercase focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="button"
                            onClick={handleActivateLicense}
                            disabled={isActivating || !newLicenseKey.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                        >
                            {isActivating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Key className="w-3.5 h-3.5" />
                            )}
                            Kaydet
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
