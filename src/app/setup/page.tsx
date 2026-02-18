'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Database, Check, ChevronRight, ChevronLeft, Loader2,
    AlertTriangle, CheckCircle2, Server, Key, Globe, RefreshCw,
    Eye, EyeOff, Zap, Shield, HardDrive
} from 'lucide-react'

interface DatabaseConfig {
    host: string
    port: number
    database: string
    username: string
    password: string
}

interface TestResult {
    success: boolean
    message?: string
    error?: string
    data?: {
        version: string
        databaseName: string
        currentUser: string
        databaseSize: string
    }
}

export default function SetupPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [testResult, setTestResult] = useState<TestResult | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Form state
    const [dbConfig, setDbConfig] = useState<DatabaseConfig>({
        host: 'localhost',
        port: 5432,
        database: 'medisync',
        username: 'postgres',
        password: ''
    })

    const [appConfig, setAppConfig] = useState({
        nextAuthUrl: 'http://localhost:3000',
        nextAuthSecret: ''
    })

    // Check if already configured
    useEffect(() => {
        checkExistingConfig()
    }, [])

    const checkExistingConfig = async () => {
        try {
            const res = await fetch('/api/config/env')
            const data = await res.json()

            if (data.isValid && !data.setupMode) {
                // Zaten yapılandırılmış, ana sayfaya yönlendir
                router.push('/dashboard')
            }
        } catch (error) {
            // İlk kurulum, devam et
        }
    }

    const generateSecret = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let secret = ''
        for (let i = 0; i < 64; i++) {
            secret += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setAppConfig(prev => ({ ...prev, nextAuthSecret: secret }))
    }

    const testConnection = async () => {
        setIsLoading(true)
        setTestResult(null)

        try {
            const res = await fetch('/api/config/test-db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbConfig)
            })

            const data = await res.json()
            setTestResult(data)
        } catch (error) {
            setTestResult({
                success: false,
                error: 'Bağlantı testi yapılamadı'
            })
        } finally {
            setIsLoading(false)
        }
    }

    const saveConfiguration = async () => {
        setIsSaving(true)

        try {
            const databaseUrl = `postgresql://${dbConfig.username}:${encodeURIComponent(dbConfig.password)}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`

            const res = await fetch('/api/config/env', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    DATABASE_URL: databaseUrl,
                    NEXTAUTH_SECRET: appConfig.nextAuthSecret,
                    NEXTAUTH_URL: appConfig.nextAuthUrl
                })
            })

            const data = await res.json()

            if (data.success) {
                setCurrentStep(3) // Tamamlandı adımına git
            } else {
                alert(data.error || 'Yapılandırma kaydedilemedi')
            }
        } catch (error) {
            alert('Bir hata oluştu')
        } finally {
            setIsSaving(false)
        }
    }

    const steps = [
        { title: 'Hoş Geldiniz', icon: Zap },
        { title: 'Veritabanı', icon: Database },
        { title: 'Uygulama', icon: Shield },
        { title: 'Tamamlandı', icon: Check }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
                        <HardDrive className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">MediSync Kurulum</h1>
                    <p className="text-blue-200">Sisteminizi birkaç adımda yapılandırın</p>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center space-x-2">
                        {steps.map((step, index) => {
                            const Icon = step.icon
                            const isActive = index === currentStep
                            const isCompleted = index < currentStep

                            return (
                                <div key={step.title} className="flex items-center">
                                    <div className={`
                                        flex items-center justify-center w-10 h-10 rounded-full transition-all
                                        ${isCompleted ? 'bg-green-500 text-white' : ''}
                                        ${isActive ? 'bg-white text-blue-600 ring-4 ring-blue-300' : ''}
                                        ${!isActive && !isCompleted ? 'bg-white/20 text-white/60' : ''}
                                    `}>
                                        {isCompleted ? (
                                            <Check className="w-5 h-5" />
                                        ) : (
                                            <Icon className="w-5 h-5" />
                                        )}
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`w-12 h-1 mx-2 rounded ${isCompleted ? 'bg-green-500' : 'bg-white/20'}`} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Step 0: Welcome */}
                    {currentStep === 0 && (
                        <div className="p-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                                <Zap className="w-8 h-8 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">MediSync&apos;e Hoş Geldiniz!</h2>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                Profesyonel tıbbi cihaz takip ve yönetim sisteminizi birkaç basit adımda yapılandıralım.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <Database className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                                    <h3 className="font-medium text-gray-900">Veritabanı</h3>
                                    <p className="text-sm text-gray-500">PostgreSQL bağlantısı</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <Shield className="w-6 h-6 text-green-600 mx-auto mb-2" />
                                    <h3 className="font-medium text-gray-900">Güvenlik</h3>
                                    <p className="text-sm text-gray-500">Şifreleme ayarları</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <Globe className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                                    <h3 className="font-medium text-gray-900">Erişim</h3>
                                    <p className="text-sm text-gray-500">URL yapılandırması</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setCurrentStep(1)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Kuruluma Başla
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Step 1: Database Configuration */}
                    {currentStep === 1 && (
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Database className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Veritabanı Bağlantısı</h2>
                                    <p className="text-sm text-gray-500">PostgreSQL sunucu bilgilerini girin</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Sunucu Adresi
                                        </label>
                                        <div className="relative">
                                            <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={dbConfig.host}
                                                onChange={(e) => setDbConfig(prev => ({ ...prev, host: e.target.value }))}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="localhost"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Port
                                        </label>
                                        <input
                                            type="number"
                                            value={dbConfig.port}
                                            onChange={(e) => setDbConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 5432 }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="5432"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Veritabanı Adı
                                    </label>
                                    <input
                                        type="text"
                                        value={dbConfig.database}
                                        onChange={(e) => setDbConfig(prev => ({ ...prev, database: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="medisync"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kullanıcı Adı
                                    </label>
                                    <input
                                        type="text"
                                        value={dbConfig.username}
                                        onChange={(e) => setDbConfig(prev => ({ ...prev, username: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="postgres"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Şifre
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={dbConfig.password}
                                            onChange={(e) => setDbConfig(prev => ({ ...prev, password: e.target.value }))}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Test Button */}
                                <div className="pt-2">
                                    <button
                                        onClick={testConnection}
                                        disabled={isLoading || !dbConfig.password}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-5 h-5" />
                                        )}
                                        Bağlantıyı Test Et
                                    </button>
                                </div>

                                {/* Test Result */}
                                {testResult && (
                                    <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                        <div className="flex items-start gap-3">
                                            {testResult.success ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                                            ) : (
                                                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                                            )}
                                            <div>
                                                <p className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                                    {testResult.success ? testResult.message : testResult.error}
                                                </p>
                                                {testResult.data && (
                                                    <div className="mt-2 text-sm text-green-700 space-y-1">
                                                        <p>Versiyon: {testResult.data.version}</p>
                                                        <p>Veritabanı: {testResult.data.databaseName}</p>
                                                        <p>Boyut: {testResult.data.databaseSize}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Navigation */}
                            <div className="flex justify-between mt-8 pt-6 border-t">
                                <button
                                    onClick={() => setCurrentStep(0)}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    Geri
                                </button>
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    disabled={!testResult?.success}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Devam
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: App Configuration */}
                    {currentStep === 2 && (
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Shield className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Uygulama Ayarları</h2>
                                    <p className="text-sm text-gray-500">Güvenlik ve erişim ayarlarını yapılandırın</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Uygulama URL&apos;i
                                    </label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={appConfig.nextAuthUrl}
                                            onChange={(e) => setAppConfig(prev => ({ ...prev, nextAuthUrl: e.target.value }))}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="http://localhost:3000"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Uygulamaya erişeceğiniz tam URL adresi
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Güvenlik Anahtarı
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={appConfig.nextAuthSecret}
                                                onChange={(e) => setAppConfig(prev => ({ ...prev, nextAuthSecret: e.target.value }))}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                                placeholder="Otomatik oluştur veya manuel girin"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={generateSecret}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors whitespace-nowrap"
                                        >
                                            Oluştur
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Oturum şifreleme için kullanılır. En az 32 karakter olmalıdır.
                                    </p>
                                </div>

                                {/* Summary */}
                                <div className="bg-gray-50 rounded-xl p-4 mt-6">
                                    <h3 className="font-medium text-gray-900 mb-3">Yapılandırma Özeti</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Veritabanı:</span>
                                            <span className="font-medium">{dbConfig.host}:{dbConfig.port}/{dbConfig.database}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Kullanıcı:</span>
                                            <span className="font-medium">{dbConfig.username}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Uygulama URL:</span>
                                            <span className="font-medium">{appConfig.nextAuthUrl}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Güvenlik Anahtarı:</span>
                                            <span className="font-medium">
                                                {appConfig.nextAuthSecret ? `${appConfig.nextAuthSecret.substring(0, 8)}...` : 'Belirtilmedi'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation */}
                            <div className="flex justify-between mt-8 pt-6 border-t">
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    Geri
                                </button>
                                <button
                                    onClick={saveConfiguration}
                                    disabled={isSaving || !appConfig.nextAuthSecret || appConfig.nextAuthSecret.length < 32}
                                    className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Kaydediliyor...
                                        </>
                                    ) : (
                                        <>
                                            Kaydet ve Tamamla
                                            <Check className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Completed */}
                    {currentStep === 3 && (
                        <div className="p-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Kurulum Tamamlandı!</h2>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                MediSync başarıyla yapılandırıldı. Değişikliklerin etkili olması için uygulamayı yeniden başlatmanız gerekmektedir.
                            </p>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 max-w-md mx-auto">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                                    <div className="text-left">
                                        <p className="font-medium text-amber-800">Yeniden Başlatma Gerekli</p>
                                        <p className="text-sm text-amber-700 mt-1">
                                            Terminal penceresini kapatın ve <code className="bg-amber-100 px-1 rounded">BASLAT.bat</code> dosyasını tekrar çalıştırın.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <a
                                    href="/login"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                                >
                                    Giriş Sayfasına Git
                                    <ChevronRight className="w-5 h-5" />
                                </a>
                                <p className="text-sm text-gray-500">
                                    Varsayılan giriş: admin@medisync.com / admin123
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-blue-200 text-sm mt-6">
                    MediSync Version 1.5 - Profesyonel Tıbbi Cihaz Yönetim Sistemi
                </p>
            </div>
        </div>
    )
}
