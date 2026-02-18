'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: string
    type: ToastType
    message: string
    duration?: number
}

interface ToastContextType {
    showToast: (type: ToastType, message: string, duration?: number) => void
    showSuccess: (message: string) => void
    showError: (message: string) => void
    showWarning: (message: string) => void
    showInfo: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = (type: ToastType, message: string, duration = 3000) => {
        const id = Date.now().toString()
        const toast: Toast = { id, type, message, duration }

        setToasts(prev => [...prev, toast])

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id)
            }, duration)
        }
    }

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }

    const showSuccess = (message: string) => showToast('success', message)
    const showError = (message: string) => showToast('error', message)
    const showWarning = (message: string) => showToast('warning', message)
    const showInfo = (message: string) => showToast('info', message)

    return (
        <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const config = {
        success: {
            icon: CheckCircle,
            className: 'bg-green-50 border-green-500 text-green-900',
            iconColor: 'text-green-500',
        },
        error: {
            icon: AlertCircle,
            className: 'bg-red-50 border-red-500 text-red-900',
            iconColor: 'text-red-500',
        },
        warning: {
            icon: AlertTriangle,
            className: 'bg-yellow-50 border-yellow-500 text-yellow-900',
            iconColor: 'text-yellow-500',
        },
        info: {
            icon: Info,
            className: 'bg-blue-50 border-blue-500 text-blue-900',
            iconColor: 'text-blue-500',
        },
    }

    const { icon: Icon, className, iconColor } = config[toast.type]

    return (
        <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border-l-4 shadow-lg ${className} animate-fadeIn min-w-[300px]`}>
            <Icon className={`h-5 w-5 flex-shrink-0 ${iconColor}`} />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={onClose}
                className="p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}
