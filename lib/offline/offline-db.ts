/**
 * MediSync Offline Database
 * IndexedDB wrapper for offline data storage and sync queue
 */

const DB_NAME = 'medisync-offline';
const DB_VERSION = 1;

// Store names
export const STORES = {
    DEVICES: 'devices',
    MAINTENANCE: 'maintenance',
    CALIBRATION: 'calibration',
    LOCATIONS: 'locations',
    CATEGORIES: 'categories',
    HOSPITALS: 'hospitals',
    WORK_ORDERS: 'work-orders',
    PENDING_OPERATIONS: 'pending-operations',
    SYNC_META: 'sync-meta'
} as const;

export interface PendingOperation {
    id: string;
    timestamp: number;
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    headers: Record<string, string>;
    body: string;
    entityType: string;
    entityId?: string;
    retryCount: number;
}

export interface SyncMeta {
    storeName: string;
    lastSyncTime: number;
    itemCount: number;
}

class OfflineDB {
    private db: IDBDatabase | null = null;
    private dbPromise: Promise<IDBDatabase> | null = null;

    async open(): Promise<IDBDatabase> {
        if (this.db) return this.db;
        if (this.dbPromise) return this.dbPromise;

        this.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('[OfflineDB] Failed to open database:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('[OfflineDB] Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                console.log('[OfflineDB] Upgrading database schema...');

                // Create object stores
                if (!db.objectStoreNames.contains(STORES.DEVICES)) {
                    const deviceStore = db.createObjectStore(STORES.DEVICES, { keyPath: 'id' });
                    deviceStore.createIndex('tagNumber', 'tagNumber', { unique: true });
                    deviceStore.createIndex('hospitalId', 'hospitalId', { unique: false });
                    deviceStore.createIndex('status', 'status', { unique: false });
                }

                if (!db.objectStoreNames.contains(STORES.MAINTENANCE)) {
                    const maintenanceStore = db.createObjectStore(STORES.MAINTENANCE, { keyPath: 'id' });
                    maintenanceStore.createIndex('deviceId', 'deviceId', { unique: false });
                    maintenanceStore.createIndex('status', 'status', { unique: false });
                    maintenanceStore.createIndex('scheduledDate', 'scheduledDate', { unique: false });
                }

                if (!db.objectStoreNames.contains(STORES.CALIBRATION)) {
                    const calibrationStore = db.createObjectStore(STORES.CALIBRATION, { keyPath: 'id' });
                    calibrationStore.createIndex('deviceId', 'deviceId', { unique: false });
                    calibrationStore.createIndex('status', 'status', { unique: false });
                    calibrationStore.createIndex('scheduledDate', 'scheduledDate', { unique: false });
                }

                if (!db.objectStoreNames.contains(STORES.LOCATIONS)) {
                    db.createObjectStore(STORES.LOCATIONS, { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
                    db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains(STORES.HOSPITALS)) {
                    db.createObjectStore(STORES.HOSPITALS, { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains(STORES.WORK_ORDERS)) {
                    const workOrderStore = db.createObjectStore(STORES.WORK_ORDERS, { keyPath: 'id' });
                    workOrderStore.createIndex('deviceId', 'deviceId', { unique: false });
                    workOrderStore.createIndex('status', 'status', { unique: false });
                }

                if (!db.objectStoreNames.contains(STORES.PENDING_OPERATIONS)) {
                    const pendingStore = db.createObjectStore(STORES.PENDING_OPERATIONS, { keyPath: 'id' });
                    pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
                    pendingStore.createIndex('entityType', 'entityType', { unique: false });
                }

                if (!db.objectStoreNames.contains(STORES.SYNC_META)) {
                    db.createObjectStore(STORES.SYNC_META, { keyPath: 'storeName' });
                }

                console.log('[OfflineDB] Database schema upgraded');
            };
        });

        return this.dbPromise;
    }

    // Generic CRUD operations
    async getAll<T>(storeName: string): Promise<T[]> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || []);
        });
    }

    async get<T>(storeName: string, id: string): Promise<T | undefined> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async put<T>(storeName: string, item: T): Promise<void> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(item);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async putAll<T>(storeName: string, items: T[]): Promise<void> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);

            items.forEach(item => store.put(item));

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async delete(storeName: string, id: string): Promise<void> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async clear(storeName: string): Promise<void> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.clear();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async getByIndex<T>(storeName: string, indexName: string, value: IDBValidKey): Promise<T[]> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || []);
        });
    }

    // Pending Operations Queue
    async addPendingOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
        const id = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const fullOperation: PendingOperation = {
            ...operation,
            id,
            timestamp: Date.now(),
            retryCount: 0
        };
        await this.put(STORES.PENDING_OPERATIONS, fullOperation);
        return id;
    }

    async getPendingOperations(): Promise<PendingOperation[]> {
        return this.getAll<PendingOperation>(STORES.PENDING_OPERATIONS);
    }

    async removePendingOperation(id: string): Promise<void> {
        return this.delete(STORES.PENDING_OPERATIONS, id);
    }

    async incrementRetryCount(id: string): Promise<void> {
        const op = await this.get<PendingOperation>(STORES.PENDING_OPERATIONS, id);
        if (op) {
            op.retryCount++;
            await this.put(STORES.PENDING_OPERATIONS, op);
        }
    }

    // Sync Meta
    async updateSyncMeta(storeName: string, itemCount: number): Promise<void> {
        const meta: SyncMeta = {
            storeName,
            lastSyncTime: Date.now(),
            itemCount
        };
        await this.put(STORES.SYNC_META, meta);
    }

    async getSyncMeta(storeName: string): Promise<SyncMeta | undefined> {
        return this.get<SyncMeta>(STORES.SYNC_META, storeName);
    }

    async getAllSyncMeta(): Promise<SyncMeta[]> {
        return this.getAll<SyncMeta>(STORES.SYNC_META);
    }

    // Count items in store
    async count(storeName: string): Promise<number> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.count();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }
}

// Singleton instance
export const offlineDB = new OfflineDB();
