'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { useToast } from './ToastProvider'

// VAPID Public Key - Normally would be in env vars, using a placeholder or need to be generated
// For this demo/impl, we'll try to fetch it from an API endpoint
const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'

export function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const { showSuccess, showError } = useToast()

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            registerServiceWorker()
        } else {
            setIsLoading(false)
        }
    }, [])

    const registerServiceWorker = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw-custom.js')
            const sub = await registration.pushManager.getSubscription()
            setSubscription(sub)
            setIsLoading(false)
        } catch (error) {
            console.error('Service Worker registration failed:', error)
            setIsLoading(false)
        }
    }

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4)
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/')

        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
    }

    const subscribeToPush = async () => {
        setIsLoading(true)
        try {
            const registration = await navigator.serviceWorker.ready
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            })

            setSubscription(sub)

            // Send subscription to backend
            await fetch('/api/notifications/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: sub.toJSON() })
            })

            showSuccess('Bildirimler açıldı!')
        } catch (error) {
            console.error('Subscription failed:', error)
            showError('Bildirim izni alınamadı')
        } finally {
            setIsLoading(false)
        }
    }

    const unsubscribeFromPush = async () => {
        setIsLoading(true)
        try {
            if (subscription) {
                const endpoint = subscription.endpoint
                await subscription.unsubscribe()
                setSubscription(null)

                // Notify backend to remove subscription
                await fetch('/api/notifications/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint })
                })
                showSuccess('Bildirimler kapatıldı')
            }
        } catch (error) {
            console.error('Unsubscription failed:', error)
            showError('Bildirimler kapatılamadı')
        } finally {
            setIsLoading(false)
        }
    }

    if (!isSupported) {
        return (
            <div className="text-sm text-gray-500 italic">
                Tarayıcınız bildirimleri desteklemiyor.
            </div>
        )
    }

    if (isLoading) {
        return <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
    }

    return (
        <div className="flex items-center space-x-2">
            {subscription ? (
                <button
                    onClick={unsubscribeFromPush}
                    className="flex items-center px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors text-sm font-medium"
                >
                    <BellOff className="h-4 w-4 mr-2" />
                    Bildirimleri Kapat
                </button>
            ) : (
                <button
                    onClick={subscribeToPush}
                    className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors text-sm font-medium"
                >
                    <Bell className="h-4 w-4 mr-2" />
                    Bildirimleri Aç
                </button>
            )}
        </div>
    )
}
