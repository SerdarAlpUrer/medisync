'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, AlertTriangle, CheckCircle, Smartphone, Info, QrCode } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import BarcodeReader from '@/components/BarcodeReader'

interface Device {
    id: string
    name: string
    tagNumber: string
    serialNumber: string
    brand: string
    model: string
    hospitalId: string
}

function ReportFaultContent() {
    const [step, setStep] = useState<'SEARCH' | 'FORM' | 'SUCCESS'>('SEARCH')
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [foundDevice, setFoundDevice] = useState<Device | null>(null)

    const [showQRScanner, setShowQRScanner] = useState(false)

    const [reportForm, setReportForm] = useState({
        description: '',
        urgency: 'MEDIUM',
        reporterName: '',
        reporterPhone: '',
        reporterTitle: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [referenceNumber, setReferenceNumber] = useState('')
    const searchParams = useSearchParams()

    useEffect(() => {
        const query = searchParams.get('query')
        if (query) {
            setSearchQuery(query)
            // Trigger search immediately if we have a query
            const triggerSearch = async () => {
                setIsSearching(true)
                try {
                    const res = await fetch(`/api/public/device-lookup?query=${encodeURIComponent(query)}`)
                    if (res.ok) {
                        const data = await res.json()
                        const device = data.success ? data.data : data
                        setFoundDevice(device)
                        setStep('FORM')
                    }
                } catch (error) {
                    console.error('Initial search error:', error)
                } finally {
                    setIsSearching(false)
                }
            }
            triggerSearch()
        }
    }, [searchParams])

    const handleScan = (code: string) => {
        setSearchQuery(code)
        setShowQRScanner(false)
        // Trigger search immediately
        setIsSearching(true)
        fetch(`/api/public/device-lookup?query=${encodeURIComponent(code)}`)
            .then(res => {
                if (res.ok) return res.json()
                throw new Error('Cihaz bulunamadı')
            })
            .then(data => {
                // Handle both old format (direct object) and new format (wrapped in success/data)
                const device = data.success ? data.data : data
                setFoundDevice(device)
                setStep('FORM')
            })
            .catch(error => {
                toast.error('Cihaz bulunamadı, lütfen kontrol edip tekrar deneyin')
            })
            .finally(() => {
                setIsSearching(false)
            })
    }

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!searchQuery.trim()) {
            toast.error('Lütfen barkod veya künye numarası girin')
            return
        }

        setIsSearching(true)
        try {
            // API'ye sorgu at
            const res = await fetch(`/api/public/device-lookup?query=${encodeURIComponent(searchQuery)}`)
            if (res.ok) {
                const data = await res.json()
                // Handle both old format (direct object) and new format (wrapped in success/data)
                const device = data.success ? data.data : data
                setFoundDevice(device)
                setStep('FORM')
            } else {
                const errorData = await res.json().catch(() => ({}))
                const errorMessage = errorData?.error?.message || errorData?.error || errorData?.message || 'Cihaz bulunamadı, lütfen kontrol edip tekrar deneyin'
                toast.error(typeof errorMessage === 'string' ? errorMessage : 'Cihaz bulunamadı, lütfen kontrol edip tekrar deneyin')
            }
        } catch (error) {
            console.error('Search error:', error)
            toast.error('Bir hata oluştu')
        } finally {
            setIsSearching(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!foundDevice || !reportForm.description) return

        // Validate description length
        if (reportForm.description.trim().length < 10) {
            toast.error('Arıza açıklaması en az 10 karakter olmalıdır')
            return
        }

        // Map CRITICAL to URGENT if needed (for backward compatibility)
        const urgency = reportForm.urgency === 'CRITICAL' ? 'URGENT' : reportForm.urgency

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/public/fault-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId: foundDevice.id,
                    hospitalId: foundDevice.hospitalId,
                    description: reportForm.description.trim(),
                    urgency: urgency || 'MEDIUM',
                    reporterName: reportForm.reporterName.trim(),
                    reporterPhone: reportForm.reporterPhone?.trim() || undefined,
                    reporterTitle: reportForm.reporterTitle?.trim() || undefined,
                })
            })

            if (res.ok) {
                const data = await res.json()
                // Handle both old format (direct object) and new format (wrapped in success/data)
                const responseData = data.success ? data.data : data
                setReferenceNumber(responseData?.reportNumber || responseData?.workOrderNumber || 'BAŞARILI')
                setStep('SUCCESS')
            } else {
                const errorData = await res.json()
                // Handle error response format: {success: false, error: {message, code, details}} or {error: "message"}
                let errorMessage = 'Bildirim gönderilemedi'

                if (errorData?.error) {
                    if (typeof errorData.error === 'string') {
                        errorMessage = errorData.error
                    } else if (errorData.error.message) {
                        errorMessage = errorData.error.message
                        // If it's a Zod validation error, show details
                        if (errorData.error.details && Array.isArray(errorData.error.details)) {
                            const validationErrors = errorData.error.details
                                .map((err: any) => err.message || err.path?.join('.') || '')
                                .filter(Boolean)
                                .join(', ')
                            if (validationErrors) {
                                errorMessage = `${errorMessage}: ${validationErrors}`
                            }
                        }
                    }
                } else if (errorData?.message) {
                    errorMessage = errorData.message
                }

                toast.error(errorMessage)
            }
        } catch (error) {
            console.error('Submit error:', error)
            toast.error('Bir hata oluştu. Lütfen tekrar deneyin.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const [trackingCode, setTrackingCode] = useState('')
    const [trackingResult, setTrackingResult] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<'REPORT' | 'TRACK'>('REPORT')
    const [emergencyPhone, setEmergencyPhone] = useState<string>('')

    useEffect(() => {
        fetch('/api/settings')
            .then(r => r.ok ? r.json() : null)
            .then(res => {
                const s = res?.data || res
                if (s?.emergencyPhone) setEmergencyPhone(s.emergencyPhone)
            })
            .catch(() => {})
    }, [])

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!trackingCode.trim()) return

        setIsSearching(true)
        setTrackingResult(null)
        try {
            const res = await fetch(`/api/public/fault-tracking?code=${encodeURIComponent(trackingCode)}`)
            if (res.ok) {
                const data = await res.json()
                // Handle both old format (direct object) and new format (wrapped in success/data)
                const responseData = data.success ? data.data : data
                setTrackingResult(responseData)
            } else {
                const errorData = await res.json()
                // Handle error response format: {success: false, error: {message, code, details}} or {error: "message"}
                const errorMessage = errorData?.error?.message || errorData?.error || errorData?.message || 'Kayıt bulunamadı'
                toast.error(typeof errorMessage === 'string' ? errorMessage : 'Kayıt bulunamadı')
            }
        } catch (error) {
            console.error('Tracking error:', error)
            toast.error('Bir hata oluştu')
        } finally {
            setIsSearching(false)
        }
    }

    const resetForm = () => {
        setStep('SEARCH')
        setSearchQuery('')
        setFoundDevice(null)
        setReportForm({ description: '', urgency: 'MEDIUM', reporterName: '', reporterPhone: '', reporterTitle: '' })
        setReferenceNumber('')
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <Toaster position="top-center" />

            {showQRScanner && (
                <BarcodeReader
                    onScan={handleScan}
                    onClose={() => setShowQRScanner(false)}
                />
            )}

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                        <Smartphone className="h-10 w-10 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Arıza Bildirim Sistemi
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Tıbbi cihaz arızalarını bildirin veya durum sorgulayın
                </p>
                {emergencyPhone && (
                    <div className="mt-3 flex justify-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Acil Biyomedikal İletişim: <strong>{emergencyPhone}</strong>
                        </span>
                    </div>
                )}
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-100">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('REPORT')}
                            className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${activeTab === 'REPORT' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Arıza Bildir
                        </button>
                        <button
                            onClick={() => setActiveTab('TRACK')}
                            className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${activeTab === 'TRACK' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Durum Sorgula
                        </button>
                    </div>

                    <div className="py-8 px-4 sm:px-10">
                        {activeTab === 'REPORT' ? (
                            <>
                                {step === 'SEARCH' && (
                                    <form onSubmit={handleSearch} className="space-y-6">
                                        <div>
                                            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                                                Cihaz Künye No veya Barkod
                                            </label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Search className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    id="search"
                                                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-lg border-gray-300 rounded-md py-3 text-gray-900 bg-white"
                                                    placeholder="Örn: TAG-2025-001"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowQRScanner(true)}
                                                    className="absolute inset-y-0 right-0 px-3 flex items-center bg-gray-100 hover:bg-gray-200 border-l border-gray-300 rounded-r-md transition-colors"
                                                    title="QR Kod Tara"
                                                >
                                                    <QrCode className="h-5 w-5 text-gray-600" />
                                                    <span className="ml-2 text-sm text-gray-600 font-medium hidden sm:inline">QR Tara</span>
                                                </button>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-500 flex items-center">
                                                <Info className="h-4 w-4 mr-1" />
                                                Cihaz üzerindeki etiketi kontrol edin veya QR kodu okutun
                                            </p>
                                        </div>

                                        <div>
                                            <button
                                                type="submit"
                                                disabled={isSearching || !searchQuery.trim()}
                                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                            >
                                                {isSearching ? 'Aranıyor...' : 'Cihazı Bul'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {step === 'FORM' && foundDevice && (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="bg-blue-50 p-4 rounded-md mb-6 border border-blue-100">
                                            <h3 className="text-lg font-medium text-blue-900">{foundDevice.name}</h3>
                                            <p className="text-sm text-blue-700">{foundDevice.brand} {foundDevice.model}</p>
                                            <div className="flex space-x-4 mt-2 text-xs text-blue-600">
                                                <span className="px-2 py-1 bg-white rounded border border-blue-200">{foundDevice.tagNumber}</span>
                                                <span className="px-2 py-1 bg-white rounded border border-blue-200">{foundDevice.serialNumber}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Arıza Açıklaması <span className="text-red-500">*</span></label>
                                            <textarea
                                                required
                                                rows={4}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white"
                                                placeholder="Lütfen sorunu detaylı açıklayın..."
                                                value={reportForm.description}
                                                onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Aciliyet</label>
                                            <select
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white"
                                                value={reportForm.urgency}
                                                onChange={(e) => setReportForm({ ...reportForm, urgency: e.target.value })}
                                            >
                                                <option value="LOW">Düşük - Kullanıma engel değil</option>
                                                <option value="MEDIUM">Orta - Kullanımı kısıtlıyor</option>
                                                <option value="HIGH">Yüksek - Cihaz çalışmıyor</option>
                                                <option value="URGENT">Kritik - Hasta güvenliğini etkiliyor</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Adınız Soyadınız <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white"
                                                    placeholder="Ad Soyad"
                                                    value={reportForm.reporterName}
                                                    onChange={(e) => setReportForm({ ...reportForm, reporterName: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Ünvanınız <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white"
                                                    placeholder="Doktor, Hemşire vb."
                                                    value={reportForm.reporterTitle}
                                                    onChange={(e) => setReportForm({ ...reportForm, reporterTitle: e.target.value })}
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700">Telefon Numaranız <span className="text-red-500">*</span></label>
                                                <input
                                                    type="tel"
                                                    required
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white"
                                                    placeholder="05XX XXX XX XX"
                                                    value={reportForm.reporterPhone}
                                                    onChange={(e) => setReportForm({ ...reportForm, reporterPhone: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <button
                                                type="button"
                                                onClick={() => setStep('SEARCH')}
                                                className="flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                            >
                                                Geri
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                            >
                                                {isSubmitting ? 'Gönderiliyor...' : 'Arıza Bildir'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {step === 'SUCCESS' && (
                                    <div className="text-center py-8">
                                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                                            <CheckCircle className="h-8 w-8 text-green-600" />
                                        </div>
                                        <h3 className="mt-4 text-2xl font-bold text-gray-900">Bildirim Alındı!</h3>
                                        <p className="mt-2 text-gray-600">
                                            Arıza bildiriminiz başarıyla sisteme kaydedildi.
                                        </p>
                                        <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Referans Kodu</p>
                                            <p className="text-3xl font-mono font-bold text-blue-600 mt-1">{referenceNumber}</p>
                                            <p className="text-xs text-gray-500 mt-2">Bu kod ile "Durum Sorgula" sekmesinden takibini yapabilirsiniz.</p>
                                        </div>
                                        <div className="mt-8 flex flex-col space-y-3">
                                            <button
                                                onClick={() => {
                                                    setTrackingCode(referenceNumber)
                                                    setActiveTab('TRACK')
                                                }}
                                                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                            >
                                                Durumu Görüntüle
                                            </button>
                                            <button
                                                onClick={resetForm}
                                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                                            >
                                                Yeni Bildirim Yap
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="space-y-6">
                                <form onSubmit={handleTrack} className="space-y-4">
                                    <div>
                                        <label htmlFor="trackingCode" className="block text-sm font-medium text-gray-700">
                                            Referans Kodu
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="text"
                                                id="trackingCode"
                                                className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-lg border-gray-300 rounded-md py-3 uppercase text-gray-900 bg-white"
                                                placeholder="WO-XXXX-XXXX"
                                                value={trackingCode}
                                                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSearching || !trackingCode.trim()}
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                    >
                                        {isSearching ? 'Sorgulanıyor...' : 'Sorgula'}
                                    </button>
                                </form>

                                {trackingResult && trackingResult.device && (
                                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-gray-900">Arıza Durumu</h3>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${trackingResult.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                trackingResult.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                {trackingResult.status === 'COMPLETED' ? 'Tamamlandı' :
                                                    trackingResult.status === 'IN_PROGRESS' ? 'İşlemde' :
                                                        trackingResult.status === 'OPEN' ? 'Açık' :
                                                            String(trackingResult.status || 'Bilinmiyor')}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            {trackingResult.device && (
                                                <div>
                                                    <p className="text-sm text-gray-500">Cihaz</p>
                                                    <p className="font-medium">{trackingResult.device.name || 'Bilinmiyor'}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {trackingResult.device.brand || ''} {trackingResult.device.model || ''}
                                                    </p>
                                                </div>
                                            )}

                                            {trackingResult.createdAt && (
                                                <div>
                                                    <p className="text-sm text-gray-500">Bildirim Tarihi</p>
                                                    <p className="font-medium">
                                                        {new Date(trackingResult.createdAt).toLocaleDateString('tr-TR')}
                                                    </p>
                                                </div>
                                            )}

                                            {trackingResult.completedAt && (
                                                <div>
                                                    <p className="text-sm text-gray-500">Tamamlanma Tarihi</p>
                                                    <p className="font-medium text-green-600">
                                                        {new Date(trackingResult.completedAt).toLocaleDateString('tr-TR')}
                                                    </p>
                                                </div>
                                            )}

                                            {trackingResult.actions && (
                                                <div>
                                                    <p className="text-sm text-gray-500">Yapılan İşlemler</p>
                                                    <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200 mt-1">
                                                        {String(trackingResult.actions)}
                                                    </p>
                                                </div>
                                            )}

                                            {trackingResult.description && (
                                                <div>
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="text-sm text-gray-500">Açıklama</p>
                                                            <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200 mt-1">
                                                                {String(trackingResult.description)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {trackingResult.cost && typeof trackingResult.cost === 'number' && (
                                                <div className="pt-2 border-t border-gray-200 mt-2">
                                                    <p className="text-sm text-gray-500">Maliyet</p>
                                                    <p className="font-bold text-lg text-gray-900">
                                                        ₺{trackingResult.cost.toLocaleString('tr-TR')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function ReportFaultPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>}>
            <ReportFaultContent />
        </Suspense>
    )
}
