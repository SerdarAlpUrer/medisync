'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Edit, Trash2, Calendar, MapPin, Package, Wrench,
  FileText, AlertCircle, CheckCircle, Clock, QrCode, Award,
  Activity, Download, TrendingUp
} from 'lucide-react'
import { useToast } from '@/components/ToastProvider'
import QRCodeGenerator from '@/components/QRCodeGenerator'
import { getBaseUrl } from '@/lib/networking'

/* ... imports ... */

interface Device {
  /* ... existing fields ... */
  id: string
  name: string
  brand: string
  model: string
  serialNumber: string
  tagNumber?: string
  barcode?: string
  rfidTag?: string
  manufacturer?: string
  location: any
  status: string
  condition: string
  purchaseDate: string
  lastMaintenanceDate: string
  nextMaintenanceDate: string
  warrantyExpiry: string
  supplier: any
  purchasePrice: number
  description: string
  locationId: string
  supplierId: string
  newLocationName?: string // Optional for UI state
  newSupplierName?: string // Optional for UI state
  calibrationRecords?: any[]
  maintenanceRecords?: any[]
  workOrders?: any[]
}



import { use } from 'react'

export default function DeviceDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const id = params.id
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [device, setDevice] = useState<Device | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [uptimeStats, setUptimeStats] = useState<any>(null)
  const [loadingUptime, setLoadingUptime] = useState(false)
  const [uptimePeriod, setUptimePeriod] = useState(30) // gün
  const [maintenanceFilter, setMaintenanceFilter] = useState<'ALL' | 'CORRECTIVE' | 'PERIODIC'>('ALL')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deviceRes, categoriesRes, locationsRes, suppliersRes] = await Promise.all([
          fetch(`/api/devices/${params.id}`),
          fetch('/api/categories'),
          fetch('/api/locations'),
          fetch('/api/suppliers')
        ])

        if (deviceRes.ok) {
          const deviceData = await deviceRes.json()
          setDevice(deviceData)
        }

        if (categoriesRes.ok) {
          setCategories(await categoriesRes.json())
        }

        if (locationsRes.ok) {
          setLocations(await locationsRes.json())
        }

        if (suppliersRes.ok) {
          setSuppliers(await suppliersRes.json())
        }

      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  // Uptime istatistiklerini getir
  const fetchUptimeStats = async (days: number = 30) => {
    if (!device?.id) return
    setLoadingUptime(true)
    try {
      const response = await fetch(`/api/devices/${device.id}/uptime?days=${days}`)
      if (response.ok) {
        const data = await response.json()
        setUptimeStats(data)
      }
    } catch (error) {
      console.error('Error fetching uptime stats:', error)
    } finally {
      setLoadingUptime(false)
    }
  }

  useEffect(() => {
    if (device?.id) {
      fetchUptimeStats(uptimePeriod)
    }
  }, [device?.id, uptimePeriod])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!device) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Cihaz Bulunamadı</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Aradığınız cihaz sistemde kayıtlı değil.</p>
          <button onClick={() => router.push('/dashboard/devices')} className="text-blue-600 hover:text-blue-700 font-medium">
            Cihaz Listesine Dön
          </button>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/devices/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(device)
      })

      if (response.ok) {
        setIsEditing(false)
        showSuccess('Değişiklikler başarıyla kaydedildi!')
        // Refresh data
        const updatedDevice = await response.json()
        setDevice(updatedDevice)

        // Refresh locations and suppliers to show newly added ones
        const [locRes, supRes] = await Promise.all([
          fetch('/api/locations'),
          fetch('/api/suppliers')
        ])
        if (locRes.ok) setLocations(await locRes.json())
        if (supRes.ok) setSuppliers(await supRes.json())

      } else {
        const errData = await response.json().catch(() => ({}))
        showError(errData.error || 'Kaydetme hatası!')
      }
    } catch (error) {
      showError('Bir hata oluştu!')
    }
  }

  const handleDelete = async () => {
    if (confirm('Bu cihazı silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/devices/${params.id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          showSuccess('Cihaz başarıyla silindi!')
          router.push('/dashboard/devices')
        } else {
          showError('Silme hatası!')
        }
      } catch (error) {
        showError('Bir hata oluştu!')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.push('/dashboard/devices')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{device.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              {device.tagNumber && <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-sm font-semibold px-2.5 py-0.5 rounded">{device.tagNumber}</span>}
              <p className="text-gray-600 dark:text-gray-400">{device.brand} {device.model}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {!isEditing ? (
            <>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/devices/${device.id}/usage-instruction`, {
                      method: 'POST'
                    })
                    if (response.ok) {
                      const data = await response.json()
                      const link = document.createElement('a')
                      link.href = data.pdf
                      link.download = data.filename || 'Kullanim_Talimati.pdf'
                      link.click()
                      showSuccess('Kullanım talimatı PDF indirildi')
                    } else {
                      showError('PDF oluşturulamadı')
                    }
                  } catch (error) {
                    showError('Bir hata oluştu')
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
              >
                <Download className="h-5 w-5" />
                <span>Kullanım Talimatı PDF</span>
              </button>
              <button onClick={() => setShowQRModal(true)} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors">
                <QrCode className="h-5 w-5" />
                <span>QR Kod</span>
              </button>
              <button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors">
                <Edit className="h-5 w-5" />
                <span>Düzenle</span>
              </button>
              <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors">
                <Trash2 className="h-5 w-5" />
                <span>Sil</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(false)} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors">
                İptal
              </button>
              <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors">
                <CheckCircle className="h-5 w-5" />
                <span>Kaydet</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center space-x-4">
        <DeviceStatusBadge status={device.status} />
        <ConditionBadge condition={device.condition} />
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <FileText className="h-6 w-6 mr-2 text-blue-600 dark:text-blue-400" />
          Cihaz Bilgileri
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Tag Number (Read Only) */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Künye Numarası</p>
            {isEditing ? (
              <input
                type="text"
                value={device.tagNumber || ''}
                onChange={(e) => setDevice({ ...device, tagNumber: e.target.value })}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-blue-50 text-blue-900 font-semibold"
                placeholder="TAG-YYYY-XXXX"
              />
            ) : (
              <p className="font-semibold text-lg text-blue-600">{device.tagNumber || 'Atanmamış'}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Cihaz Türü</p>
            {isEditing ? (
              <div className="relative">
                <input
                  type="text"
                  list="device-types-list"
                  value={device.name}
                  onChange={(e) => setDevice({ ...device, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Cihaz Türü Seçin veya Yazın"
                />
                <datalist id="device-types-list">
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.name} />
                  ))}
                </datalist>
              </div>
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">{device.name}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Marka</p>
            {isEditing ? (
              <input
                type="text"
                value={device.brand}
                onChange={(e) => setDevice({ ...device, brand: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="font-semibold">{device.brand}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Model</p>
            {isEditing ? (
              <input
                type="text"
                value={device.model}
                onChange={(e) => setDevice({ ...device, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">{device.model}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Seri Numarası</p>
            {isEditing ? (
              <input
                type="text"
                value={device.serialNumber}
                onChange={(e) => setDevice({ ...device, serialNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">{device.serialNumber}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Barkod</p>
            {isEditing ? (
              <input
                type="text"
                value={device.barcode || ''}
                onChange={(e) => setDevice({ ...device, barcode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Barkod No"
              />
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">{device.barcode || '-'}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">RFID Etiketi</p>
            {isEditing ? (
              <input
                type="text"
                value={device.rfidTag || ''}
                onChange={(e) => setDevice({ ...device, rfidTag: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="RFID No"
              />
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">{device.rfidTag || '-'}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Üretici</p>
            {isEditing ? (
              <input
                type="text"
                value={device.manufacturer || ''}
                onChange={(e) => setDevice({ ...device, manufacturer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">{device.manufacturer || '-'}</p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Lokasyon</p>
            {isEditing ? (
              <div className="space-y-2">
                <select
                  value={device.locationId || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'NEW') {
                      setDevice({ ...device, locationId: 'NEW', newLocationName: '' })
                    } else {
                      setDevice({ ...device, locationId: val, newLocationName: undefined })
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seçiniz...</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                  <option value="NEW" className="text-blue-600 dark:text-blue-400 font-semibold">+ Yeni Lokasyon Ekle...</option>
                </select>
                {device.locationId === 'NEW' && (
                  <input
                    type="text"
                    value={device.newLocationName || ''}
                    onChange={(e) => setDevice({ ...device, newLocationName: e.target.value })}
                    placeholder="Yeni Lokasyon Adı"
                    className="w-full px-3 py-2 border border-blue-300 dark:border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-white"
                    autoFocus
                  />
                )}
              </div>
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">{device.location?.name || '-'}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tedarikçi</p>
            {isEditing ? (
              <div className="space-y-2">
                <select
                  value={device.supplierId || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'NEW') {
                      setDevice({ ...device, supplierId: 'NEW', newSupplierName: '' })
                    } else {
                      setDevice({ ...device, supplierId: val, newSupplierName: undefined })
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seçiniz...</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                  <option value="NEW" className="text-blue-600 dark:text-blue-400 font-semibold">+ Yeni Tedarikçi Ekle...</option>
                </select>
                {device.supplierId === 'NEW' && (
                  <input
                    type="text"
                    value={device.newSupplierName || ''}
                    onChange={(e) => setDevice({ ...device, newSupplierName: e.target.value })}
                    placeholder="Yeni Tedarikçi Adı"
                    className="w-full px-3 py-2 border border-blue-300 dark:border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-white"
                    autoFocus
                  />
                )}
              </div>
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">{device.supplier?.name || '-'}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Fiyat</p>
            {isEditing ? (
              <input
                type="number"
                value={device.purchasePrice ?? ''}
                onChange={(e) => setDevice({ ...device, purchasePrice: e.target.value ? parseFloat(e.target.value) : 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">₺{device.purchasePrice?.toLocaleString() || '0'}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Satın Alma Tarihi</p>
            {isEditing ? (
              <input
                type="date"
                value={device.purchaseDate ? new Date(device.purchaseDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setDevice({ ...device, purchaseDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">{device.purchaseDate ? new Date(device.purchaseDate).toLocaleDateString('tr-TR') : '-'}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Durum</p>
            {isEditing ? (
              <select
                value={device.status === 'IN_MAINTENANCE' ? 'MAINTENANCE' : device.status}
                onChange={(e) => setDevice({ ...device, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Pasif</option>
                <option value="MAINTENANCE">Bakımda</option>
                <option value="CALIBRATION">Kalibrasyonda</option>
                <option value="REPAIR">Onarımda</option>
                <option value="DECOMMISSIONED">Hizmet Dışı (HEK)</option>
              </select>
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">
                {device.status === 'ACTIVE' && 'Aktif'}
                {device.status === 'INACTIVE' && 'Pasif'}
                {(device.status === 'MAINTENANCE' || device.status === 'IN_MAINTENANCE') && 'Bakımda'}
                {device.status === 'CALIBRATION' && 'Kalibrasyonda'}
                {(device.status === 'REPAIR' || device.status === 'UNDER_REPAIR') && 'Onarımda'}
                {(device.status === 'DECOMMISSIONED' || device.status === 'RETIRED') && 'Hizmet Dışı (HEK)'}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Kondisyon</p>
            {isEditing ? (
              <select
                value={device.condition}
                onChange={(e) => setDevice({ ...device, condition: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="EXCELLENT">Mükemmel</option>
                <option value="GOOD">İyi</option>
                <option value="FAIR">Orta</option>
                <option value="POOR">Kötü</option>
              </select>
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">
                {device.condition === 'EXCELLENT' && 'Mükemmel'}
                {device.condition === 'GOOD' && 'İyi'}
                {device.condition === 'FAIR' && 'Orta'}
                {device.condition === 'POOR' && 'Kötü'}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Açıklama</p>
          {isEditing ? (
            <textarea
              value={device.description || ''}
              onChange={(e) => setDevice({ ...device, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ) : (
            <p className="text-gray-900 dark:text-white">{device.description || '-'}</p>
          )}
        </div>
      </div>

      {/* Maintenance Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Wrench className="h-6 w-6 mr-2 text-orange-600" />
          Bakım Bilgileri
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Son Bakım</p>
            {isEditing ? (
              <input
                type="date"
                value={device.lastMaintenanceDate ? new Date(device.lastMaintenanceDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setDevice({ ...device, lastMaintenanceDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">{device.lastMaintenanceDate ? new Date(device.lastMaintenanceDate).toLocaleDateString('tr-TR') : '-'}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Sonraki Bakım</p>
            {isEditing ? (
              <input
                type="date"
                value={device.nextMaintenanceDate ? new Date(device.nextMaintenanceDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setDevice({ ...device, nextMaintenanceDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">{device.nextMaintenanceDate ? new Date(device.nextMaintenanceDate).toLocaleDateString('tr-TR') : '-'}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Garanti Bitiş</p>
            {isEditing ? (
              <input
                type="date"
                value={device.warrantyExpiry ? new Date(device.warrantyExpiry).toISOString().split('T')[0] : ''}
                onChange={(e) => setDevice({ ...device, warrantyExpiry: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">{device.warrantyExpiry ? new Date(device.warrantyExpiry).toLocaleDateString('tr-TR') : '-'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Uptime/Downtime Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Activity className="h-6 w-6 mr-2 text-green-600" />
            Çalışma Süresi Analizi (Uptime/Downtime)
          </h2>
          <select
            value={uptimePeriod}
            onChange={(e) => setUptimePeriod(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Son 7 Gün</option>
            <option value="30">Son 30 Gün</option>
            <option value="90">Son 90 Gün</option>
            <option value="365">Son 1 Yıl</option>
          </select>
        </div>

        {loadingUptime ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : uptimeStats?.stats ? (
          <div className="space-y-6">
            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Uptime Oranı</p>
                    <p className="text-3xl font-bold mt-1">{uptimeStats.stats.uptimePercentage.toFixed(2)}%</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-green-200" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Toplam Süre</p>
                    <p className="text-2xl font-bold mt-1">{uptimeStats.stats.totalHours.toFixed(1)} saat</p>
                  </div>
                  <Clock className="h-10 w-10 text-blue-200" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Aktif Süre</p>
                    <p className="text-2xl font-bold mt-1">{uptimeStats.stats.uptimeHours.toFixed(1)} saat</p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-green-200" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Downtime</p>
                    <p className="text-2xl font-bold mt-1">{uptimeStats.stats.downtimeHours.toFixed(1)} saat</p>
                  </div>
                  <AlertCircle className="h-10 w-10 text-red-200" />
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Çalışma Oranı</span>
                <span className="text-sm font-bold text-gray-900">{uptimeStats.stats.uptimePercentage.toFixed(2)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500"
                  style={{ width: `${uptimeStats.stats.uptimePercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Detaylı Bilgiler */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-500 dark:text-gray-400 mb-1">Toplam Süre</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {Math.floor(uptimeStats.stats.totalHours / 24)} gün {Math.floor(uptimeStats.stats.totalHours % 24)} saat
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-green-600 dark:text-green-400 mb-1">Aktif Süre</p>
                <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                  {Math.floor(uptimeStats.stats.uptimeHours / 24)} gün {Math.floor(uptimeStats.stats.uptimeHours % 24)} saat
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400 mb-1">Downtime</p>
                <p className="text-lg font-semibold text-red-900 dark:text-red-100">
                  {Math.floor(uptimeStats.stats.downtimeHours / 24)} gün {Math.floor(uptimeStats.stats.downtimeHours % 24)} saat
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-blue-600 dark:text-blue-400 mb-1">Analiz Dönemi</p>
                <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  {new Date(uptimeStats.period.startDate).toLocaleDateString('tr-TR')} - {new Date(uptimeStats.period.endDate).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Uptime/Downtime verisi bulunamadı</p>
          </div>
        )}
      </div>

      {/* Arıza ve Bakım Geçmişi (Maintenance & Fault Records) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        {(() => {
          const combinedMaintenance = [
            ...(device.maintenanceRecords || []),
            ...(device.workOrders || []).map((wo: any) => ({
              ...wo,
              technician: wo.assignedTo,
              isWorkOrder: true
            }))
          ].sort((a: any, b: any) => {
            const dateA = new Date(a.repairStartDate || a.scheduledDate || a.createdAt).getTime()
            const dateB = new Date(b.repairStartDate || b.scheduledDate || b.createdAt).getTime()
            return dateB - dateA
          })

          const filteredRecords = combinedMaintenance.filter((m: any) => {
            const isFault = m.type === 'CORRECTIVE' || m.type === 'EMERGENCY'
            if (maintenanceFilter === 'CORRECTIVE') return isFault
            if (maintenanceFilter === 'PERIODIC') return !isFault
            return true
          })

          const faultCount = combinedMaintenance.filter((m: any) => m.type === 'CORRECTIVE' || m.type === 'EMERGENCY').length
          const periodicCount = combinedMaintenance.filter((m: any) => m.type !== 'CORRECTIVE' && m.type !== 'EMERGENCY').length

          return (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                    <Wrench className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span>Arıza ve Bakım Geçmişi</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-semibold">
                        {combinedMaintenance.length} Kayıt
                      </span>
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Cihaza uygulanan tüm onarım, arıza çözümü ve periyodik bakım kayıtları
                    </p>
                  </div>
                </div>

                <a
                  href={`/dashboard/maintenance`}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  <span>+ Yeni Bakım / Arıza Kaydı</span>
                </a>
              </div>

              {/* Filter Tabs */}
              {combinedMaintenance.length > 0 && (
                <div className="flex space-x-2 mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
                  <button
                    type="button"
                    onClick={() => setMaintenanceFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      maintenanceFilter === 'ALL'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Tümü ({combinedMaintenance.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaintenanceFilter('CORRECTIVE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 ${
                      maintenanceFilter === 'CORRECTIVE'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    <span>🚨 Arıza Onarımları ({faultCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaintenanceFilter('PERIODIC')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 ${
                      maintenanceFilter === 'PERIODIC'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    <span>🔧 Periyodik Bakımlar ({periodicCount})</span>
                  </button>
                </div>
              )}

              {/* Records List / Table */}
              {filteredRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Tarih & Saat</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">İşlem Türü</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Durum</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Arıza / Duruş Süresi</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Teknisyen</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Açıklama / İşlemler</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Maliyet</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                      {filteredRecords.map((item: any) => {
                        const isFault = item.type === 'CORRECTIVE' || item.type === 'EMERGENCY'
                        const startDate = item.repairStartDate || item.scheduledDate || item.createdAt
                        const endDate = item.repairEndDate || item.completedDate || item.completedAt
                        
                        return (
                          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <td className="px-4 py-3.5 whitespace-nowrap text-gray-900 dark:text-gray-100">
                              <div className="font-semibold">{startDate ? new Date(startDate).toLocaleDateString('tr-TR') : '-'}</div>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                {startDate ? new Date(startDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                {endDate ? ` - ${new Date(endDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {isFault ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                                  🚨 {item.type === 'EMERGENCY' ? 'Acil Arıza' : 'Arıza Onarımı'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                  🔧 {item.type === 'PREVENTIVE' ? 'Önleyici Bakım' : 'Periyodik Bakım'}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {item.status === 'COMPLETED' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                                  ✓ Tamamlandı
                                </span>
                              ) : item.status === 'IN_PROGRESS' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 animate-pulse">
                                  ⏳ Devam Ediyor
                                </span>
                              ) : item.status === 'CANCELLED' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                  ✕ İptal
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                                  📅 Planlandı
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {item.duration ? (
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                  ⏱️ {Math.floor(item.duration / 60)} sa {item.duration % 60} dk
                                </span>
                              ) : item.laborHours ? (
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                  ⏱️ {item.laborHours} saat
                                </span>
                              ) : item.status === 'IN_PROGRESS' ? (
                                <span className="text-amber-500 dark:text-amber-400 font-medium italic">
                                  Duruş devam ediyor...
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-gray-800 dark:text-gray-200">
                              {item.technician?.name || item.assignedTo?.name || 'Atanmamış'}
                            </td>
                            <td className="px-4 py-3.5 max-w-xs text-gray-700 dark:text-gray-300">
                              <p className="font-medium truncate">{item.description || item.title || '-'}</p>
                              {(item.actions || item.actionsToken || item.findings) && (
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                  {item.actions || item.actionsToken || item.findings}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-right font-medium text-gray-900 dark:text-gray-100">
                              {item.cost ? `₺${parseFloat(item.cost).toLocaleString('tr-TR')}` : '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                  <Wrench className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="font-medium text-sm">Bu cihaza ait kayıtlı arıza veya bakım kaydı bulunmuyor.</p>
                  <p className="text-xs text-gray-400 mt-1">Cihazla ilgili arıza veya periyodik bakım gerçekleştiğinde buradan geçmişini izleyebilirsiniz.</p>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Calibration History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Award className="h-6 w-6 mr-2 text-purple-600" />
          Kalibrasyon Geçmişi
        </h2>

        {device.calibrationRecords && device.calibrationRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tarih</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Laboratuvar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sonuç</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sertifika</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {device.calibrationRecords.map((cal: any) => (
                  <tr key={cal.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {cal.completedDate ? new Date(cal.completedDate).toLocaleDateString('tr-TR') : new Date(cal.scheduledDate).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{cal.calibrationLab || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {cal.result === 'PASSED' && <span className="text-green-600 dark:text-green-400 font-semibold">KULLANIMA UYGUNDUR</span>}
                      {cal.result === 'PASSED_WITH_ADJUSTMENT' && <span className="text-blue-600 dark:text-blue-400 font-semibold">SINIRLI KULLANIMA UYGUNDUR</span>}
                      {cal.result === 'FAILED' && <span className="text-red-600 dark:text-red-400 font-semibold">KULLANIMA UYGUN DEĞİLDİR</span>}
                      {!cal.result && <span className="text-gray-500 dark:text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {cal.certificateNumber ? (
                        <a
                          href={`/api/certificates/${cal.certificateNumber}.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center space-x-1"
                        >
                          <FileText className="h-4 w-4" />
                          <span>{cal.certificateNumber}</span>
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Award className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Henüz kalibrasyon kaydı bulunmuyor.</p>
          </div>
        )}
      </div>
      {showQRModal && device && (
        <QRCodeGenerator
          value={`${getBaseUrl()}/scan/${device.id}`}
          title={`${device.tagNumber || 'No Tag'} - ${device.name}`}
          device={device}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  )
}

function DeviceStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: 'Aktif', className: 'badge-success' },
    INACTIVE: { label: 'Pasif', className: 'badge-gray' },
    MAINTENANCE: { label: 'Bakımda', className: 'badge-warning' },
    IN_MAINTENANCE: { label: 'Bakımda', className: 'badge-warning' },
    CALIBRATION: { label: 'Kalibrasyonda', className: 'badge-info' },
    REPAIR: { label: 'Onarımda', className: 'badge-danger' },
    UNDER_REPAIR: { label: 'Onarımda', className: 'badge-danger' },
    DECOMMISSIONED: { label: 'Hizmet Dışı', className: 'badge-gray' },
    RETIRED: { label: 'Emekli', className: 'badge-gray' },
  }
  const config = statusConfig[status] || { label: status, className: 'badge-gray' }
  return <span className={`badge ${config.className} text-lg`}>{config.label}</span>
}

function ConditionBadge({ condition }: { condition: string }) {
  const conditionConfig: Record<string, { label: string; className: string }> = {
    EXCELLENT: { label: 'Mükemmel', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    GOOD: { label: 'İyi', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    FAIR: { label: 'Orta', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
    POOR: { label: 'Kötü', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  }
  const config = conditionConfig[condition] || { label: condition, className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' }
  return <span className={`px-4 py-2 rounded-lg font-semibold ${config.className}`}>{config.label}</span>
}
