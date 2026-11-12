/**
 * MediSync Sync Manager
 * Handles online/offline state and data synchronization
 */

import { offlineDB, STORES, PendingOperation } from './offline-db';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

interface SyncListener {
    onStatusChange?: (status: SyncStatus) => void;
    onSyncComplete?: (result: SyncResult) => void;
    onOnlineStatusChange?: (isOnline: boolean) => void;
}

interface SyncResult {
    success: boolean;
    synced: number;
    failed: number;
    errors: string[];
}

class SyncManager {
    private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
    private status: SyncStatus = 'idle';
    private listeners: Set<SyncListener> = new Set();
    private syncInProgress: boolean = false;

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.handleOnline());
            window.addEventListener('offline', () => this.handleOffline());

            // Listen for SW sync messages
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data?.type === 'SYNC_COMPLETE') {
                        this.notifyListeners('onSyncComplete', {
                            success: true,
                            synced: event.data.count,
                            failed: 0,
                            errors: []
                        });
                    }
                });
            }
        }
    }

    // Public API
    getStatus(): SyncStatus {
        return this.status;
    }

    isNetworkOnline(): boolean {
        return this.isOnline;
    }

    addListener(listener: SyncListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    // Sync all data from server to IndexedDB
    async syncFromServer(): Promise<SyncResult> {
        if (!this.isOnline || this.syncInProgress) {
            return { success: false, synced: 0, failed: 0, errors: ['Offline or sync in progress'] };
        }

        this.syncInProgress = true;
        this.setStatus('syncing');

        const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] };

        try {
            // Sync devices
            await this.syncStore('/api/devices', STORES.DEVICES, result);
            // Sync maintenance records
            await this.syncStore('/api/maintenance', STORES.MAINTENANCE, result);
            // Sync calibration records  
            await this.syncStore('/api/calibration', STORES.CALIBRATION, result);
            // Sync locations
            await this.syncStore('/api/locations', STORES.LOCATIONS, result);
            // Sync categories
            await this.syncStore('/api/categories', STORES.CATEGORIES, result);
            // Sync work orders
            await this.syncStore('/api/work-orders', STORES.WORK_ORDERS, result);

            result.success = result.failed === 0;
            this.setStatus('idle');
        } catch (error) {
            result.success = false;
            result.errors.push(error instanceof Error ? error.message : 'Unknown error');
            this.setStatus('error');
        } finally {
            this.syncInProgress = false;
            this.notifyListeners('onSyncComplete', result);
        }

        return result;
    }

    // Sync pending operations to server
    async syncToServer(): Promise<SyncResult> {
        if (!this.isOnline || this.syncInProgress) {
            return { success: false, synced: 0, failed: 0, errors: ['Offline or sync in progress'] };
        }

        this.syncInProgress = true;
        this.setStatus('syncing');

        const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] };

        try {
            const pendingOps = await offlineDB.getPendingOperations();

            for (const op of pendingOps) {
                try {
                    const response = await fetch(op.url, {
                        method: op.method,
                        headers: JSON.parse(JSON.stringify(op.headers)),
                        body: op.body
                    });

                    if (response.ok) {
                        await offlineDB.removePendingOperation(op.id);
                        result.synced++;
                    } else {
                        await offlineDB.incrementRetryCount(op.id);
                        result.failed++;
                        result.errors.push(`Failed: ${op.method} ${op.url}`);
                    }
                } catch (error) {
                    await offlineDB.incrementRetryCount(op.id);
                    result.failed++;
                    result.errors.push(`Error: ${op.method} ${op.url}`);
                }
            }

            result.success = result.failed === 0;
            this.setStatus('idle');
        } catch (error) {
            result.success = false;
            result.errors.push(error instanceof Error ? error.message : 'Unknown error');
            this.setStatus('error');
        } finally {
            this.syncInProgress = false;
            this.notifyListeners('onSyncComplete', result);
        }

        return result;
    }

    // Queue an operation for later sync
    async queueOperation(
        method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
        url: string,
        body: any,
        entityType: string,
        entityId?: string
    ): Promise<string> {
        const opId = await offlineDB.addPendingOperation({
            method,
            url,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            entityType,
            entityId
        });

        // Try to register background sync
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await (registration as any).sync.register('sync-pending-operations');
            } catch (error) {
                console.warn('[SyncManager] Background sync registration failed:', error);
            }
        }

        return opId;
    }

    // Get pending operations count
    async getPendingCount(): Promise<number> {
        return offlineDB.count(STORES.PENDING_OPERATIONS);
    }

    // Request background sync (for manual trigger)
    async requestBackgroundSync(): Promise<void> {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            const registration = await navigator.serviceWorker.ready;
            await (registration as any).sync.register('sync-pending-operations');
        } else {
            // Fallback: direct sync
            await this.syncToServer();
        }
    }

    // Private methods
    private async syncStore(apiUrl: string, storeName: string, result: SyncResult): Promise<void> {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${apiUrl}`);
            }

            const data = await response.json();
            const items = Array.isArray(data) ? data : (data.data || data.items || []);

            await offlineDB.clear(storeName);
            await offlineDB.putAll(storeName, items);
            await offlineDB.updateSyncMeta(storeName, items.length);

            result.synced += items.length;
            console.log(`[SyncManager] Synced ${items.length} items to ${storeName}`);
        } catch (error) {
            result.failed++;
            result.errors.push(`Failed to sync ${storeName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.error(`[SyncManager] Failed to sync ${storeName}:`, error);
        }
    }

    private handleOnline(): void {
        console.log('[SyncManager] Network online');
        this.isOnline = true;
        this.notifyListeners('onOnlineStatusChange', true);

        // Auto-sync when back online
        this.syncToServer().then(() => this.syncFromServer());
    }

    private handleOffline(): void {
        console.log('[SyncManager] Network offline');
        this.isOnline = false;
        this.setStatus('offline');
        this.notifyListeners('onOnlineStatusChange', false);
    }

    private setStatus(status: SyncStatus): void {
        this.status = status;
        this.notifyListeners('onStatusChange', status);
    }

    private notifyListeners<K extends keyof SyncListener>(
        event: K,
        data: Parameters<NonNullable<SyncListener[K]>>[0]
    ): void {
        this.listeners.forEach(listener => {
            const handler = listener[event];
            if (handler) {
                (handler as any)(data);
            }
        });
    }
}

// Singleton instance
export const syncManager = new SyncManager();
