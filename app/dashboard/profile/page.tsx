'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
    User,
    Camera,
    Lock,
    Save,
    X,
    Eye,
    EyeOff,
    Loader2,
    Upload,
    Trash2
} from 'lucide-react'
import { useToast } from '@/components/ToastProvider'

export default function ProfilePage() {
    const { data: session, update: updateSession } = useSession()
    const { showSuccess, showError } = useToast()
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [user, setUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [avatarLoading, setAvatarLoading] = useState(false)

    // Password change state
    const [showPasswordSection, setShowPasswordSection] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)

    useEffect(() => {
        fetchUserProfile()
    }, [])

    const fetchUserProfile = async () => {
        try {
            const response = await fetch('/api/users/me')
            if (response.ok) {
                const data = await response.json()
                setUser(data)
            }
        } catch (error) {
            showError('Profil bilgileri yüklenemedi')
        } finally {
            setIsLoading(false)
        }
    }

    const handleAvatarUpload = async (file: File) => {
        if (!file) return

        setAvatarLoading(true)
        try {
            const formData = new FormData()
            formData.append('avatar', file)

            const response = await fetch('/api/users/avatar', {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const data = await response.json()
                setUser({ ...user, avatarUrl: data.avatarUrl })
                showSuccess('Profil fotoğrafı güncellendi')
                // Dispatch event to refresh sidebar avatar
                window.dispatchEvent(new Event('avatar-updated'))
            } else {
                const error = await response.json()
                showError(error.error || 'Fotoğraf yüklenemedi')
            }
        } catch (error) {
            showError('Bir hata oluştu')
        } finally {
            setAvatarLoading(false)
        }
    }

    const handleAvatarRemove = async () => {
        if (!confirm('Profil fotoğrafını kaldırmak istediğinizden emin misiniz?')) return

        setAvatarLoading(true)
        try {
            const response = await fetch('/api/users/avatar', {
                method: 'DELETE'
            })

            if (response.ok) {
                setUser({ ...user, avatarUrl: null })
                showSuccess('Profil fotoğrafı kaldırıldı')
                window.dispatchEvent(new Event('avatar-updated'))
            } else {
                showError('Fotoğraf kaldırılamadı')
            }
        } catch (error) {
            showError('Bir hata oluştu')
        } finally {
            setAvatarLoading(false)
        }
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            showError('Yeni şifreler eşleşmiyor')
            return
        }

        if (newPassword.length < 6) {
            showError('Yeni şifre en az 6 karakter olmalıdır')
            return
        }

        setPasswordLoading(true)
        try {
            const response = await fetch('/api/users/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            })

            if (response.ok) {
                showSuccess('Şifre başarıyla değiştirildi')
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
                setShowPasswordSection(false)
            } else {
                const error = await response.json()
                showError(error.error || 'Şifre değiştirilemedi')
            }
        } catch (error) {
            showError('Bir hata oluştu')
        } finally {
            setPasswordLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                    <User className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
                    Profil Ayarları
                </h1>
            </div>

            {/* Profile Picture Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Camera className="h-5 w-5 mr-2 text-blue-600" />
                    Profil Fotoğrafı
                </h2>

                <div className="flex items-center space-x-6">
                    <div className="relative">
                        {user?.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-blue-500">
                                {user?.name?.[0] || 'U'}
                            </div>
                        )}
                        {avatarLoading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                <Loader2 className="h-8 w-8 text-white animate-spin" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 space-y-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleAvatarUpload(file)
                            }}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={avatarLoading}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                        >
                            <Upload className="h-4 w-4" />
                            <span>Fotoğraf Yükle</span>
                        </button>
                        {user?.avatarUrl && (
                            <button
                                onClick={handleAvatarRemove}
                                disabled={avatarLoading}
                                className="flex items-center space-x-2 px-4 py-2 border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span>Fotoğrafı Kaldır</span>
                            </button>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            JPG, PNG veya GIF. Maksimum 2MB.
                        </p>
                    </div>
                </div>
            </div>

            {/* User Info Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Kullanıcı Bilgileri
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Ad Soyad</label>
                        <p className="text-gray-900 dark:text-white font-medium">{user?.name}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">E-posta</label>
                        <p className="text-gray-900 dark:text-white font-medium">{user?.email}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Rol</label>
                        <p className="text-gray-900 dark:text-white font-medium">{user?.role}</p>
                    </div>
                    {user?.department && (
                        <div>
                            <label className="text-sm text-gray-500 dark:text-gray-400">Departman</label>
                            <p className="text-gray-900 dark:text-white font-medium">{user.department}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Password Change Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                        <Lock className="h-5 w-5 mr-2 text-blue-600" />
                        Şifre Değiştir
                    </h2>
                    {!showPasswordSection && (
                        <button
                            onClick={() => setShowPasswordSection(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                        >
                            Şifreyi Değiştir
                        </button>
                    )}
                </div>

                {showPasswordSection && (
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Mevcut Şifre
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                >
                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Yeni Şifre
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Yeni Şifre (Tekrar)
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                required
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPasswordSection(false)
                                    setCurrentPassword('')
                                    setNewPassword('')
                                    setConfirmPassword('')
                                }}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                disabled={passwordLoading}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center space-x-2"
                            >
                                {passwordLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Değiştiriliyor...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        <span>Şifreyi Kaydet</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
