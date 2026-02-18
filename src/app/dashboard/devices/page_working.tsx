'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Plus,
  Download,
  Package,
  MapPin,
  Calendar,
  QrCode,
  Check,
  X,
  Edit2
} from 'lucide-react'
import { exportDevicesToExcel } from '@/lib/export'
import BarcodeReader from '@/components/BarcodeReader'
import { useToast } from '@/components/ToastProvider'
import { demoDevices } from '@/lib/demo-data'

const DEVICE_TYPES = {
  'Görüntüleme': [
    'MRI Cihazı',
    'BT Tarayıcı (CT)',
    'Röntgen Cihazı',
    'Ultrason Cihazı',
    'Mamografi Cihazı',
    'Floroskopi Cihazı'
  ],
  'Yaşam Destek': [
    'Ventilatör',
    'Defibrilatör',
    'Anestezi Cihazı',
    'Kalp Akciğer Makinesi',
    'İnfüzyon Pompası',
    'Oksijen Konsantratörü'
  ],
  'İzleme': [
    'Hasta Başı Monitörü',
    'EKG Cihazı',
    'Pulse Oksimetre',
    'Holter Monitörü',
    'Fetal Monitör',
    'Tansiyon Aleti'
  ],
  'Tedavi': [
    'Diyaliz Makinesi',
    'Radyoterapi Cihazı',
    'Fototerapi Cihazı',
    'Koter Cihazı',
    'Nebulizatör'
  ],
  'Laboratuvar': [
    'Mikroskop',
    'Santrifüj',
    'Kan Analiz Cihazı',
    'Otoklav',
    'İnkübatör',
    'Biyokimya Analizörü'
  ],
  'Demirbaş': [
    'Tekerlekli Sandalye',
    'Hasta Yatağı',
    'Cerrahi Lamba',
    'Aspiratör',
    'Sedye'
  ]
}

// Device interface for type safety
interface Device {
  id: string
  name: string
  brand: string
  model: string
  serialNumber: string
  location: string
  status: string
  lastMaintenance: string
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [showBarcodeReader, setShowBarcodeReader] = useState(false)
  const [showAddDevice, setShowAddDevice] = useState(false)
  const { showSuccess, showError } = useToast()

  // New Device State
  const [newDevice, setNewDevice] = useState({
    name: 'MRI Cihazı',
    brand: '',
    model: '',
    serialNumber: '',
    locationId: '',
    status: 'ACTIVE'
  })

  // Fetch devices data based on demo mode
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        // Check Demo Mode from localStorage
        const savedSettings = localStorage.getItem('appSettings')
        const demoMode = savedSettings ? JSON.parse(savedSettings).demoMode : false
        setIsDemoMode(demoMode)

        if (demoMode) {
          // Use demo data
          await new Promise(resolve => setTimeout(resolve, 300)) // Simulate loading

          const transformedDevices: Device[] = demoDevices.map(d => ({
            id: d.id,
            name: d.name,
            brand: d.brand || '',
            model: d.model,
            serialNumber: d.serialNumber,
            location: d.location.name,
            status: d.status,
            lastMaintenance: new Date(d.lastMaintenanceDate).toISOString().split('T')[0]
          }))

          // Extract unique locations from demo data
          const demoLocations = Array.from(new Set(demoDevices.map(d => JSON.stringify(d.location))))
            .map(l => JSON.parse(l as string))
          setLocations(demoLocations)

          setDevices(transformedDevices)
        } else {
          // Fetch from API
          const [devicesRes, locationsRes] = await Promise.all([
            fetch('/api/devices'),
            fetch('/api/locations')
          ])

          if (devicesRes.ok) {
            const data = await devicesRes.json()
            const transformedDevices: Device[] = data.map((d: any) => ({
              id: d.id,
              name: d.name,
              brand: d.brand || '',
              model: d.model || '',
              serialNumber: d.serialNumber,
              location: d.location?.name || 'Belirtilmemiş',
              status: d.status,
              lastMaintenance: d.lastMaintenanceDate
                ? new Date(d.lastMaintenanceDate).toISOString().split('T')[0]
                : '-'
            }))
            setDevices(transformedDevices)
          }

          if (locationsRes.ok) {
            setLocations(await locationsRes.json())
          }
        }
      } catch (error) {
        console.error('Error fetching devices:', error)
        showError('Cihazlar yüklenirken hata oluştu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDevices()
  }, [])

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'ALL' || device.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleBarcodeScann = (code: string) => {
    const device = devices.find(d => d.serialNumber === code)

    if (device) {
      showSuccess(`Cihaz bulundu: ${device.name}`)
      setSearchTerm(code)
    } else {
      showError('Cihaz bulunamadı')
    }
    setShowBarcodeReader(false)
  }

  const handleExportExcel = () => {
    exportDevicesToExcel(filteredDevices)
    showSuccess('Excel dosyası indirildi')
  }

  const handleAddDevice = async () => {
    if (!newDevice.name || !newDevice.serialNumber) {
      showError('Lütfen zorunlu alanları doldurunuz')
      return
    }

    try {
      if (isDemoMode) {
        const locationName = locations.find(l => l.id === newDevice.locationId)?.name || 'Bilinmiyor'
        const deviceToAdd = {
          id: (devices.length + 1).toString(),
          name: newDevice.name,
          brand: newDevice.brand,
          model: newDevice.model,
          serialNumber: newDevice.serialNumber,
          location: locationName,
          status: newDevice.status,
          lastMaintenance: new Date().toISOString().split('T')[0]
        }
        setDevices([...devices, deviceToAdd])
        showSuccess('Yeni cihaz başarıyla eklendi (Demo)')
      } else {
        const response = await fetch('/api/devices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDevice)
        })

        if (response.ok) {
          const savedDevice = await response.json()
          const deviceToAdd: Device = {
            id: savedDevice.id,
            name: savedDevice.name,
            brand: savedDevice.brand || '',
            model: savedDevice.model || '',
            serialNumber: savedDevice.serialNumber,
            location: savedDevice.location?.name || 'Belirtilmemiş',
            status: savedDevice.status,
            lastMaintenance: savedDevice.lastMaintenanceDate
              ? new Date(savedDevice.lastMaintenanceDate).toISOString().split('T')[0]
              : '-'
          }
          setDevices([deviceToAdd, ...devices])
          showSuccess('Yeni cihaz başarıyla eklendi')
        } else {
          throw new Error('Kaydetme başarısız')
        }
      }

      setShowAddDevice(false)
      setNewDevice({
        name: 'MRI Cihazı',
        brand: '',
        model: '',
        serialNumber: '',
        locationId: '',
        status: 'ACTIVE'
      })
    } catch (error) {
      console.error('Error adding device:', error)
      showError('Cihaz eklenirken hata oluştu')
    }
  }

  const handleQuickUpdate = (id: string, field: string, value: string) => {
    // In a real app, this should also call API
    setDevices(devices.map(device =>
      device.id === id ? { ...device, [field]: value } : device
    ))
    showSuccess('Cihaz güncellendi')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cihaz Yönetimi</h1>
          <p className="text-gray-600 mt-1">Tüm tıbbi cihazları görüntüleyin ve yönetin</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowBarcodeReader(true)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
          >
            <QrCode className="h-5 w-5" />
            <span>Barkod Oku</span>
          </button>
          <button
            onClick={() => setShowAddDevice(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Yeni Cihaz Ekle</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <QuickStat label="Toplam Cihaz" value={devices.length} icon={<Package />} color="blue" />
        <QuickStat
          label="Aktif"
          value={devices.filter(d => d.status === 'ACTIVE').length}
          icon={<Package />}
          color="green"
        />
        <QuickStat
          label="Bakımda"
          value={devices.filter(d => d.status === 'MAINTENANCE').length}
          icon={<Package />}
          color="orange"
        />
        <QuickStat
          label="Kalibrasyonda"
          value={devices.filter(d => d.status === 'CALIBRATION').length}
          icon={<Package />}
          color="purple"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Cihaz adı, marka, model veya seri numarası ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="ACTIVE">Aktif</option>
              <option value="MAINTENANCE">Bakımda</option>
              <option value="CALIBRATION">Kalibrasyonda</option>
              <option value="INACTIVE">Pasif</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span className="text-sm font-medium">Excel'e Aktar</span>
          </button>
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Cihaz</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Seri No</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Lokasyon</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Son Bakım</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDevices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{device.name}</p>
                      <p className="text-sm text-gray-600">{device.brand} {device.model}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <QrCode className="h-4 w-4 text-gray-400" />
                      <span className="font-mono text-sm">{device.serialNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <QuickEditCell
                      value={device.location}
                      type="text"
                      onSave={(val) => handleQuickUpdate(device.id, 'location', val)}
                    >
                      <div className="flex items-center space-x-1 text-sm text-gray-700">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{device.location}</span>
                      </div>
                    </QuickEditCell>
                  </td>
                  <td className="px-6 py-4">
                    <QuickEditCell
                      value={device.status}
                      type="select"
                      options={[
                        { value: 'ACTIVE', label: 'Aktif' },
                        { value: 'INACTIVE', label: 'Pasif' },
                        { value: 'MAINTENANCE', label: 'Bakımda' },
                        { value: 'CALIBRATION', label: 'Kalibrasyonda' },
                        { value: 'REPAIR', label: 'Onarımda' }
                      ]}
                      onSave={(val) => handleQuickUpdate(device.id, 'status', val)}
                    >
                      <DeviceStatusBadge status={device.status} />
                    </QuickEditCell>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1 text-sm text-gray-700">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{device.lastMaintenance}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={`/dashboard/devices/${device.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Detaylar →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <p className="text-sm text-gray-700">
            Toplam <span className="font-semibold">{filteredDevices.length}</span> cihaz gösteriliyor
          </p>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-white">Önceki</button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-white">2</button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-white">Sonraki</button>
          </div>
        </div>
      </div>

      {/* Barcode Reader Modal */}
      {showBarcodeReader && (
        <BarcodeReader
          onScan={handleBarcodeScann}
          onClose={() => setShowBarcodeReader(false)}
        />
      )}

      {/* Add Device Modal */}
      {showAddDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Yeni Cihaz Ekle</h2>
            </div>
            <div className="p-6">
              <form className="grid grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); handleAddDevice(); }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cihaz Türü *</label>
                  <select
                    value={newDevice.name}
                    onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {Object.entries(DEVICE_TYPES).map(([category, types]) => (
                      <optgroup key={category} label={category}>
                        {types.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marka</label>
                  <input
                    type="text"
                    value={newDevice.brand}
                    onChange={(e) => setNewDevice({ ...newDevice, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: Siemens"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={newDevice.model}
                    onChange={(e) => setNewDevice({ ...newDevice, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: Magnetom Vida"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seri Numarası *</label>
                  <input
                    type="text"
                    value={newDevice.serialNumber}
                    onChange={(e) => setNewDevice({ ...newDevice, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lokasyon</label>
                  <select
                    value={newDevice.locationId}
                    onChange={(e) => setNewDevice({ ...newDevice, locationId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seçiniz</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                  <select
                    value={newDevice.status}
                    onChange={(e) => setNewDevice({ ...newDevice, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Pasif</option>
                    <option value="MAINTENANCE">Bakımda</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddDevice(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                İptal
              </button>
              <button
                onClick={handleAddDevice}
                type="button"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper Components
function QuickStat({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-xl p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="opacity-50">{icon}</div>
      </div>
    </div>
  )
}

function DeviceStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    ACTIVE: { label: 'Aktif', className: 'bg-green-100 text-green-800' },
    INACTIVE: { label: 'Pasif', className: 'bg-gray-100 text-gray-800' },
    MAINTENANCE: { label: 'Bakımda', className: 'bg-orange-100 text-orange-800' },
    CALIBRATION: { label: 'Kalibrasyonda', className: 'bg-purple-100 text-purple-800' },
    REPAIR: { label: 'Onarımda', className: 'bg-red-100 text-red-800' }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  )
}

function QuickEditCell({
  value,
  type,
  options = [],
  onSave,
  children
}: {
  value: string;
  type: 'text' | 'select';
  options?: string[] | { value: string; label: string }[];
  onSave: (value: string) => void;
  children: React.ReactNode;
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)

  const handleSave = () => {
    onSave(editValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        {type === 'text' ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="px-2 py-1 border border-blue-500 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="px-2 py-1 border border-blue-500 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          >
            {options.map((opt) => {
              const isObject = typeof opt === 'object'
              const optionValue = isObject ? opt.value : opt
              const optionLabel = isObject ? opt.label : opt
              return (
                <option key={optionValue} value={optionValue}>
                  {optionLabel}
                </option>
              )
            })}
          </select>
        )}
        <button onClick={handleSave} className="text-green-600 hover:text-green-700">
          <Check className="h-4 w-4" />
        </button>
        <button onClick={handleCancel} className="text-red-600 hover:text-red-700">
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      className="group/edit relative cursor-pointer"
      onClick={() => {
        setEditValue(value)
        setIsEditing(true)
      }}
    >
      {children}
      <Edit2 className="h-3 w-3 text-gray-400 absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
    </div>
  )
}