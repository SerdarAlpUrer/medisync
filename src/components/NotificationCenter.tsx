'use client'

import React, { useState, useEffect } from 'react'
import { Bell, X, Check, Trash2, AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react'
import { useToast } from './ToastProvider'

interface Notification {
  id: string
  title: string
  message: string
  priority: string
  category?: string
  actionUrl?: string
  read: boolean
  createdAt: string
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/notifications?limit=20')
      if (response.ok) {
        const result = await response.json()
        const data = result.success ? result.data : result
        setNotifications(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        showSuccess('Bildirim silindi')
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
      showError('Bildirim silinirken hata oluştu')
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Bildirimler</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Yükleniyor...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Bildirim yok</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getPriorityIcon(notification.priority)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              !notification.read
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            {new Date(notification.createdAt).toLocaleString('tr-TR')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                              title="Okundu olarak işaretle"
                            >
                              <Check className="h-4 w-4 text-gray-500" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

