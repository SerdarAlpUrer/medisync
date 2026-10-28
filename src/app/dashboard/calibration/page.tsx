'use client'

import { useState, useEffect } from 'react'
import {
    FileBarChart,
    Plus,
    Calendar,
    CheckCircle,
    Clock,
    Search,
    Filter,
    Award,
    Download,
    X,
    Upload,
    AlertCircle,
    MapPin,
    Pencil,
    Trash2
} from 'lucide-react'
import { useToast } from '@/components/ToastProvider'
import { useHospital } from '@/contexts/HospitalContext'
import { exportCalibrationsToExcel } from '@/lib/export'
import { parseCalibrationExcel } from '@/lib/import'
import Link from 'next/link'

export default function CalibrationPage() {
    const [calibrations, setCalibrations] = useState<any[]>([])
    const [devices, setDevices] = useState<any[]>([])
    const [technicians, setTechnicians] = useState<any[]>([])
    const [locations, setLocations] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('ALL')
    const [filterLocation, setFilterLocation] = useState('ALL')
    const [filterDeviceType, setFilterDeviceType] = useState('ALL')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [importFile, setImportFile] = useState<File | null>(null)
    const [importResults, setImportResults] = useState<any>(null)
    const [isImporting, setIsImporting] = useState(false)
    const { showSuccess, showError } = useToast()
    const { activeHospital } = useHospital()
    const [unmatchedCount, setUnmatchedCount] = useState(0)

    // New Calibration State
    const [newCalibration, setNewCalibration] = useState({
        deviceId: '',
        status: 'SCHEDULED',
        scheduledDate: new Date().toISOString().split('T')[0],
        completedDate: '',
        validityPeriod: 12, // months
        expiryDate: '',
        calibrationLab: '',
        technicianId: '',
        cost: '',
        certificateNumber: ''
    })

    // Edit/Delete State
    const [editingCalibration, setEditingCalibration] = useState<any>(null)
    const [showEditModal, setShowEditModal] = useState(false)
    const [deletingCalibration, setDeletingCalibration] = useState<any>(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    // Bulk Delete State
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)
    const [isDeleteMode, setIsDeleteMode] = useState(false)

    // Import Progress State
    const [importProgressState, setImportProgressState] = useState({
        stage: '', // 'reading', 'parsing', 'uploading', 'processing', 'done', 'error'
        message: '',
        totalRecords: 0,
        processedRecords: 0,
        fileName: ''
    })



    useEffect(() => {
        fetchData()
        fetch('/api/settings')
            .then(r => r.ok ? r.json() : null)
            .then(res => {
                const s = res?.data || res
                if (s?.defaultCalibrationInterval) {
                    const months = Math.max(1, Math.round(Number(s.defaultCalibrationInterval) / 30))
                    setNewCalibration(prev => ({ ...prev, validityPeriod: months }))
                }
            })
            .catch(() => {})
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            if (params.get('action') === 'new') {
                setShowAddModal(true)
            }
        }
    }, [activeHospital])

    const fetchData = async (silent = false) => {
        try {
            if (!silent) setIsLoading(true)

            const queryParams = activeHospital ? `?hospitalId=${activeHospital.id}` : ''
            const [calibrationsRes, devicesRes, techniciansRes, locationsRes, unmatchedRes] = await Promise.all([
                fetch(`/api/calibration${queryParams}`),
                fetch(`/api/devices${queryParams}`),
                fetch(`/api/users?role=TECHNICIAN${activeHospital ? `&hospitalId=${activeHospital.id}` : ''}`),
                fetch(`/api/locations${queryParams}`),
                fetch('/api/calibration/unmatched')
            ])

            if (calibrationsRes.ok && devicesRes.ok) {
                const calibrationsData = await calibrationsRes.json()
                const rawDevices = await devicesRes.json()
                const devicesData = Array.isArray(rawDevices)
                    ? rawDevices
                    : (rawDevices.data?.devices || rawDevices.devices || rawDevices.data || [])
                setCalibrations(Array.isArray(calibrationsData) ? calibrationsData : [])
                setDevices(Array.isArray(devicesData) ? devicesData : [])
            }

            if (techniciansRes.ok) {
                setTechnicians(await techniciansRes.json())
            }

            if (locationsRes.ok) {
                const rawLocations = await locationsRes.json()
                const uniqueLocations = Array.isArray(rawLocations)
                    ? rawLocations.filter((loc: any, idx: number, arr: any[]) =>
                        arr.findIndex((x: any) => x.name?.trim().toLowerCase() === loc.name?.trim().toLowerCase()) === idx
                    )
                    : []
                setLocations(uniqueLocations)
            }

            if (unmatchedRes.ok) {
                const unmatchedData = await unmatchedRes.json()
                setUnmatchedCount(unmatchedData.length)
            }

        } catch (error) {
            console.error('Error fetching data:', error)
            showError('Veriler yüklenirken hata oluştu')
        } finally {
            if (!silent) setIsLoading(false)
        }
    }

    const handleAddCalibration = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const selectedDevice = devices.find(d => d.id === newCalibration.deviceId)
            if (!selectedDevice) {
                showError('Lütfen bir cihaz seçin')
                return
            }

            const res = await fetch('/api/calibration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId: newCalibration.deviceId,
                    status: newCalibration.status,
                    scheduledDate: newCalibration.scheduledDate,
                    completedDate: newCalibration.completedDate || undefined,
                    expiryDate: newCalibration.expiryDate || undefined,
                    calibrationLab: newCalibration.calibrationLab,
                    technicianId: newCalibration.technicianId || undefined,
                    cost: newCalibration.cost,
                    certificateNumber: newCalibration.certificateNumber,
                    hospitalId: selectedDevice.hospitalId,
                })
            })

            if (res.ok) {
                showSuccess('Kalibrasyon kaydı oluşturuldu')
                setShowAddModal(false)
                setNewCalibration({
                    deviceId: '',
                    status: 'SCHEDULED',
                    scheduledDate: new Date().toISOString().split('T')[0],
                    completedDate: '',
                    validityPeriod: 12,
                    expiryDate: '',
                    calibrationLab: '',
                    technicianId: '',
                    cost: '',
                    certificateNumber: ''
                })
                fetchData(true)
            } else {
                showError('Kalibrasyon kaydı oluşturulamadı')
            }
        } catch (error) {
            showError('Bir hata oluştu')
        }
    }

    // Calculate next calibration date based on completed date and validity period
    const calculateExpiryDate = (completedDate: string, validityMonths: number): string => {
        if (!completedDate) return ''
        const date = new Date(completedDate)
        date.setMonth(date.getMonth() + validityMonths)
        return date.toISOString().split('T')[0]
    }

    // Handle completed date change
    const handleCompletedDateChange = (date: string) => {
        setNewCalibration(prev => {
            const expiryDate = date ? calculateExpiryDate(date, prev.validityPeriod) : ''
            return {
                ...prev,
                completedDate: date,
                expiryDate,
                status: date ? 'COMPLETED' : prev.status
            }
        })
    }

    // Handle validity period change
    const handleValidityPeriodChange = (months: number) => {
        setNewCalibration(prev => {
            const expiryDate = prev.completedDate ? calculateExpiryDate(prev.completedDate, months) : ''
            return {
                ...prev,
                validityPeriod: months,
                expiryDate
            }
        })
    }

    const handleExportExcel = () => {
        exportCalibrationsToExcel(filteredCalibrations)
        showSuccess('Excel dosyası indirildi')
    }

    const handleEditClick = (calibration: any) => {
        setEditingCalibration({
            ...calibration,
            scheduledDate: calibration.scheduledDate ? new Date(calibration.scheduledDate).toISOString().split('T')[0] : '',
            completedDate: calibration.completedDate ? new Date(calibration.completedDate).toISOString().split('T')[0] : '',
            expiryDate: calibration.expiryDate ? new Date(calibration.expiryDate).toISOString().split('T')[0] : '',
            deviceId: calibration.device?.id || '',
            technicianId: calibration.technician?.id || '',
            cost: calibration.cost || ''
        })
        setShowEditModal(true)
    }

    const handleDeleteClick = (calibration: any) => {
        setDeletingCalibration(calibration)
        setShowDeleteModal(true)
    }

    const handleConfirmDelete = async () => {
        if (!deletingCalibration) return

        try {
            const res = await fetch(`/api/calibration/${deletingCalibration.id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                showSuccess('Kalibrasyon kaydı silindi')
                setShowDeleteModal(false)
                setDeletingCalibration(null)
                fetchData(true)
            } else {
                showError('Silme işlemi başarısız oldu')
            }
        } catch (error) {
            showError('Bir hata oluştu')
        }
    }

    const handleUpdateCalibration = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingCalibration) return

        try {
            const res = await fetch(`/api/calibration/${editingCalibration.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: editingCalibration.status,
                    scheduledDate: editingCalibration.scheduledDate,
                    completedDate: editingCalibration.completedDate || null,
                    expiryDate: editingCalibration.expiryDate || null,
                    calibrationLab: editingCalibration.calibrationLab,
                    technicianId: editingCalibration.technicianId || null,
                    cost: editingCalibration.cost,
                    result: editingCalibration.result,
                    certificateNumber: editingCalibration.certificateNumber
                })
            })

            if (res.ok) {
                showSuccess('Kalibrasyon kaydı güncellendi')
                setShowEditModal(false)
                setEditingCalibration(null)
                fetchData(true)
            } else {
                showError('Güncelleme başarısız oldu')
            }
        } catch (error) {
            showError('Bir hata oluştu')
        }
    }


    // ... existing code ...

    const handleImportExcel = async () => {
        if (!importFile) {
            showError('Lütfen bir dosya seçin')
            return
        }

        setIsImporting(true)
        setImportResults(null)

        // Stage 1: Reading
        setImportProgressState({
            stage: 'reading',
            message: 'Dosya okunuyor...',
            totalRecords: 0,
            processedRecords: 0,
            fileName: importFile.name
        })

        try {
            // Stage 2: Parsing
            setImportProgressState(prev => ({
                ...prev,
                stage: 'parsing',
                message: 'Excel dosyası ayrıştırılıyor...'
            }))

            // Parse Excel file
            const { data, errors: parseErrors } = await parseCalibrationExcel(importFile)

            if (parseErrors.length > 0) {
                setImportProgressState(prev => ({
                    ...prev,
                    stage: 'error',
                    message: `${parseErrors.length} ayrıştırma hatası bulundu`
                }))
                setImportResults({
                    success: false,
                    successCount: 0,
                    errorCount: parseErrors.length,
                    errors: parseErrors.map(err => ({
                        row: err.row,
                        serialNumber: '',
                        message: `${err.field}: ${err.message}`
                    }))
                })
                setIsImporting(false)
                return
            }

            // Stage 3: Uploading
            setImportProgressState(prev => ({
                ...prev,
                stage: 'processing',
                message: 'Kayıtlar işleniyor...'
            }))

            // Real import
            const response = await fetch('/api/calibration/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    calibrations: data,
                    hospitalId: activeHospital?.id
                })
            })

                const results = await response.json()
                setImportResults(results)

                if (results.unmatched && results.unmatched.length > 0) {
                    setUnmatchedCount(results.unmatched.length)
                }

                if (results.success) {
                    // Stage 5: Done
                    setImportProgressState(prev => ({
                        ...prev,
                        stage: 'done',
                        message: `${results.successCount} kayıt başarıyla aktarıldı`,
                        processedRecords: results.successCount
                    }))
                    showSuccess(`${results.successCount} kalibrasyon kaydı başarıyla eklendi`)
                    fetchData(true) // Refresh data
                } else {
                    setImportProgressState(prev => ({
                        ...prev,
                        stage: 'error',
                        message: `${results.errorCount} kayıt eklenemedi`
                    }))
                    showError(`${results.errorCount} kayıt eklenemedi. Detaylar için sonuçlara bakın.`)
                }
        } catch (error) {
            console.error('Import error:', error)
            setImportProgressState(prev => ({
                ...prev,
                stage: 'error',
                message: 'Import işlemi başarısız oldu'
            }))
            showError('Import işlemi başarısız oldu')
            setImportResults({
                success: false,
                successCount: 0,
                errorCount: 1,
                errors: [{ row: 0, serialNumber: '', message: error instanceof Error ? error.message : 'Bilinmeyen hata' }]
            })
        } finally {
            setTimeout(() => setIsImporting(false), 1500)
        }
    }

    // ... existing code ...

    const handleCloseImportModal = () => {
        setShowImportModal(false)
        setImportFile(null)
        setImportResults(null)
    }

    const filteredCalibrations = calibrations.filter(cal => {
        const deviceName = cal.device?.name || ''
        const deviceLocation = cal.device?.location?.name || ''
        const matchesSearch = deviceName.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesFilter = filterStatus === 'ALL' || cal.status === filterStatus
        const matchesLocation = filterLocation === 'ALL' || deviceLocation === filterLocation
        const matchesDeviceType = filterDeviceType === 'ALL' || deviceName === filterDeviceType
        return matchesSearch && matchesFilter && matchesLocation && matchesDeviceType
    })

    // Derive unique device types from calibrations for dynamic filtering
    const availableDeviceTypes: string[] = Array.from(
        new Set(calibrations.map(cal => cal.device?.name).filter(Boolean))
    ).sort() as string[]

    // Bulk Selection Handlers
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredCalibrations.map(c => c.id))
        } else {
            setSelectedIds([])
        }
    }

    const handleSelectOne = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return

        setIsBulkDeleting(true)
        try {
            const res = await fetch('/api/calibration', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            })

            if (res.ok) {
                const result = await res.json()
                showSuccess(result.message || 'Seçilen kayıtlar silindi')
                setShowBulkDeleteModal(false)
                setSelectedIds([])
                fetchData(true)
            } else {
                showError('Silme işlemi başarısız oldu')
            }
        } catch (error) {
            showError('Bir hata oluştu')
        } finally {
            setIsBulkDeleting(false)
        }
    }





    const stats = {
        completed: calibrations.filter(c => c.status === 'COMPLETED').length,
        inProgress: calibrations.filter(c => c.status === 'IN_PROGRESS').length,
        scheduled: calibrations.filter(c => c.status === 'SCHEDULED').length,
        total: calibrations.length,
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-64">Yükleniyor...</div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kalibrasyon Yönetimi</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Cihaz kalibrasyon işlemlerini ve sertifikalarını yönetin</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleExportExcel}
                        className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 px-4 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
                    >
                        <Upload className="h-5 w-5" />
                        <span>Excel'e Aktar</span>
                    </button>
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 px-4 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
                    >
                        <Download className="h-5 w-5" />
                        <span>Excel'den Aktar</span>
                    </button>
                    <Link
                        href="/dashboard/calibration/unmatched"
                        className="bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50 px-4 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors border border-orange-200 dark:border-orange-800"
                    >
                        <AlertCircle className="h-5 w-5" />
                        <span>Eşleşmeyen Kayıtlar</span>
                        {unmatchedCount > 0 && (
                            <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full ml-1">
                                {unmatchedCount}
                            </span>
                        )}
                    </Link>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors duration-150"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Yeni Kalibrasyon Planla</span>
                    </button>

                    {/* Bulk Delete Controls */}
                    <div className="flex items-center space-x-2 border-l border-gray-200 dark:border-gray-700 pl-4 ml-2">
                        {!isDeleteMode ? (
                            <button
                                onClick={() => setIsDeleteMode(true)}
                                className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 px-4 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors border border-red-200 dark:border-red-900/30"
                            >
                                <Trash2 className="h-5 w-5" />
                                <span>Kalibrasyon Sil</span>
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        setIsDeleteMode(false)
                                        setSelectedIds([])
                                    }}
                                    className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    İptal
                                </button>
                                {selectedIds.length > 0 && (
                                    <button
                                        onClick={() => setShowBulkDeleteModal(true)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors shadow-sm"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                        <span>Seçilenleri Sil ({selectedIds.length})</span>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Toplam" value={stats.total} icon={<FileBarChart />} color="blue" />
                <StatCard label="Tamamlandı" value={stats.completed} icon={<CheckCircle />} color="green" />
                <StatCard label="Devam Ediyor" value={stats.inProgress} icon={<Clock />} color="orange" />
                <StatCard label="Planlandı" value={stats.scheduled} icon={<Calendar />} color="purple" />
            </div>
            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Cihaz adı ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <select
                            value={filterDeviceType}
                            onChange={(e) => setFilterDeviceType(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        >
                            <option value="ALL">Tüm Cihaz Türleri</option>
                            {availableDeviceTypes.map((typeName) => (
                                <option key={typeName} value={typeName}>{typeName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        >
                            <option value="ALL">Tüm Durumlar</option>
                            <option value="SCHEDULED">Planlandı</option>
                            <option value="IN_PROGRESS">Devam Ediyor</option>
                            <option value="COMPLETED">Tamamlandı</option>
                        </select>
                    </div>

                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <select
                            value={filterLocation}
                            onChange={(e) => setFilterLocation(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        >
                            <option value="ALL">Tüm Lokasyonlar</option>
                            {locations.map((loc) => (
                                <option key={loc.id} value={loc.name}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

            </div>


            {/* Calibration List */}
            <div className="grid grid-cols-1 gap-4">
                {/* Select All Checkbox (Only show if there are items AND in delete mode) */}
                {filteredCalibrations.length > 0 && isDeleteMode && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow px-6 py-3 flex items-center">
                        <input
                            type="checkbox"
                            checked={selectedIds.length === filteredCalibrations.length && filteredCalibrations.length > 0}
                            onChange={handleSelectAll}
                            className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tümünü Seç ({filteredCalibrations.length})
                        </span>
                    </div>
                )}

                {filteredCalibrations.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow">
                        <FileBarChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Kalibrasyon kaydı bulunamadı</h3>
                        <p className="text-gray-500 dark:text-gray-400">Yeni bir kalibrasyon planlayarak başlayın.</p>
                    </div>
                ) : (
                    filteredCalibrations.map((calibration) => (
                        <div key={calibration.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow ${selectedIds.includes(calibration.id) ? 'ring-2 ring-blue-500' : ''}`}>
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                {/* Checkbox */}
                                <div className="flex items-start">
                                    {isDeleteMode && (
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(calibration.id)}
                                            onChange={() => handleSelectOne(calibration.id)}
                                            className="mt-1 h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-4"
                                        />
                                    )}
                                    {/* Left side - Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                                    {calibration.device?.name || 'Bilinmeyen Cihaz'}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{calibration.calibrationLab}</p>
                                            </div>
                                            {calibration.result && <ResultBadge result={calibration.result} />}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                            <InfoItem
                                                icon={<MapPin className="h-4 w-4" />}
                                                label="Lokasyon"
                                                value={calibration.device?.location?.name || 'Belirtilmemiş'}
                                            />
                                            <InfoItem
                                                icon={<Calendar className="h-4 w-4" />}
                                                label="Planlanan Tarih"
                                                value={new Date(calibration.scheduledDate).toLocaleDateString('tr-TR')}
                                            />
                                            {calibration.completedDate && (
                                                <InfoItem
                                                    icon={<CheckCircle className="h-4 w-4" />}
                                                    label="Tamamlanma"
                                                    value={new Date(calibration.completedDate).toLocaleDateString('tr-TR')}
                                                />
                                            )}
                                            {calibration.expiryDate && (
                                                <InfoItem
                                                    icon={<Award className="h-4 w-4" />}
                                                    label="Geçerlilik"
                                                    value={new Date(calibration.expiryDate).toLocaleDateString('tr-TR')}
                                                />
                                            )}
                                            <InfoItem
                                                icon={<Clock className="h-4 w-4" />}
                                                label="Teknisyen"
                                                value={calibration.technician?.name || 'Atanmamış'}
                                            />
                                        </div>

                                        {calibration.certificateNumber && (
                                            <div className="mt-3 flex items-center space-x-3">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Sertifika No:</span>
                                                <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-300">{calibration.certificateNumber}</span>
                                                <a
                                                    href={`/api/certificates/${calibration.certificateNumber}.pdf`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center space-x-1"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    <span>İndir</span>
                                                </a>
                                            </div>
                                        )}


                                    </div>


                                </div>

                                {/* Right side - Status */}
                                <div className="flex flex-col items-end space-y-3">
                                    <CalibrationStatusBadge status={calibration.status} />
                                    <a
                                        href={`/dashboard/devices/${calibration.device?.id}`}
                                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
                                    >
                                        Detaylar →
                                    </a>
                                    <div className="flex space-x-2 mt-2">
                                        <button
                                            onClick={() => handleEditClick(calibration)}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Düzenle"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(calibration)}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Sil"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {/* Add Calibration Modal */}
            {
                showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Yeni Kalibrasyon Planla</h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAddCalibration} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cihaz</label>
                                    <select
                                        required
                                        value={newCalibration.deviceId}
                                        onChange={(e) => setNewCalibration({ ...newCalibration, deviceId: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Cihaz Seçin</option>
                                        {devices.map(device => (
                                            <option key={device.id} value={device.id}>
                                                {device.name} - {device.serialNumber}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Planlanan Tarih</label>
                                        <input
                                            type="date"
                                            required
                                            value={newCalibration.scheduledDate}
                                            onChange={(e) => setNewCalibration({ ...newCalibration, scheduledDate: e.target.value })}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durum</label>
                                        <select
                                            value={newCalibration.status}
                                            onChange={(e) => setNewCalibration({ ...newCalibration, status: e.target.value })}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="SCHEDULED">Planlandı</option>
                                            <option value="IN_PROGRESS">Devam Ediyor</option>
                                            <option value="COMPLETED">Tamamlandı</option>
                                            <option value="FAILED">Başarısız</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Kalibrasyon Yapılış Tarihi
                                        </label>
                                        <input
                                            type="date"
                                            value={newCalibration.completedDate}
                                            onChange={(e) => handleCompletedDateChange(e.target.value)}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Girilirse durum otomatik "Tamamlandı" olur
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Geçerlilik Süresi
                                        </label>
                                        <select
                                            value={newCalibration.validityPeriod}
                                            onChange={(e) => handleValidityPeriodChange(parseInt(e.target.value))}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="6">6 Ay</option>
                                            <option value="12">12 Ay</option>
                                        </select>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Yapılış tarihine göre otomatik hesaplanır
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Gelecek Kalibrasyon Tarihi
                                    </label>
                                    <input
                                        type="date"
                                        value={newCalibration.expiryDate}
                                        onChange={(e) => setNewCalibration({ ...newCalibration, expiryDate: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Otomatik hesaplanır veya manuel girin"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {newCalibration.completedDate && newCalibration.expiryDate
                                            ? `${newCalibration.validityPeriod} ay sonrası: ${new Date(newCalibration.expiryDate).toLocaleDateString('tr-TR')}`
                                            : 'Kalibrasyon yapılış tarihi girilince otomatik hesaplanır'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kalibrasyon Laboratuvarı</label>
                                        <input
                                            type="text"
                                            value={newCalibration.calibrationLab}
                                            onChange={(e) => setNewCalibration({ ...newCalibration, calibrationLab: e.target.value })}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Örn: Ulusal Akreditasyon Lab."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sertifika No</label>
                                        <input
                                            type="text"
                                            value={newCalibration.certificateNumber || ''}
                                            onChange={(e) => setNewCalibration({ ...newCalibration, certificateNumber: e.target.value })}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Sertifika numarası"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teknisyen</label>
                                    <select
                                        value={newCalibration.technicianId}
                                        onChange={(e) => setNewCalibration({ ...newCalibration, technicianId: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Teknisyen Seçin (Opsiyonel)</option>
                                        {technicians.map(tech => (
                                            <option key={tech.id} value={tech.id}>
                                                {tech.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>



                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                    >
                                        Kaydet
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Bulk Delete Confirmation Modal */}
            {
                showBulkDeleteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
                            <div className="flex items-center justify-center mb-4 text-red-600 bg-red-100 dark:bg-red-900/30 w-12 h-12 rounded-full mx-auto">
                                <Trash2 className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                                Toplu Silme Onayı
                            </h3>
                            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                                Seçili {selectedIds.length} kalibrasyon kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowBulkDeleteModal(false)}
                                    disabled={isBulkDeleting}
                                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={isBulkDeleting}
                                    className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex justify-center items-center"
                                >
                                    {isBulkDeleting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Siliniyor...
                                        </>
                                    ) : (
                                        'Evet, Sil'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }





            {/* Unmatched Calibrations Modal */}

            {/* Import Modal */}
            {
                showImportModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                                <h2 className="text-xl font-bold text-gray-900">Excel'den Kalibrasyon Aktar</h2>
                                <button
                                    onClick={handleCloseImportModal}
                                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Instructions */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-blue-900 mb-2">Kullanım Talimatları:</h3>
                                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                        <li>Önce "Excel'e Aktar" butonuna tıklayarak şablon dosyayı indirin</li>
                                        <li>Excel dosyasında kalibrasyon kayıtlarını doldurun</li>
                                        <li>Seri No ve Planlanan Tarih alanları zorunludur</li>
                                        <li>Dosyayı kaydedin ve buradan yükleyin</li>
                                    </ol>
                                </div>

                                {/* File Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Excel Dosyası Seçin
                                    </label>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        disabled={isImporting}
                                    />
                                    {importFile && (
                                        <p className="mt-2 text-sm text-gray-600">
                                            Seçilen dosya: <span className="font-medium">{importFile.name}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Import Progress Steps */}
                                {isImporting && (
                                    <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">İçe Aktarma Durumu</h4>
                                        <div className="space-y-2">
                                            <CalibrationProgressStep
                                                label="Dosya Okunuyor"
                                                isActive={importProgressState.stage === 'reading'}
                                                isCompleted={['parsing', 'uploading', 'processing', 'done'].includes(importProgressState.stage)}
                                                isError={importProgressState.stage === 'error'}
                                            />
                                            <CalibrationProgressStep
                                                label="Excel Ayrıştırılıyor"
                                                isActive={importProgressState.stage === 'parsing'}
                                                isCompleted={['uploading', 'processing', 'done'].includes(importProgressState.stage)}
                                                isError={importProgressState.stage === 'error'}
                                            />
                                            <CalibrationProgressStep
                                                label="Sunucuya Gönderiliyor"
                                                isActive={importProgressState.stage === 'uploading'}
                                                isCompleted={['processing', 'done'].includes(importProgressState.stage)}
                                                isError={importProgressState.stage === 'error'}
                                            />
                                            <CalibrationProgressStep
                                                label="Kayıtlar İşleniyor"
                                                isActive={importProgressState.stage === 'processing'}
                                                isCompleted={importProgressState.stage === 'done'}
                                                isError={importProgressState.stage === 'error'}
                                            />
                                        </div>
                                        <p className={`text-sm mt-3 font-medium ${importProgressState.stage === 'error' ? 'text-red-600' :
                                            importProgressState.stage === 'done' ? 'text-green-600' :
                                                'text-blue-600'
                                            }`}>
                                            {importProgressState.message}
                                        </p>
                                        {importProgressState.totalRecords > 0 && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Toplam {importProgressState.totalRecords} kayıt
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Import Results */}
                                {importResults && (
                                    <div className="mt-4">
                                        <div className={`border rounded-lg p-4 ${importResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                            }`}>
                                            <h3 className={`font-semibold mb-2 ${importResults.success ? 'text-green-900' : 'text-red-900'
                                                }`}>
                                                İçe Aktarma Sonuçları
                                            </h3>
                                            <div className="space-y-1 text-sm">
                                                <p className="text-green-700">
                                                    ✓ Başarılı: {importResults.successCount} kayıt
                                                </p>
                                                {importResults.errorCount > 0 && (
                                                    <p className="text-red-700">
                                                        ✗ Hatalı: {importResults.errorCount} kayıt
                                                    </p>
                                                )}
                                                {importResults.unmatchedCount > 0 && (
                                                    <p className="text-orange-700">
                                                        ! Eşleşmeyen: {importResults.unmatchedCount} cihaz
                                                    </p>
                                                )}
                                            </div>

                                            {/* Error Details */}
                                            {importResults.errors && importResults.errors.length > 0 && (
                                                <div className="mt-3 max-h-48 overflow-y-auto">
                                                    <p className="font-medium text-red-900 mb-2">Hatalar:</p>
                                                    <ul className="space-y-1 text-sm text-red-800">
                                                        {importResults.errors.map((error: any, idx: number) => (
                                                            <li key={idx} className="flex items-start space-x-2">
                                                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                                <span>
                                                                    Satır {error.row}: {error.message}
                                                                    {error.serialNumber && ` (${error.serialNumber})`}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                                <button
                                    onClick={handleCloseImportModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                    disabled={isImporting}
                                >
                                    {importResults ? 'Kapat' : 'İptal'}
                                </button>
                                {!importResults && (
                                    <button
                                        onClick={handleImportExcel}
                                        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                        disabled={!importFile || isImporting}
                                    >
                                        {isImporting && (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                        )}
                                        <span>{isImporting ? 'Aktarılıyor...' : 'İçe Aktar'}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Modal */}
            {
                showEditModal && editingCalibration && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Kalibrasyon Düzenle</h2>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateCalibration} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Planlanan Tarih</label>
                                        <input
                                            type="date"
                                            required
                                            value={editingCalibration.scheduledDate}
                                            onChange={(e) => setEditingCalibration({ ...editingCalibration, scheduledDate: e.target.value })}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durum</label>
                                        <select
                                            value={editingCalibration.status}
                                            onChange={(e) => setEditingCalibration({ ...editingCalibration, status: e.target.value })}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="SCHEDULED">Planlandı</option>
                                            <option value="IN_PROGRESS">Devam Ediyor</option>
                                            <option value="COMPLETED">Tamamlandı</option>
                                            <option value="FAILED">Başarısız</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Kalibrasyon Yapılış Tarihi
                                        </label>
                                        <input
                                            type="date"
                                            value={editingCalibration.completedDate}
                                            onChange={(e) => setEditingCalibration({ ...editingCalibration, completedDate: e.target.value })}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Geçerlilik Tarihi
                                        </label>
                                        <input
                                            type="date"
                                            value={editingCalibration.expiryDate}
                                            onChange={(e) => setEditingCalibration({ ...editingCalibration, expiryDate: e.target.value })}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kalibrasyon Laboratuvarı</label>
                                        <input
                                            type="text"
                                            value={editingCalibration.calibrationLab}
                                            onChange={(e) => setEditingCalibration({ ...editingCalibration, calibrationLab: e.target.value })}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teknisyen</label>
                                        <select
                                            value={editingCalibration.technicianId}
                                            onChange={(e) => setEditingCalibration({ ...editingCalibration, technicianId: e.target.value })}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Teknisyen Seçin</option>
                                            {technicians.map(tech => (
                                                <option key={tech.id} value={tech.id}>
                                                    {tech.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sonuç</label>
                                        <select
                                            value={editingCalibration.result || ''}
                                            onChange={(e) => setEditingCalibration({ ...editingCalibration, result: e.target.value })}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Seçiniz</option>
                                            <option value="PASSED">KULLANIMA UYGUNDUR</option>
                                            <option value="PASSED_WITH_ADJUSTMENT">SINIRLI KULLANIMA UYGUNDUR</option>
                                            <option value="FAILED">KULLANIMA UYGUN DEĞİLDİR</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sertifika No</label>
                                        <input
                                            type="text"
                                            value={editingCalibration.certificateNumber || ''}
                                            onChange={(e) => setEditingCalibration({ ...editingCalibration, certificateNumber: e.target.value })}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>



                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                    >
                                        Güncelle
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                showDeleteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
                            <div className="flex items-center justify-center mb-4 text-red-600">
                                <AlertCircle className="h-12 w-12" />
                            </div>
                            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                                Kalibrasyon Kaydını Sil
                            </h3>
                            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                                Bu kalibrasyon kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                            </p>
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                                >
                                    Sil
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Unmatched Devices Modal - Removed Duplicate */}

        </div>
    )
}


function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        orange: 'from-orange-500 to-orange-600',
        purple: 'from-purple-500 to-purple-600',
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between">
            <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
            <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} w-10 h-10 rounded-lg flex items-center justify-center text-white`}>
                {icon}
            </div>
        </div>
    )
}

function CalibrationStatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { label: string; className: string }> = {
        VALID: { label: 'Geçerli', className: 'badge-success' },
        SCHEDULED: { label: 'Planlandı', className: 'badge-info' },
        IN_PROGRESS: { label: 'Devam Ediyor', className: 'badge-warning' },
        COMPLETED: { label: 'Tamamlandı', className: 'badge-success' },
        FAILED: { label: 'Başarısız', className: 'badge-danger' },
        EXPIRED: { label: 'Süresi Dolmuş', className: 'badge-danger' },
        EXPIRING_SOON: { label: 'Yaklaşıyor', className: 'badge-warning' },
    }

    const config = statusConfig[status] || { label: status, className: 'badge-gray' }
    return <span className={`badge ${config.className}`}>{config.label}</span>
}

function ResultBadge({ result }: { result: string }) {
    const resultConfig: Record<string, { label: string; className: string }> = {
        PASSED: { label: 'KULLANIMA UYGUNDUR', className: 'badge-success' },
        PASSED_WITH_ADJUSTMENT: { label: 'SINIRLI KULLANIMA UYGUNDUR', className: 'badge-warning' },
        FAILED: { label: 'KULLANIMA UYGUN DEĞİLDİR', className: 'badge-danger' },
        PENDING: { label: 'DEĞERLENDİRME BEKLİYOR', className: 'badge-warning' },
    }

    const config = resultConfig[result] || { label: result, className: 'badge-gray' }
    return (
        <span className={`badge ${config.className} flex items-center space-x-1`}>
            <Award className="h-3 w-3" />
            <span>{config.label}</span>
        </span>
    )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center space-x-2">
            <div className="text-gray-400 dark:text-gray-500">{icon}</div>
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
            </div>
        </div>
    )
}

// Progress Step Component for Import Modal
function CalibrationProgressStep({ label, isActive, isCompleted, isError }: {
    label: string;
    isActive: boolean;
    isCompleted: boolean;
    isError: boolean;
}) {
    return (
        <div className="flex items-center space-x-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isError ? 'bg-red-100 dark:bg-red-900/30' :
                isCompleted ? 'bg-green-100 dark:bg-green-900/30' :
                    isActive ? 'bg-blue-100 dark:bg-blue-900/30' :
                        'bg-gray-100 dark:bg-gray-700'
                }`}>
                {isError ? (
                    <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                ) : isCompleted ? (
                    <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                ) : isActive ? (
                    <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
                ) : (
                    <div className="h-2 w-2 bg-gray-300 dark:bg-gray-500 rounded-full" />
                )}
            </div>
            <span className={`text-sm transition-colors ${isError ? 'text-red-600 dark:text-red-400' :
                isCompleted ? 'text-green-600 dark:text-green-400' :
                    isActive ? 'text-blue-600 dark:text-blue-400 font-medium' :
                        'text-gray-400 dark:text-gray-500'
                }`}>
                {label}
            </span>
        </div>
    )
}
