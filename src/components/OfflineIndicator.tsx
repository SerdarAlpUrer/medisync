'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { syncManager, SyncStatus } from '@/lib/offline';

export function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
    const [pendingCount, setPendingCount] = useState(0);
    const [showDetails, setShowDetails] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

    useEffect(() => {
        // Initial state
        setIsOnline(navigator.onLine);

        // Update pending count
        const updatePendingCount = async () => {
            const count = await syncManager.getPendingCount();
            setPendingCount(count);
        };
        updatePendingCount();

        // Listen to sync manager events
        const unsubscribe = syncManager.addListener({
            onStatusChange: (status) => {
                setSyncStatus(status);
                if (status === 'idle') {
                    setLastSyncTime(new Date());
                    updatePendingCount();
                }
            },
            onOnlineStatusChange: (online) => {
                setIsOnline(online);
            },
            onSyncComplete: () => {
                updatePendingCount();
            }
        });

        // Periodic pending count update
        const interval = setInterval(updatePendingCount, 30000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    const handleManualSync = async () => {
        await syncManager.syncToServer();
        await syncManager.syncFromServer();
    };

    // Don't show if online and no pending operations
    if (isOnline && pendingCount === 0 && syncStatus === 'idle') {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 z-50">
            <button
                onClick={() => setShowDetails(!showDetails)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-all ${!isOnline
                        ? 'bg-orange-500 text-white'
                        : syncStatus === 'syncing'
                            ? 'bg-blue-500 text-white'
                            : syncStatus === 'error'
                                ? 'bg-red-500 text-white'
                                : pendingCount > 0
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-green-500 text-white'
                    }`}
            >
                {!isOnline ? (
                    <>
                        <WifiOff className="w-4 h-4" />
                        <span className="text-sm font-medium">Çevrimdışı</span>
                    </>
                ) : syncStatus === 'syncing' ? (
                    <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">Senkronize ediliyor...</span>
                    </>
                ) : syncStatus === 'error' ? (
                    <>
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Senkronizasyon hatası</span>
                    </>
                ) : pendingCount > 0 ? (
                    <>
                        <RefreshCw className="w-4 h-4" />
                        <span className="text-sm font-medium">{pendingCount} bekleyen</span>
                    </>
                ) : (
                    <>
                        <Check className="w-4 h-4" />
                        <span className="text-sm font-medium">Senkronize</span>
                    </>
                )}
            </button>

            {showDetails && (
                <div className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Senkronizasyon Durumu
                    </h4>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Bağlantı:</span>
                            <span className={isOnline ? 'text-green-600' : 'text-orange-600'}>
                                {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Bekleyen işlem:</span>
                            <span className={pendingCount > 0 ? 'text-yellow-600' : 'text-green-600'}>
                                {pendingCount}
                            </span>
                        </div>

                        {lastSyncTime && (
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Son senkronizasyon:</span>
                                <span className="text-gray-900 dark:text-white">
                                    {lastSyncTime.toLocaleTimeString('tr-TR')}
                                </span>
                            </div>
                        )}
                    </div>

                    {isOnline && (pendingCount > 0 || syncStatus === 'error') && (
                        <button
                            onClick={handleManualSync}
                            disabled={syncStatus === 'syncing'}
                            className="mt-4 w-full px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                            {syncStatus === 'syncing' ? 'Senkronize ediliyor...' : 'Manuel Senkronizasyon'}
                        </button>
                    )}

                    {!isOnline && (
                        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                            Çevrimdışı modda çalışıyorsunuz. Verileriniz yerel olarak saklanacak ve internet bağlantısı geldiğinde otomatik olarak senkronize edilecektir.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
