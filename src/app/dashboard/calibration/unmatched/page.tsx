'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Search,
    Filter,
    ArrowLeft,
    CheckCircle,
    Plus,
    Trash2,
    AlertCircle,
    Save,
    X
} from 'lucide-react'
import { useToast } from '@/components/ToastProvider'
import { useHospital } from '@/contexts/HospitalContext'

export default function UnmatchedPage() {
    const router = useRouter()
    const { showSuccess, showError } = useToast()
    const { activeHospital } = useHospital()

    // State
    const [unmatchedDevices, setUnmatchedDevices] = useState<any[]>([])
    const [devices, setDevices] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Matching State
    const [matchingCalibration, setMatchingCalibration] = useState<any>(null)
    const [matchingDeviceId, setMatchingDeviceId] = useState('')
    const [deviceSearchTerm, setDeviceSearchTerm] = useState('')

    // Force Save State
    const [showLegalModal, setShowLegalModal] = useState(false)
    const [forceSaveCalibration, setForceSaveCalibration] = useState<any>(null)

    // Bulk State
    const [selectedUnmatchedIds, setSelectedUnmatchedIds] = useState<string[]>([])
    const [isBulkSaving, setIsBulkSaving] = useState(false)

    // Filters
    const [unmatchedFilters, setUnmatchedFilters] = useState({
        deviceName: '',
        brand: '',
        model: '',
        location: '',
        category: ''
    })

    useEffect(() => {
        fetchData()
    }, [activeHospital])

    const fetchData = async () => {
        try {
            setIsLoading(true)
            const queryParams = activeHospital ? `?hospitalId=${activeHospital.id}` : ''

            const [unmatchedRes, devicesRes] = await Promise.all([
                fetch(`/api/calibration/unmatched${queryParams}`),
                fetch(`/api/devices${queryParams}`)
            ])

            if (unmatchedRes.ok) {
                setUnmatchedDevices(await unmatchedRes.json())
            }

            if (devicesRes.ok) {
                setDevices(await devicesRes.json())
            }
        } catch (error) {
            console.error('Error fetching data:', error)
            showError('Veriler yüklenirken hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    // Filter Logic
    const filteredUnmatched = unmatchedDevices.filter(cal =>
        (!unmatchedFilters.deviceName || cal.deviceName?.toLowerCase().includes(unmatchedFilters.deviceName.toLowerCase())) &&
        (!unmatchedFilters.brand || cal.brand?.toLowerCase().includes(unmatchedFilters.brand.toLowerCase())) &&
        (!unmatchedFilters.model || cal.model?.toLowerCase().includes(unmatchedFilters.model.toLowerCase())) &&
        (!unmatchedFilters.location || cal.location?.toLowerCase().includes(unmatchedFilters.location.toLowerCase())) &&
        (!unmatchedFilters.category || cal.deviceName?.toLowerCase().includes(unmatchedFilters.category.toLowerCase()))
    )

    const uniqueDeviceNames = Array.from(new Set(unmatchedDevices.map(d => d.deviceName).filter(Boolean))).sort()
    const uniqueLocations = Array.from(new Set(unmatchedDevices.map(d => d.location).filter(Boolean))).sort()

    // Handlers
    const handleMatchCalibration = async () => {
        if (!matchingCalibration || !matchingDeviceId) return

        try {
            const res = await fetch('/api/calibration/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId: matchingDeviceId,
                    calibration: matchingCalibration,
                    unmatchedId: matchingCalibration.id
                })
            })

            if (res.ok) {
                showSuccess('Kalibrasyon kaydı eşleştirildi ve oluşturuldu')
                setUnmatchedDevices(prev => prev.filter(d => d.id !== matchingCalibration.id))
                setMatchingCalibration(null)
                setMatchingDeviceId('')
                setDeviceSearchTerm('')
            } else {
                showError('Eşleştirme başarısız oldu')
            }
        } catch (error) {
            showError('Bir hata oluştu')
        }
    }

    const handleForceSave = (calibration: any) => {
        setForceSaveCalibration(calibration)
        setShowLegalModal(true)
    }

    const handleConfirmForceSave = async () => {
        // Bulk Save
        if (selectedUnmatchedIds.length > 0) {
            await handleBulkForceSave()
            return
        }

        // Single Save
        if (!forceSaveCalibration) return

        try {
            const res = await fetch('/api/calibration/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    createDevice: true,
                    calibration: forceSaveCalibration,
                    unmatchedId: forceSaveCalibration.id,
                    hospitalId: activeHospital?.id
                })
            })

            if (res.ok) {
                showSuccess('Cihaz oluşturuldu ve kalibrasyon kaydedildi')
                setShowLegalModal(false)
                setForceSaveCalibration(null)
                setUnmatchedDevices(prev => prev.filter(d => d.id !== forceSaveCalibration.id))
            } else {
                const error = await res.json()
                showError(error.error || 'İşlem başarısız oldu')
            }
        } catch (error) {
            showError('Bir hata oluştu')
        }
    }

    const handleBulkForceSave = async () => {
        setIsBulkSaving(true)
        let successCount = 0
        let failCount = 0

        try {
            for (const id of selectedUnmatchedIds) {
                const calibration = unmatchedDevices.find(d => d.id === id)
                if (!calibration) continue

                try {
                    const res = await fetch('/api/calibration/match', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            createDevice: true,
                            calibration: calibration,
                            unmatchedId: id,
                            hospitalId: activeHospital?.id
                        })
                    })

                    if (res.ok) successCount++
                    else failCount++
                } catch (e) {
                    failCount++
                }
            }

            if (successCount > 0) {
                showSuccess(`${successCount} cihaz başarıyla oluşturuldu`)
                setUnmatchedDevices(prev => prev.filter(d => !selectedUnmatchedIds.includes(d.id)))
                setSelectedUnmatchedIds([])
                setShowLegalModal(false)
            }

            if (failCount > 0) {
                showError(`${failCount} kayıt işlenirken hata oluştu`)
            }
        } catch (error) {
            showError('Toplu işlem sırasında hata oluştu')
        } finally {
            setIsBulkSaving(false)
        }
    }

    const handleDeleteUnmatched = async (id: string) => {
        if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return

        try {
            const res = await fetch(`/api/calibration/unmatched?id=${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                showSuccess('Kayıt silindi')
                setUnmatchedDevices(prev => prev.filter(d => d.id !== id))
            } else {
                const data = await res.json()
                showError(data.error || 'Silme işlemi başarısız oldu')
            }
        } catch (error) {
            showError('Bir hata oluştu')
        }
    }

    const handleBulkDeleteUnmatched = async () => {
        if (!confirm(`${selectedUnmatchedIds.length} kaydı silmek istediğinize emin misiniz?`)) return

        try {
            const res = await fetch('/api/calibration/unmatched', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedUnmatchedIds })
            })

            if (res.ok) {
                showSuccess(`${selectedUnmatchedIds.length} kayıt silindi`)
                setUnmatchedDevices(prev => prev.filter(d => !selectedUnmatchedIds.includes(d.id)))
                setSelectedUnmatchedIds([])
            } else {
                const data = await res.json()
                showError(data.error || 'Silme işlemi başarısız oldu')
            }
        } catch (error) {
            showError('Bir hata oluştu')
        }
    }

    const toggleUnmatchedSelection = (id: string) => {
        setSelectedUnmatchedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleSelectAllUnmatched = () => {
        if (selectedUnmatchedIds.length === filteredUnmatched.length) {
            setSelectedUnmatchedIds([])
        } else {
            setSelectedUnmatchedIds(filteredUnmatched.map(c => c.id))
        }
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link
                        href="/dashboard/calibration"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                            Eşleşmeyen Kayıtlar
                            <span className="ml-3 px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full font-medium">
                                {unmatchedDevices.length} Kayıt
                            </span>
                        </h1>
                        <p className="text-gray-500 mt-1">Excel'den aktarılan ancak sistemdeki cihazlarla eşleşmeyen kayıtlar</p>
                    </div>
                </div>

                {selectedUnmatchedIds.length > 0 && (
                    <div className="flex items-center space-x-3 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            {selectedUnmatchedIds.length} kayıt seçildi
                        </span>
                        <div className="h-4 w-px bg-blue-200 dark:bg-blue-700 mx-2"></div>
                        <button
                            onClick={() => setShowLegalModal(true)}
                            disabled={isBulkSaving}
                            className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center"
                        >
                            <Save className="h-4 w-4 mr-1" />
                            Toplu Kaydet
                        </button>
                        <button
                            onClick={handleBulkDeleteUnmatched}
                            className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center ml-3"
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Toplu Sil
                        </button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Cihaz Adı Ara..."
                        value={unmatchedFilters.deviceName}
                        onChange={(e) => setUnmatchedFilters({ ...unmatchedFilters, deviceName: e.target.value })}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                    />
                </div>
                <select
                    value={unmatchedFilters.category}
                    onChange={(e) => setUnmatchedFilters({ ...unmatchedFilters, category: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                >
                    <option value="">Tüm Cihaz Türleri</option>
                    {uniqueDeviceNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>
                <select
                    value={unmatchedFilters.location}
                    onChange={(e) => setUnmatchedFilters({ ...unmatchedFilters, location: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                >
                    <option value="">Tüm Lokasyonlar</option>
                    {uniqueLocations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder="Marka Ara..."
                    value={unmatchedFilters.brand}
                    onChange={(e) => setUnmatchedFilters({ ...unmatchedFilters, brand: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                />
                <input
                    type="text"
                    placeholder="Model Ara..."
                    value={unmatchedFilters.model}
                    onChange={(e) => setUnmatchedFilters({ ...unmatchedFilters, model: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={selectedUnmatchedIds.length === filteredUnmatched.length && filteredUnmatched.length > 0}
                                onChange={handleSelectAllUnmatched}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mr-2"
                            />
                            <span className="text-sm text-gray-500">Tümünü Seç</span>
                        </div>
                        <span className="text-sm text-gray-500">{filteredUnmatched.length} sonuç</span>
                    </div>

                    {filteredUnmatched.map(cal => (
                        <div
                            key={cal.id}
                            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all cursor-pointer ${matchingCalibration?.id === cal.id
                                ? 'border-blue-500 ring-1 ring-blue-500'
                                : 'border-gray-100 dark:border-gray-700 hover:border-blue-300'
                                }`}
                            onClick={() => {
                                if (matchingCalibration?.id === cal.id) {
                                    setMatchingCalibration(null)
                                    setMatchingDeviceId('')
                                } else {
                                    setMatchingCalibration(cal)
                                    setMatchingDeviceId('')
                                    setDeviceSearchTerm('')
                                }
                            }}
                        >
                            <div className="p-4">
                                <div className="flex items-start gap-3">
                                    <div
                                        className="mt-1"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedUnmatchedIds.includes(cal.id)}
                                            onChange={() => toggleUnmatchedSelection(cal.id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">{cal.deviceName}</h3>
                                                <div className="flex flex-col gap-1 mt-1">
                                                    <p className="text-sm text-gray-500 font-mono">
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">Seri No:</span> {cal.deviceSerialNumber || '-'}
                                                    </p>
                                                    {cal.certificateNumber && (
                                                        <p className="text-xs text-blue-600 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded inline-block w-fit">
                                                            Sertifika: {cal.certificateNumber}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex space-x-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleForceSave(cal)
                                                    }}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                                    title="Yeni Cihaz Olarak Ekle"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteUnmatched(cal.id)
                                                    }}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Sil"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                                            <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                                <span className="text-gray-500 text-xs block">Marka/Model</span>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                                    {cal.brand || '-'} / {cal.model || '-'}
                                                </span>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                                <span className="text-gray-500 text-xs block">Lokasyon</span>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                                    {cal.location || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Matching Panel (Sticky) */}
                <div className="lg:sticky lg:top-6 h-fit space-y-4">
                    {matchingCalibration ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-blue-100 dark:border-blue-900 overflow-hidden">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
                                <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center">
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                    Eşleştirme Yapılıyor
                                </h3>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                    "{matchingCalibration.deviceName}" için cihaz seçin
                                </p>
                            </div>

                            <div className="p-4 space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <input
                                        type="text"
                                        placeholder="Cihaz ara (Ad, Seri No, Marka)..."
                                        value={deviceSearchTerm}
                                        onChange={(e) => setDeviceSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        autoFocus
                                    />
                                </div>

                                <div className="max-h-[60vh] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                                    {devices
                                        .filter(d =>
                                            d.name.toLowerCase().includes(deviceSearchTerm.toLowerCase()) ||
                                            d.serialNumber.toLowerCase().includes(deviceSearchTerm.toLowerCase()) ||
                                            d.brand?.toLowerCase().includes(deviceSearchTerm.toLowerCase())
                                        )
                                        .slice(0, 50) // Show more results since we have space
                                        .map(device => (
                                            <button
                                                key={device.id}
                                                onClick={() => setMatchingDeviceId(device.id)}
                                                className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 flex justify-between items-center border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors ${matchingDeviceId === device.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                                                    }`}
                                            >
                                                <div className="flex-1">
                                                    <div className={`font-medium ${matchingDeviceId === device.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                                                        {device.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                                                        <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                                            {device.serialNumber}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{device.brand} {device.model}</span>
                                                        <span>•</span>
                                                        <span>{device.location?.name || 'Lokasyon Yok'}</span>
                                                    </div>
                                                </div>
                                                {matchingDeviceId === device.id && (
                                                    <CheckCircle className="h-5 w-5 text-blue-600 ml-2" />
                                                )}
                                            </button>
                                        ))
                                    }
                                    {devices.length === 0 && (
                                        <div className="p-4 text-center text-gray-500">
                                            Cihaz bulunamadı
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setMatchingCalibration(null)
                                            setMatchingDeviceId('')
                                        }}
                                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        onClick={handleMatchCalibration}
                                        disabled={!matchingDeviceId}
                                        className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                    >
                                        Eşleştir ve Kaydet
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
                            <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
                                <Search className="h-full w-full" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Eşleştirme Yapılacak Kayıt Seçin</h3>
                            <p className="text-gray-500 mt-1 max-w-xs mx-auto">
                                Soldaki listeden bir kayda tıklayarak eşleştirme işlemini başlatabilirsiniz.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Legal Warning Modal for Force Save */}
            {showLegalModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-orange-100 rounded-full mb-4">
                                <AlertCircle className="h-6 w-6 text-orange-600" />
                            </div>
                            <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">
                                Yasal Uyarı
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                                {selectedUnmatchedIds.length > 0
                                    ? `${selectedUnmatchedIds.length} adet cihazı yeni kayıt olarak eklemek üzeresiniz.`
                                    : "Bu cihazı yeni bir kayıt olarak eklemek üzeresiniz."
                                }
                                <br /><br />
                                Bu işlem geri alınamaz ve cihaz envanterine yeni kayıtlar eklenecektir. Onaylıyor musunuz?
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowLegalModal(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleConfirmForceSave}
                                    className="flex-1 px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700"
                                >
                                    Onaylıyorum
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
