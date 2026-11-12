import { prisma } from './prisma'
import { exportDatabaseToJson } from './database-utils'
import { writeFile, mkdir, readdir, unlink, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

let backupInterval: ReturnType<typeof setInterval> | null = null
let isBackupRunning = false

const BACKUP_DIR = join(process.cwd(), 'backups')

// Initialize backup scheduler
export async function initBackupScheduler() {
    // Ensure backup directory exists
    if (!existsSync(BACKUP_DIR)) {
        await mkdir(BACKUP_DIR, { recursive: true })
    }

    // Check settings and start scheduler
    await checkAndStartScheduler()

    // Re-check settings every hour
    setInterval(checkAndStartScheduler, 60 * 60 * 1000)

    console.log('[BackupScheduler] Initialized')
}

async function checkAndStartScheduler() {
    try {
        const settings = await prisma.appSettings.findFirst()

        if (!settings) {
            stopScheduler()
            return
        }

        // Check if auto backup is enabled
        const backupAuto = (settings as any).backupAuto ?? false
        const backupSchedule = (settings as any).backupSchedule ?? 'daily'

        if (!backupAuto) {
            stopScheduler()
            console.log('[BackupScheduler] Auto backup disabled')
            return
        }

        // Calculate interval based on schedule
        let intervalMs: number
        switch (backupSchedule) {
            case 'daily':
                intervalMs = 24 * 60 * 60 * 1000 // 24 hours
                break
            case 'weekly':
                intervalMs = 7 * 24 * 60 * 60 * 1000 // 7 days
                break
            case 'monthly':
                intervalMs = 30 * 24 * 60 * 60 * 1000 // 30 days
                break
            default:
                intervalMs = 24 * 60 * 60 * 1000
        }

        // Start/restart scheduler
        stopScheduler()
        backupInterval = setInterval(performBackup, intervalMs)

        console.log(`[BackupScheduler] Started with ${backupSchedule} schedule`)

        // Check if we need to run backup now (if last backup is older than interval)
        await checkLastBackupAndRunIfNeeded(intervalMs)

    } catch (error) {
        console.error('[BackupScheduler] Error checking settings:', error)
    }
}

function stopScheduler() {
    if (backupInterval) {
        clearInterval(backupInterval)
        backupInterval = null
    }
}

async function checkLastBackupAndRunIfNeeded(intervalMs: number) {
    try {
        if (!existsSync(BACKUP_DIR)) return

        const files = await readdir(BACKUP_DIR)
        const backupFiles = files.filter(f => f.startsWith('auto-backup-') && f.endsWith('.json'))

        if (backupFiles.length === 0) {
            // No backups exist, run one now
            await performBackup()
            return
        }

        // Find latest backup
        let latestTime = 0
        for (const file of backupFiles) {
            const filePath = join(BACKUP_DIR, file)
            const stats = await stat(filePath)
            if (stats.mtimeMs > latestTime) {
                latestTime = stats.mtimeMs
            }
        }

        // If last backup is older than interval, run now
        if (Date.now() - latestTime > intervalMs) {
            await performBackup()
        }

    } catch (error) {
        console.error('[BackupScheduler] Error checking last backup:', error)
    }
}

async function performBackup() {
    if (isBackupRunning) {
        console.log('[BackupScheduler] Backup already in progress, skipping')
        return
    }

    isBackupRunning = true

    try {
        console.log('[BackupScheduler] Starting automatic backup...')

        const backupData = await exportDatabaseToJson()
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = `auto-backup-${timestamp}.json`
        const filepath = join(BACKUP_DIR, filename)

        await writeFile(filepath, JSON.stringify(backupData, null, 2))

        console.log(`[BackupScheduler] Backup completed: ${filename}`)

        // Clean old backups (keep last N based on retention setting)
        await cleanOldBackups()

    } catch (error) {
        console.error('[BackupScheduler] Backup failed:', error)
    } finally {
        isBackupRunning = false
    }
}

async function cleanOldBackups() {
    try {
        const settings = await prisma.appSettings.findFirst()
        const retentionDays = (settings as any)?.backupRetention ?? 30

        const files = await readdir(BACKUP_DIR)
        const backupFiles = files.filter(f => f.startsWith('auto-backup-') && f.endsWith('.json'))

        const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000)

        for (const file of backupFiles) {
            const filePath = join(BACKUP_DIR, file)
            const stats = await stat(filePath)

            if (stats.mtimeMs < cutoffTime) {
                await unlink(filePath)
                console.log(`[BackupScheduler] Deleted old backup: ${file}`)
            }
        }

    } catch (error) {
        console.error('[BackupScheduler] Error cleaning old backups:', error)
    }
}

// Manual trigger for immediate backup
export async function triggerManualBackup() {
    await performBackup()
}

// Get backup status
export function getBackupStatus() {
    return {
        isRunning: isBackupRunning,
        isSchedulerActive: backupInterval !== null
    }
}
