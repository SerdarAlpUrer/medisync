import fs from 'fs'
import path from 'path'

export interface ExtendedSystemSettings {
    labelHeaderText: string
    defaultLabelFormat: 'tze-24mm' | 'tze-32mm' | 'tze-18mm' | 'tze-24mm-horizontal' | 'thermal-50x30' | 'thermal-80x50' | 'standard'
    showSerialOnLabel: boolean
    showLocationOnLabel: boolean
    calibrationAlertDays: number
    maintenanceAlertDays: number
    warrantyAlertDays: number
    defaultMaintenanceInterval: number
    defaultCalibrationInterval: number
    criticalSlaHours: number
    itemsPerPage: number
    fontSize: 'small' | 'medium' | 'large'
    sidebarWidth: 'narrow' | 'normal' | 'wide'
    emergencyPhone: string
    reportHeaderTitle: string
    // Yazılım Hata ve Destek Bildirim Ayarları (Geliştirici Kanalı)
    telegramBugAlertsEnabled: boolean
    telegramBotToken: string
    telegramChatId: string
    emailBugAlertsEnabled: boolean
    supportAlertEmail: string
    // Hastane İçi Cihaz Arıza & Bakım Bildirim Ayarları (Ayrı Biyomedikal / Teknisyen Kanalı)
    faultTelegramAlertsEnabled: boolean
    faultTelegramBotToken: string
    faultTelegramChatId: string
    // Hastane İçi Teknisyen & Mühendis WhatsApp Bildirim Ayarları
    whatsappAlertsEnabled: boolean
    whatsappProvider: 'ultramsg' | 'generic_webhook' | 'greenapi'
    whatsappApiUrl: string
    whatsappToken: string
    whatsappPhoneNumber: string
}

export const DEFAULT_EXTENDED_SETTINGS: ExtendedSystemSettings = {
    labelHeaderText: 'Özel PARKHAYAT Hastanesi',
    defaultLabelFormat: 'tze-24mm',
    showSerialOnLabel: true,
    showLocationOnLabel: true,
    calibrationAlertDays: 30,
    maintenanceAlertDays: 15,
    warrantyAlertDays: 30,
    defaultMaintenanceInterval: 180,
    defaultCalibrationInterval: 365,
    criticalSlaHours: 4,
    itemsPerPage: 10,
    fontSize: 'medium',
    sidebarWidth: 'normal',
    emergencyPhone: 'Dahili: 1122',
    reportHeaderTitle: 'Biyomedikal Mühendisliği Hizmetleri Birimi',
    telegramBugAlertsEnabled: true,
    telegramBotToken: '',
    telegramChatId: '',
    emailBugAlertsEnabled: true,
    supportAlertEmail: 'admin@parkhayat.com',
    faultTelegramAlertsEnabled: true,
    faultTelegramBotToken: '',
    faultTelegramChatId: '',
    whatsappAlertsEnabled: false,
    whatsappProvider: 'ultramsg',
    whatsappApiUrl: '',
    whatsappToken: '',
    whatsappPhoneNumber: '',
}

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'backups', 'extended-settings.json')

export function getExtendedSettings(): ExtendedSystemSettings {
    try {
        if (fs.existsSync(SETTINGS_FILE_PATH)) {
            const raw = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8')
            const parsed = JSON.parse(raw)
            return { ...DEFAULT_EXTENDED_SETTINGS, ...parsed }
        }
    } catch (error) {
        console.warn('Could not read extended-settings.json, using defaults:', error)
    }
    return { ...DEFAULT_EXTENDED_SETTINGS }
}

export function saveExtendedSettings(partial: Partial<ExtendedSystemSettings>): ExtendedSystemSettings {
    try {
        const dir = path.dirname(SETTINGS_FILE_PATH)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        const current = getExtendedSettings()
        const updated = { ...current, ...partial }
        fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8')
        return updated
    } catch (error) {
        console.error('Could not save extended-settings.json:', error)
        return { ...DEFAULT_EXTENDED_SETTINGS, ...partial }
    }
}
