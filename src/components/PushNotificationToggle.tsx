'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PushNotificationToggleProps {
    className?: string;
}

export function PushNotificationToggle({ className = '' }: PushNotificationToggleProps) {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        // Check if push is supported
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            checkSubscription();
            setPermission(Notification.permission);
        }
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    };

    const getVapidPublicKey = async (): Promise<string | null> => {
        try {
            const response = await fetch('/api/notifications/push/vapid-key');
            if (response.ok) {
                const data = await response.json();
                return data.publicKey;
            }
        } catch (error) {
            console.error('Error fetching VAPID key:', error);
        }
        return null;
    };

    const urlBase64ToUint8Array = (base64String: string): ArrayBuffer => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray.buffer as ArrayBuffer;
    };

    const subscribe = async () => {
        setIsLoading(true);
        try {
            // Request permission
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult !== 'granted') {
                toast.error('Bildirim izni reddedildi');
                return;
            }

            // Get VAPID public key
            const vapidPublicKey = await getVapidPublicKey();
            if (!vapidPublicKey) {
                toast.error('Push notification yapılandırması bulunamadı');
                return;
            }

            // Subscribe to push
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });

            // Send subscription to server
            const response = await fetch('/api/notifications/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: subscription.toJSON() })
            });

            if (response.ok) {
                setIsSubscribed(true);
                toast.success('Push bildirimleri etkinleştirildi');
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            console.error('Error subscribing to push:', error);
            toast.error('Push bildirimleri etkinleştirilemedi');
        } finally {
            setIsLoading(false);
        }
    };

    const unsubscribe = async () => {
        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Notify server
                await fetch('/api/notifications/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                });
            }

            setIsSubscribed(false);
            toast.success('Push bildirimleri devre dışı bırakıldı');
        } catch (error) {
            console.error('Error unsubscribing from push:', error);
            toast.error('Push bildirimleri devre dışı bırakılamadı');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isSupported) {
        return (
            <div className={`text-gray-500 text-sm ${className}`}>
                Push bildirimleri bu tarayıcıda desteklenmiyor
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-4 ${className}`}>
            <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                    Push Bildirimleri
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isSubscribed
                        ? 'Bakım ve kalibrasyon hatırlatmaları alıyorsunuz'
                        : 'Önemli olaylar hakkında anlık bildirimler alın'
                    }
                </p>
                {permission === 'denied' && (
                    <p className="text-xs text-red-500 mt-1">
                        Bildirim izni tarayıcı ayarlarından engellendi
                    </p>
                )}
            </div>

            <button
                onClick={isSubscribed ? unsubscribe : subscribe}
                disabled={isLoading || permission === 'denied'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isSubscribed
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSubscribed ? (
                    <BellOff className="w-4 h-4" />
                ) : (
                    <Bell className="w-4 h-4" />
                )}
                <span>
                    {isLoading
                        ? 'İşleniyor...'
                        : isSubscribed
                            ? 'Devre Dışı Bırak'
                            : 'Etkinleştir'
                    }
                </span>
            </button>
        </div>
    );
}
