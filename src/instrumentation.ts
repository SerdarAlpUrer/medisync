export async function register() {
    // Only run on server side
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { initBackupScheduler } = await import('@/lib/backup-scheduler')

        // Initialize backup scheduler
        try {
            await initBackupScheduler()
            console.log('[Instrumentation] Backup scheduler initialized')
        } catch (error) {
            console.error('[Instrumentation] Failed to initialize backup scheduler:', error)
        }
    }
}
