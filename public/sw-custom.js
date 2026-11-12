/**
 * MediSync Custom Service Worker
 * Handles: Push Notifications, Background Sync, Offline Caching
 */

// Push Notification Handler
self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);

    let data = {
        title: 'MediSync Bildirimi',
        body: 'Yeni bir bildiriminiz var',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { url: '/dashboard' }
    };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            console.error('[SW] Error parsing push data:', e);
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        badge: data.badge || '/icon-192.png',
        vibrate: [100, 50, 100],
        data: data.data || { url: '/dashboard' },
        actions: [
            { action: 'open', title: 'Aç' },
            { action: 'dismiss', title: 'Kapat' }
        ],
        tag: data.tag || 'medisync-notification',
        renotify: true
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);

    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    const urlToOpen = event.notification.data?.url || '/dashboard';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                // Open new window if none exists
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Background Sync Handler
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-pending-operations') {
        event.waitUntil(syncPendingOperations());
    }
});

// Sync pending operations from IndexedDB
async function syncPendingOperations() {
    try {
        const db = await openDatabase();
        const pendingOps = await getAllPendingOperations(db);

        console.log('[SW] Syncing', pendingOps.length, 'pending operations');

        for (const op of pendingOps) {
            try {
                const response = await fetch(op.url, {
                    method: op.method,
                    headers: op.headers,
                    body: op.body
                });

                if (response.ok) {
                    await removePendingOperation(db, op.id);
                    console.log('[SW] Synced operation:', op.id);
                }
            } catch (error) {
                console.error('[SW] Failed to sync operation:', op.id, error);
            }
        }

        // Notify clients about sync completion
        const allClients = await clients.matchAll();
        allClients.forEach(client => {
            client.postMessage({
                type: 'SYNC_COMPLETE',
                count: pendingOps.length
            });
        });
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

// IndexedDB helpers for service worker
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('medisync-offline', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function getAllPendingOperations(db) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('pending-operations', 'readonly');
        const store = tx.objectStore('pending-operations');
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
    });
}

function removePendingOperation(db, id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('pending-operations', 'readwrite');
        const store = tx.objectStore('pending-operations');
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

// Periodic sync for maintenance reminders (if supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-maintenance-reminders') {
        event.waitUntil(checkMaintenanceReminders());
    }
});

async function checkMaintenanceReminders() {
    try {
        const response = await fetch('/api/notifications/check-reminders');
        if (response.ok) {
            const data = await response.json();
            if (data.notifications && data.notifications.length > 0) {
                for (const notif of data.notifications) {
                    await self.registration.showNotification(notif.title, {
                        body: notif.body,
                        icon: '/icon-192.png',
                        data: { url: notif.url }
                    });
                }
            }
        }
    } catch (error) {
        console.error('[SW] Failed to check reminders:', error);
    }
}

console.log('[SW] MediSync Custom Service Worker loaded');
