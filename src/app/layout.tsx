import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ToastProvider } from '@/components/ToastProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeScript } from '@/components/ThemeScript'
import AuthProvider from '@/components/AuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import NetworkDetector from '@/components/NetworkDetector'
import { LicenseProvider } from '@/contexts/LicenseContext'
import { LicenseModal } from '@/components/LicenseModal'
import { AppearanceProvider } from '@/contexts/AppearanceContext'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'
import { OfflineIndicator } from '@/components/OfflineIndicator'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Tıbbi Cihaz Yönetim Portalı',
    description: 'Klinik Biyomedikal Takip ve Yönetim Sistemi',
    manifest: '/manifest.json',
    icons: {
        icon: '/logo.png',
        shortcut: '/logo.png',
        apple: '/logo.png',
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Biyomedikal Portalı',
    },
}

export const viewport: Viewport = {
    themeColor: '#2563eb',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="tr" suppressHydrationWarning>
            <head>
                <ThemeScript />
            </head>
            <body className={inter.className} suppressHydrationWarning>
                <ErrorBoundary>
                    <ThemeProvider>
                        <AuthProvider>
                            <AppearanceProvider>
                                <ToastProvider>
                                    <NetworkDetector />
                                    <ServiceWorkerRegister />
                                    <LicenseProvider>
                                        <OfflineIndicator />
                                        {children}
                                    </LicenseProvider>
                                </ToastProvider>
                            </AppearanceProvider>
                        </AuthProvider>
                    </ThemeProvider>
                </ErrorBoundary>
            </body>
        </html>
    )
}
