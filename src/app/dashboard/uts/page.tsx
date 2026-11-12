'use client'

import { useState, useEffect } from 'react'
import {
    Database, Search, Send, RefreshCw, AlertCircle,
    CheckCircle, Package, FileText, X, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface UTSProduct {
    utsKodu: string
    barkod: string
    urunAdi: string
    marka: string
    model: string
    uretici: string
    ulke: string
    riskSinifi: string
    ceIsareti: string
    kayitTarihi: string
    durum: string
}

interface ConnectionStatus {
    connected: boolean
    mode: 'SIMULATION' | 'TEST' | 'PRODUCTION'
    message: string
}

export default function UTSPage() {
    const [status, setStatus] = useState<ConnectionStatus | null>(null)
    const [products, setProducts] = useState<UTSProduct[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResult, setSearchResult] = useState<UTSProduct | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const [showNotificationModal, setShowNotificationModal] = useState(false)
    const [isSending, setIsSending] = useState(false)

    // Bildirim formu
    const [notificationForm, setNotificationForm] = useState({
        type: 'ALIM' as 'ALIM' | 'VERME',
        utsKodu: '',
        miktar: 1,
        lotNo: '',
        seriNo: '',
        aliciVkn: '',
        aciklama: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/uts')
            if (res.ok) {
                const data = await res.json()
                setStatus(data.status)
                setProducts(data.products || [])
            }
        } catch (error) {
            console.error('UTS fetch error:', error)
            toast.error('UTS verisi yüklenemedi')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            toast.error('Lütfen barkod veya UTS kodu girin')
            return
        }

        setIsSearching(true)
        setSearchResult(null)

        try {
            const res = await fetch(`/api/uts?action=query&query=${encodeURIComponent(searchQuery)}`)
            const data = await res.json()

            if (data.success && data.data) {
                setSearchResult(data.data)
                toast.success(`Ürün bulundu${data.isSimulation ? ' (Simülasyon)' : ''}`)
            } else {
                toast.error(data.error || 'Ürün bulunamadı')
            }
        } catch (error) {
            toast.error('Sorgulama hatası')
        } finally {
            setIsSearching(false)
        }
    }

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!notificationForm.utsKodu || notificationForm.miktar < 1) {
            toast.error('Lütfen zorunlu alanları doldurun')
            return
        }

        setIsSending(true)
        try {
            const res = await fetch('/api/uts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'notification',
                    ...notificationForm
                })
            })

            const data = await res.json()

            if (data.success) {
                toast.success(`Bildirim gönderildi: ${data.bildirimNo}${data.isSimulation ? ' (Simülasyon)' : ''}`)
                setShowNotificationModal(false)
                setNotificationForm({
                    type: 'ALIM',
                    utsKodu: '',
                    miktar: 1,
                    lotNo: '',
                    seriNo: '',
                    aliciVkn: '',
                    aciklama: ''
                })
            } else {
                toast.error(data.error || 'Bildirim gönderilemedi')
            }
        } catch (error) {
            toast.error('Bildirim hatası')
        } finally {
            setIsSending(false)
        }
    }

    const selectProductForNotification = (product: UTSProduct) => {
        setNotificationForm({
            ...notificationForm,
            utsKodu: product.utsKodu
        })
        setShowNotificationModal(true)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Database className="h-8 w-8 mr-3 text-indigo-600 dark:text-indigo-400" />
                        UTS Entegrasyonu
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">TİTCK Ürün Takip Sistemi</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowNotificationModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                        <Send className="h-5 w-5" />
                        <span>Bildirim Gönder</span>
                    </button>
                    <button
                        onClick={fetchData}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span>Yenile</span>
                    </button>
                </div>
            </div>

            {/* Connection Status */}
            {status && (
                <div className={`rounded-xl p-4 flex items-center justify-between ${status.mode === 'SIMULATION'
                    ? 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700'
                    : status.connected
                        ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-700'
                        : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-700'
                    }`}>
                    <div className="flex items-center space-x-3">
                        {status.mode === 'SIMULATION' ? (
                            <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                        ) : status.connected ? (
                            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        ) : (
                            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        )}
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                                {status.mode === 'SIMULATION' && 'Simülasyon Modu'}
                                {status.mode === 'TEST' && 'Test Ortamı'}
                                {status.mode === 'PRODUCTION' && 'Canlı Ortam'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{status.message}</p>
                        </div>
                    </div>
                    {status.mode === 'SIMULATION' && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 rounded-full text-sm font-medium">
                            .env dosyasına UTS_API_TOKEN ekleyin
                        </span>
                    )}
                </div>
            )}

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Search className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                    Ürün Sorgula
                </h2>
                <div className="flex space-x-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Barkod veya UTS kodu girin..."
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50"
                    >
                        {isSearching ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Search className="h-5 w-5" />
                        )}
                        <span>Sorgula</span>
                    </button>
                </div>

                {/* Search Result */}
                {searchResult && (
                    <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center space-x-3">
                                    <span className="text-indigo-600 dark:text-indigo-400 font-mono font-semibold">{searchResult.utsKodu}</span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${searchResult.durum === 'AKTIF' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                        }`}>
                                        {searchResult.durum}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">{searchResult.urunAdi}</h3>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 text-sm text-gray-700 dark:text-gray-300">
                                    <p><span className="text-gray-500 dark:text-gray-400">Marka:</span> {searchResult.marka}</p>
                                    <p><span className="text-gray-500 dark:text-gray-400">Model:</span> {searchResult.model}</p>
                                    <p><span className="text-gray-500 dark:text-gray-400">Üretici:</span> {searchResult.uretici}</p>
                                    <p><span className="text-gray-500 dark:text-gray-400">Ülke:</span> {searchResult.ulke}</p>
                                    <p><span className="text-gray-500 dark:text-gray-400">Risk Sınıfı:</span> {searchResult.riskSinifi}</p>
                                    <p><span className="text-gray-500 dark:text-gray-400">CE İşareti:</span> {searchResult.ceIsareti}</p>
                                    <p><span className="text-gray-500 dark:text-gray-400">Barkod:</span> {searchResult.barkod}</p>
                                    <p><span className="text-gray-500 dark:text-gray-400">Kayıt Tarihi:</span> {new Date(searchResult.kayitTarihi).toLocaleDateString('tr-TR')}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => selectProductForNotification(searchResult)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                            >
                                Bildirim Gönder
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Product List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <Package className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                        Örnek Ürünler (Simülasyon)
                    </h2>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {products.map((product) => (
                            <div key={product.utsKodu} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center space-x-3">
                                            <span className="text-indigo-600 dark:text-indigo-400 font-mono font-semibold">{product.utsKodu}</span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${product.riskSinifi === 'III' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                product.riskSinifi === 'IIb' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                }`}>
                                                Sınıf {product.riskSinifi}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{product.ceIsareti}</span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{product.urunAdi}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{product.marka} | {product.uretici}</p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{product.barkod}</span>
                                        <button
                                            onClick={() => selectProductForNotification(product)}
                                            className="px-3 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-sm font-medium transition-colors"
                                        >
                                            Bildirim
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Notification Modal */}
            {showNotificationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                <Send className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                                UTS Bildirim Gönder
                            </h2>
                            <button onClick={() => setShowNotificationModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSendNotification} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bildirim Tipi</label>
                                    <select
                                        value={notificationForm.type}
                                        onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value as 'ALIM' | 'VERME' })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="ALIM">Alım Bildirimi</option>
                                        <option value="VERME">Verme Bildirimi</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Miktar</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={notificationForm.miktar}
                                        onChange={(e) => setNotificationForm({ ...notificationForm, miktar: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    UTS Kodu <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={notificationForm.utsKodu}
                                    onChange={(e) => setNotificationForm({ ...notificationForm, utsKodu: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                                    placeholder="UTS-2024-001"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lot No</label>
                                    <input
                                        type="text"
                                        value={notificationForm.lotNo}
                                        onChange={(e) => setNotificationForm({ ...notificationForm, lotNo: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Opsiyonel"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seri No</label>
                                    <input
                                        type="text"
                                        value={notificationForm.seriNo}
                                        onChange={(e) => setNotificationForm({ ...notificationForm, seriNo: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Opsiyonel"
                                    />
                                </div>
                            </div>

                            {notificationForm.type === 'VERME' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alıcı VKN</label>
                                    <input
                                        type="text"
                                        value={notificationForm.aliciVkn}
                                        onChange={(e) => setNotificationForm({ ...notificationForm, aliciVkn: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Vergi Kimlik Numarası"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Açıklama</label>
                                <textarea
                                    value={notificationForm.aciklama}
                                    onChange={(e) => setNotificationForm({ ...notificationForm, aciklama: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    rows={2}
                                    placeholder="Opsiyonel not"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowNotificationModal(false)}
                                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSending}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50"
                                >
                                    {isSending ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Send className="h-5 w-5" />
                                    )}
                                    <span>Gönder</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
