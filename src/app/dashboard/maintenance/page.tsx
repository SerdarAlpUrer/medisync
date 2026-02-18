'use client'

import { useState, useEffect } from 'react'
import {
    Wrench,
    Plus,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    Search,
    Filter,
    X,
    FileText,
    Download
} from 'lucide-react'
import { useToast } from '@/components/ToastProvider'
import { demoMaintenances, demoDevices, demoUsers } from '@/lib/demo-data'
import { useHospital } from '@/contexts/HospitalContext'

export default function MaintenancePage() {
    const [maintenances, setMaintenances] = useState<any[]>([])
    const [devices, setDevices] = useState<any[]>([])
    const [technicians, setTechnicians] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('ALL')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null)
    const [editingMaintenance, setEditingMaintenance] = useState<any>(null)
    const { showSuccess, showError } = useToast()
    const { activeHospital } = useHospital()

    // New Maintenance State
    const [newMaintenance, setNewMaintenance] = useState({
        deviceId: '',
        type: 'PREVENTIVE',
        status: 'SCHEDULED',
        priority: 'MEDIUM',
        scheduledDate: new Date().toISOString().split('T')[0],
        technicianId: '',
        description: '',
        cost: ''
    })

    // Kademeli cihaz seçici filtreleri
    const [deviceFilterLocation, setDeviceFilterLocation] = useState('')
    const [deviceFilterBrand, setDeviceFilterBrand] = useState('')
    const [deviceFilterName, setDeviceFilterName] = useState('')
    const [deviceFilterCategory, setDeviceFilterCategory] = useState('')

    useEffect(() => {
        fetchData()
    }, [activeHospital])

    const fetchData = async () => {
        try {
            setIsLoading(true)

            // Check Demo Mode
            const savedSettings = localStorage.getItem('appSettings')
            const isDemoMode = savedSettings ? JSON.parse(savedSettings).demoMode : false

            if (isDemoMode) {
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 500))
                setMaintenances(demoMaintenances as any)
                setDevices(demoDevices as any)
                setTechnicians(demoUsers.filter(u => u.role === 'TECHNICIAN') as any)
                setIsLoading(false)
                return
            }

            const queryParams = activeHospital ? `?hospitalId=${activeHospital.id}` : ''
            const [maintenancesRes, devicesRes, techniciansRes] = await Promise.all([
                fetch(`/api/maintenance${queryParams}`),
                fetch(`/api/devices${queryParams}`),
                fetch(`/api/users?role=TECHNICIAN${activeHospital ? `&hospitalId=${activeHospital.id}` : ''}`)
            ])

            if (maintenancesRes.ok && devicesRes.ok) {
                const maintenancesResponse = await maintenancesRes.json()
                const devicesResponse = await devicesRes.json()
                // Handle both old format (direct array) and new format (wrapped in success/data)
                const maintenancesData = Array.isArray(maintenancesResponse)
                    ? maintenancesResponse
                    : (maintenancesResponse.data?.devices || maintenancesResponse.data || maintenancesResponse)
                const devicesData = Array.isArray(devicesResponse)
                    ? devicesResponse
                    : (devicesResponse.data?.devices || devicesResponse.data || devicesResponse)
                setMaintenances(Array.isArray(maintenancesData) ? maintenancesData : [])
                setDevices(Array.isArray(devicesData) ? devicesData : [])
            }

            if (techniciansRes.ok) {
                setTechnicians(await techniciansRes.json())
            }

        } catch (error) {
            console.error('Error fetching data:', error)
            showError('Veriler yüklenirken hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddMaintenance = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            // Find the selected device to get its hospitalId
            const selectedDevice = devices.find(d => d.id === newMaintenance.deviceId)
            if (!selectedDevice) {
                showError('Lütfen bir cihaz seçin')
                return
            }

            // Check Demo Mode
            const savedSettings = localStorage.getItem('appSettings')
            const isDemoMode = savedSettings ? JSON.parse(savedSettings).demoMode : false

            if (isDemoMode) {
                const demoNewMaintenance = {
                    ...newMaintenance,
                    id: Math.random().toString(36).substr(2, 9),
                    device: selectedDevice,
                    technician: technicians.find(t => t.id === newMaintenance.technicianId) || { name: 'Demo Teknisyen' },
                    createdAt: new Date().toISOString()
                }
                setMaintenances([demoNewMaintenance, ...maintenances])
                showSuccess('Demo modunda bakım kaydı oluşturuldu')
                setShowAddModal(false)
                setNewMaintenance({
                    deviceId: '',
                    type: 'PREVENTIVE',
                    status: 'SCHEDULED',
                    priority: 'MEDIUM',
                    scheduledDate: new Date().toISOString().split('T')[0],
                    technicianId: '',
                    description: '',
                    cost: ''
                })
                return
            }

            const res = await fetch('/api/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newMaintenance,
                    hospitalId: selectedDevice.hospitalId, // Assign to device's hospital
                })
            })

            if (res.ok) {
                showSuccess('Bakım kaydı oluşturuldu')
                setShowAddModal(false)
                setNewMaintenance({
                    deviceId: '',
                    type: 'PREVENTIVE',
                    status: 'SCHEDULED',
                    priority: 'MEDIUM',
                    scheduledDate: new Date().toISOString().split('T')[0],
                    technicianId: '',
                    description: '',
                    cost: ''
                })
                fetchData()
            } else {
                const errorData = await res.json()
                showError(errorData.error || 'Bakım kaydı oluşturulamadı')
            }
        } catch (error) {
            showError('Bir hata oluştu')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu bakım kaydını silmek istediğinizden emin misiniz?')) {
            return
        }

        try {
            // Find the record to determine if it's a WorkOrder
            const record = maintenances.find(m => m.id === id)
            const isWorkOrder = record?.isWorkOrder || false

            const res = await fetch(`/api/maintenance?id=${id}&isWorkOrder=${isWorkOrder}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                showSuccess('Bakım kaydı silindi')
                fetchData()
            } else {
                showError('Bakım kaydı silinemedi')
            }
        } catch (error) {
            showError('Bir hata oluştu')
        }
    }

    const handleViewDetails = (maintenance: any) => {
        setSelectedMaintenance(maintenance)
        setShowDetailModal(true)
    }

    const handleEdit = (maintenance: any) => {
        setEditingMaintenance({
            id: maintenance.id,
            deviceId: maintenance.deviceId,
            type: maintenance.type,
            status: maintenance.status,
            priority: maintenance.priority,
            scheduledDate: new Date(maintenance.scheduledDate || maintenance.createdAt || new Date()).toISOString().split('T')[0],
            technicianId: maintenance.technicianId || '',
            description: maintenance.description || '',
            actions: maintenance.actions || maintenance.actionsToken || '',
            cost: maintenance.cost || '',
            isWorkOrder: maintenance.isWorkOrder || false
        })
        setShowEditModal(true)
    }

    const handleUpdateMaintenance = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/maintenance', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingMaintenance)
            })

            if (res.ok) {
                showSuccess('Bakım kaydı güncellendi')
                setShowEditModal(false)
                setEditingMaintenance(null)
                fetchData()
            } else {
                showError('Bakım kaydı güncellenemedi')
            }
        } catch (error) {
            showError('Bir hata oluştu')
        }
    }

    const filteredMaintenances = maintenances.filter(maintenance => {
        const deviceName = maintenance.device?.name || ''
        const matchesSearch = deviceName.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesFilter = filterStatus === 'ALL' || maintenance.status === filterStatus
        return matchesSearch && matchesFilter
    })

    const stats = {
        completed: maintenances.filter(m => m.status === 'COMPLETED').length,
        inProgress: maintenances.filter(m => m.status === 'IN_PROGRESS').length,
        scheduled: maintenances.filter(m => m.status === 'SCHEDULED').length,
        total: maintenances.length,
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-64">Yükleniyor...</div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bakım Yönetimi</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Cihaz bakım ve onarım işlemlerini yönetin</p>
                </div>
                <div className="flex space-x-3">
                    <a
                        href="/report-fault"
                        target="_blank"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors duration-150"
                    >
                        <AlertTriangle className="h-5 w-5" />
                        <span>Arıza İsteği Ekranı</span>
                    </a>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors duration-150"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Yeni Bakım Planla</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Toplam" value={stats.total} icon={<Wrench />} color="blue" />
                <StatCard label="Tamamlandı" value={stats.completed} icon={<CheckCircle />} color="green" />
                <StatCard label="Devam Ediyor" value={stats.inProgress} icon={<Clock />} color="orange" />
                <StatCard label="Planlandı" value={stats.scheduled} icon={<Calendar />} color="purple" />
            </div>

            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
            </div>

            {/* Maintenance List */}
            <div className="grid grid-cols-1 gap-4">
                {filteredMaintenances.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow">
                        <Wrench className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Bakım kaydı bulunamadı</h3>
                        <p className="text-gray-500 dark:text-gray-400">Yeni bir bakım planlayarak başlayın.</p>
                    </div>
                ) : (
                    filteredMaintenances.map((maintenance) => (
                        <div key={maintenance.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                {/* Left side - Info */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                                {maintenance.device?.name || 'Bilinmeyen Cihaz'}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                                {maintenance.device?.brand} {maintenance.device?.model}
                                            </p>

                                            {/* Location & Serial */}
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                {maintenance.device?.serialNumber && (
                                                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 font-mono">
                                                        SN: {maintenance.device.serialNumber}
                                                    </span>
                                                )}
                                                {maintenance.device?.location?.name && (
                                                    <span className="flex items-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                                                        📍 {maintenance.device.location.name}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-sm text-gray-600 dark:text-gray-300">{maintenance.description}</p>
                                        </div>
                                        <PriorityBadge priority={maintenance.priority} />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                        <InfoItem
                                            icon={<Wrench className="h-4 w-4" />}
                                            label="Bakım Tipi"
                                            value={getMaintenanceTypeLabel(maintenance.type)}
                                        />
                                        <InfoItem
                                            icon={<Calendar className="h-4 w-4" />}
                                            label="Planlanan Tarih"
                                            value={new Date(maintenance.scheduledDate).toLocaleDateString('tr-TR')}
                                        />
                                        <InfoItem
                                            icon={<Clock className="h-4 w-4" />}
                                            label="Teknisyen"
                                            value={maintenance.technician?.name || 'Atanmamış'}
                                        />
                                    </div>

                                    <div className="mt-3 text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">tahmini maliyet: </span>
                                        <span className="font-semibold text-gray-900 dark:text-gray-200">
                                            {maintenance.cost ? `₺${maintenance.cost.toLocaleString('tr-TR')}` : '₺0'}
                                        </span>
                                    </div>

                                    {/* Reporter Info */}
                                    {maintenance.reporterName && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center space-x-2 text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">Bildiren:</span>
                                                <span className="font-medium text-blue-900 dark:text-blue-300">{maintenance.reporterName}</span>
                                                {maintenance.reporterPhone && (
                                                    <span className="text-gray-400 dark:text-gray-500 text-xs">({maintenance.reporterPhone})</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right side - Status & Actions */}
                                <div className="flex flex-col items-end space-y-3">
                                    <MaintenanceStatusBadge status={maintenance.status} />
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch(`/api/maintenance/${maintenance.id}/procedure`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            frequency: 'Aylık',
                                                            requiredTools: ['Test cihazı', 'Temizlik malzemeleri'],
                                                            safetyPrecautions: ['Güç bağlantısını kesin', 'Ekipman kullanın']
                                                        })
                                                    })
                                                    if (response.ok) {
                                                        const data = await response.json()
                                                        const link = document.createElement('a')
                                                        link.href = data.pdf
                                                        link.download = data.filename || 'Bakim_Proseduru.pdf'
                                                        link.click()
                                                        showSuccess('Bakım prosedürü PDF indirildi')
                                                    } else {
                                                        showError('PDF oluşturulamadı')
                                                    }
                                                } catch (error) {
                                                    showError('Bir hata oluştu')
                                                }
                                            }}
                                            className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium text-sm flex items-center space-x-1"
                                            title="Bakım Prosedürü PDF"
                                        >
                                            <FileText className="h-4 w-4" />
                                            <span>Prosedür</span>
                                        </button>
                                        <button
                                            onClick={() => handleViewDetails(maintenance)}
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
                                        >
                                            Detaylar
                                        </button>
                                        <button
                                            onClick={() => handleEdit(maintenance)}
                                            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium text-sm"
                                        >
                                            Düzenle
                                        </button>
                                        <button
                                            onClick={() => handleDelete(maintenance.id)}
                                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-sm"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Maintenance Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Yeni Bakım Planla</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddMaintenance} className="p-6 space-y-4">
                            {/* Cihaz Seçici: Bağımsız Filtreler + Arama + Liste */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cihaz Seçin</label>

                                {/* Filtreler - Hepsi Bağımsız */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {/* Yazarak Arama */}
                                    <input
                                        type="text"
                                        placeholder="🔍 Cihaz ara..."
                                        value={deviceFilterName}
                                        onChange={(e) => setDeviceFilterName(e.target.value)}
                                        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                    />

                                    {/* Cihaz Türü Filtresi */}
                                    <select
                                        value={deviceFilterCategory}
                                        onChange={(e) => setDeviceFilterCategory(e.target.value)}
                                        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                    >
                                        <option value="">Tüm Türler</option>
                                        {[...new Set(devices.map(d => d.category?.name).filter(Boolean))].sort().map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>

                                    {/* Bölüm Filtresi */}
                                    <select
                                        value={deviceFilterLocation}
                                        onChange={(e) => setDeviceFilterLocation(e.target.value)}
                                        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                    >
                                        <option value="">Tüm Bölümler</option>
                                        {[...new Set(devices.map(d => d.location?.name).filter(Boolean))].sort().map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>

                                    {/* Marka Filtresi */}
                                    <select
                                        value={deviceFilterBrand}
                                        onChange={(e) => setDeviceFilterBrand(e.target.value)}
                                        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                    >
                                        <option value="">Tüm Markalar</option>
                                        {[...new Set(devices.map(d => d.brand).filter(Boolean))].sort().map(brand => (
                                            <option key={brand} value={brand}>{brand}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Filtrelenmiş Cihaz Listesi */}
                                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
                                    {(() => {
                                        const filtered = devices.filter(d => {
                                            const matchSearch = !deviceFilterName ||
                                                `${d.name} ${d.brand} ${d.model} ${d.serialNumber}`.toLowerCase().includes(deviceFilterName.toLowerCase())
                                            const matchLocation = !deviceFilterLocation || d.location?.name === deviceFilterLocation
                                            const matchBrand = !deviceFilterBrand || d.brand === deviceFilterBrand
                                            const matchCategory = !deviceFilterCategory || d.category?.name === deviceFilterCategory
                                            return matchSearch && matchLocation && matchBrand && matchCategory
                                        })

                                        if (filtered.length === 0) {
                                            return <p className="p-3 text-sm text-gray-500 text-center">Cihaz bulunamadı</p>
                                        }

                                        return filtered.map(device => (
                                            <div
                                                key={device.id}
                                                onClick={() => setNewMaintenance({ ...newMaintenance, deviceId: device.id })}
                                                className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${newMaintenance.deviceId === device.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white text-sm">{device.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{device.brand} {device.model}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-mono text-gray-600 dark:text-gray-400">{device.serialNumber}</p>
                                                        {device.location?.name && (
                                                            <p className="text-xs text-blue-600 dark:text-blue-400">📍 {device.location.name}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    })()}
                                </div>

                                {/* Seçili Cihaz Gösterimi */}
                                {newMaintenance.deviceId && (() => {
                                    const selectedDevice = devices.find(d => d.id === newMaintenance.deviceId)
                                    return selectedDevice && (
                                        <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-green-800 dark:text-green-200 text-sm">✓ {selectedDevice.name}</p>
                                                <p className="text-xs text-green-600 dark:text-green-400">
                                                    {selectedDevice.brand} {selectedDevice.model} | SN: {selectedDevice.serialNumber}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setNewMaintenance({ ...newMaintenance, deviceId: '' })}
                                                className="text-green-600 hover:text-green-800 p-1"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )
                                })()}

                                {!newMaintenance.deviceId && (
                                    <p className="text-xs text-red-500">* Lütfen listeden bir cihaz seçin</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bakım Tipi</label>
                                    <select
                                        value={newMaintenance.type}
                                        onChange={(e) => setNewMaintenance({ ...newMaintenance, type: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="PREVENTIVE">Önleyici Bakım</option>
                                        <option value="CORRECTIVE">Arıza Onarımı</option>
                                        <option value="PREDICTIVE">Öngörücü Bakım</option>
                                        <option value="INSPECTION">Muayene</option>
                                        <option value="EMERGENCY">Acil Müdahale</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Öncelik</label>
                                    <select
                                        value={newMaintenance.priority}
                                        onChange={(e) => setNewMaintenance({ ...newMaintenance, priority: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="LOW">Düşük</option>
                                        <option value="MEDIUM">Orta</option>
                                        <option value="HIGH">Yüksek</option>
                                        <option value="CRITICAL">Kritik</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Planlanan Tarih</label>
                                    <input
                                        type="date"
                                        required
                                        value={newMaintenance.scheduledDate}
                                        onChange={(e) => setNewMaintenance({ ...newMaintenance, scheduledDate: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teknisyen</label>
                                    <select
                                        value={newMaintenance.technicianId}
                                        onChange={(e) => setNewMaintenance({ ...newMaintenance, technicianId: e.target.value })}
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
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durum</label>
                                <select
                                    value={newMaintenance.status}
                                    onChange={(e) => setNewMaintenance({ ...newMaintenance, status: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="SCHEDULED">Planlandı</option>
                                    <option value="IN_PROGRESS">Devam Ediyor</option>
                                    <option value="COMPLETED">Tamamlandı</option>
                                    <option value="CANCELLED">İptal Edildi</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Açıklama</label>
                                <textarea
                                    rows={3}
                                    value={newMaintenance.description}
                                    onChange={(e) => setNewMaintenance({ ...newMaintenance, description: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Bakım detayları..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tahmini Maliyet (₺)</label>
                                <input
                                    type="number"
                                    value={newMaintenance.cost}
                                    onChange={(e) => setNewMaintenance({ ...newMaintenance, cost: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
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
                </div >
            )
            }

            {/* Detail Modal */}
            {
                showDetailModal && selectedMaintenance && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bakım Detayları</h2>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Device Info */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Cihaz Bilgileri</h3>
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2 text-gray-900 dark:text-gray-200">
                                        <p className="text-sm"><span className="font-medium">Cihaz:</span> {selectedMaintenance.device?.name}</p>
                                        <p className="text-sm"><span className="font-medium">Marka/Model:</span> {selectedMaintenance.device?.brand} {selectedMaintenance.device?.model}</p>
                                        <p className="text-sm"><span className="font-medium">Seri No:</span> {selectedMaintenance.device?.serialNumber}</p>
                                    </div>
                                </div>

                                {/* Maintenance Info */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Bakım Bilgileri</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Bakım Tipi</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{getMaintenanceTypeLabel(selectedMaintenance.type)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Durum</p>
                                            <MaintenanceStatusBadge status={selectedMaintenance.status} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Öncelik</p>
                                            <PriorityBadge priority={selectedMaintenance.priority} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Planlanan Tarih</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{new Date(selectedMaintenance.scheduledDate).toLocaleDateString('tr-TR')}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Teknisyen</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedMaintenance.technician?.name || 'Atanmamış'}</p>
                                        </div>
                                        {selectedMaintenance.cost && (
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Maliyet</p>
                                                <p className="font-medium text-gray-900 dark:text-white">₺{selectedMaintenance.cost.toLocaleString('tr-TR')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                {selectedMaintenance.description && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Açıklama</h3>
                                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{selectedMaintenance.description}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Bakım Prosedürü */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Bakım Prosedürü</h3>
                                    <button
                                        onClick={async () => {
                                            try {
                                                const response = await fetch(`/api/maintenance/${selectedMaintenance.id}/procedure`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        frequency: 'Aylık',
                                                        requiredTools: ['Test cihazı', 'Temizlik malzemeleri'],
                                                        safetyPrecautions: ['Güç bağlantısını kesin', 'Ekipman kullanın']
                                                    })
                                                })
                                                if (response.ok) {
                                                    const data = await response.json()
                                                    const link = document.createElement('a')
                                                    link.href = data.pdf
                                                    link.download = data.filename || 'Bakim_Proseduru.pdf'
                                                    link.click()
                                                    showSuccess('Bakım prosedürü PDF indirildi')
                                                } else {
                                                    showError('PDF oluşturulamadı')
                                                }
                                            } catch (error) {
                                                showError('Bir hata oluştu')
                                            }
                                        }}
                                        className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                                    >
                                        <FileText className="h-5 w-5" />
                                        <span>Bakım Prosedürü PDF Oluştur ve İndir</span>
                                    </button>
                                </div>

                                {/* Reporter Info (For Fault Reports) */}
                                {(selectedMaintenance.reporterName || selectedMaintenance.reporterPhone) && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Bildiren Kişi Bilgileri</h3>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 space-y-2">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-xs text-blue-500 dark:text-blue-400 font-semibold uppercase">Ad Soyad</p>
                                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">{selectedMaintenance.reporterName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-blue-500 dark:text-blue-400 font-semibold uppercase">Ünvan</p>
                                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">{selectedMaintenance.reporterTitle || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-blue-500 dark:text-blue-400 font-semibold uppercase">Telefon</p>
                                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">{selectedMaintenance.reporterPhone}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Timestamps */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Sistem Bilgileri</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Oluşturulma</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{new Date(selectedMaintenance.createdAt).toLocaleString('tr-TR')}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Son Güncelleme</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{new Date(selectedMaintenance.updatedAt).toLocaleString('tr-TR')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                >
                                    Kapat
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Modal */}
            {
                showEditModal && editingMaintenance && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bakım Kaydını Düzenle</h2>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateMaintenance} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cihaz</label>
                                    <select
                                        required
                                        value={editingMaintenance.deviceId}
                                        onChange={(e) => setEditingMaintenance({ ...editingMaintenance, deviceId: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        {devices.map(device => (
                                            <option key={device.id} value={device.id}>
                                                {device.name} - {device.serialNumber}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bakım Tipi</label>
                                        <select
                                            value={editingMaintenance.type}
                                            onChange={(e) => setEditingMaintenance({ ...editingMaintenance, type: e.target.value })}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="PREVENTIVE">Önleyici Bakım</option>
                                            <option value="CORRECTIVE">Arıza Onarımı</option>
                                            <option value="PREDICTIVE">Öngörücü Bakım</option>
                                            <option value="INSPECTION">Muayene</option>
                                            <option value="EMERGENCY">Acil Müdahale</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Öncelik</label>
                                        <select
                                            value={editingMaintenance.priority}
                                            onChange={(e) => setEditingMaintenance({ ...editingMaintenance, priority: e.target.value })}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="LOW">Düşük</option>
                                            <option value="MEDIUM">Orta</option>
                                            <option value="HIGH">Yüksek</option>
                                            <option value="CRITICAL">Kritik</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Planlanan Tarih</label>
                                        <input
                                            type="date"
                                            required
                                            value={editingMaintenance.scheduledDate}
                                            onChange={(e) => setEditingMaintenance({ ...editingMaintenance, scheduledDate: e.target.value })}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teknisyen</label>
                                        <select
                                            value={editingMaintenance.technicianId}
                                            onChange={(e) => setEditingMaintenance({ ...editingMaintenance, technicianId: e.target.value })}
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
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durum</label>
                                    <select
                                        value={editingMaintenance.status}
                                        onChange={(e) => setEditingMaintenance({ ...editingMaintenance, status: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="SCHEDULED">Planlandı</option>
                                        <option value="IN_PROGRESS">Devam Ediyor</option>
                                        <option value="COMPLETED">Tamamlandı</option>
                                        <option value="CANCELLED">İptal Edildi</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Açıklama</label>
                                    <textarea
                                        rows={3}
                                        value={editingMaintenance.description}
                                        onChange={(e) => setEditingMaintenance({ ...editingMaintenance, description: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Bakım detayları..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yapılan İşlemler</label>
                                    <textarea
                                        rows={3}
                                        value={editingMaintenance.actions}
                                        onChange={(e) => setEditingMaintenance({ ...editingMaintenance, actions: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Yapılan işlemleri detaylıca yazınız..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tahmini Maliyet (₺)</label>
                                    <input
                                        type="number"
                                        value={editingMaintenance.cost}
                                        onChange={(e) => setEditingMaintenance({ ...editingMaintenance, cost: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="0.00"
                                    />
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
                                        className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                                    >
                                        Güncelle
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    )
}

function StatCard({
    label,
    value,
    icon,
    color
}: {
    label: string
    value: number
    icon: React.ReactNode
    color: string
}) {
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

function MaintenanceStatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { label: string; className: string }> = {
        SCHEDULED: { label: 'Planlandı', className: 'badge-info' },
        IN_PROGRESS: { label: 'Devam Ediyor', className: 'badge-warning' },
        COMPLETED: { label: 'Tamamlandı', className: 'badge-success' },
        CANCELLED: { label: 'İptal Edildi', className: 'badge-danger' },
        OPEN: { label: 'Açık', className: 'badge-info' },
    }

    const config = statusConfig[status] || { label: status, className: 'badge-gray' }
    return <span className={`badge ${config.className}`}>{config.label}</span>
}

function PriorityBadge({ priority }: { priority: string }) {
    const priorityConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
        LOW: { label: 'Düşük', className: 'badge-info', icon: <Clock className="h-3 w-3" /> },
        MEDIUM: { label: 'Orta', className: 'badge-warning', icon: <AlertTriangle className="h-3 w-3" /> },
        HIGH: { label: 'Yüksek', className: 'badge-danger', icon: <AlertTriangle className="h-3 w-3" /> },
        CRITICAL: { label: 'Kritik', className: 'badge-danger', icon: <AlertTriangle className="h-3 w-3" /> },
    }

    const config = priorityConfig[priority] || { label: priority, className: 'badge-gray', icon: <Clock className="h-3 w-3" /> }
    return (
        <span className={`badge ${config.className} flex items-center space-x-1`}>
            {config.icon}
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

function getMaintenanceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        PREVENTIVE: 'Önleyici Bakım',
        CORRECTIVE: 'Arıza Onarımı',
        PREDICTIVE: 'Öngörücü Bakım',
        INSPECTION: 'Muayene',
        EMERGENCY: 'Acil Müdahale',
    }
    return labels[type] || type
}
