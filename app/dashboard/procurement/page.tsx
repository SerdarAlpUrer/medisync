'use client'

import { useState, useEffect } from 'react'
import {
  PackageCheck,
  Plus,
  Search,
  Filter,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Calendar,
  Truck,
  Building2
} from 'lucide-react'
import { useToast } from '@/components/ToastProvider'
import { useHospital } from '@/contexts/HospitalContext'

interface Procurement {
  id: string
  purchaseOrderNumber: string
  deviceId?: string
  device?: { id: string; name: string; tagNumber: string }
  hospital: { id: string; name: string }
  supplier?: { id: string; name: string }
  orderDate: string
  deliveryStatus: string
  acceptanceStatus?: string
  commissioningStatus: string
}

export default function ProcurementPage() {
  const [procurements, setProcurements] = useState<Procurement[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [hospitals, setHospitals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedProcurement, setSelectedProcurement] = useState<Procurement | null>(null)
  const { showSuccess, showError } = useToast()
  const { activeHospitalId } = useHospital()

  const [newProcurement, setNewProcurement] = useState({
    purchaseOrderNumber: '',
    deviceId: '',
    hospitalId: activeHospitalId || '',
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    deliveryChecklist: {
      ambalaj: false,
      belgeler: false,
      eksikParça: false
    },
    deliveryNotes: ''
  })

  useEffect(() => {
    fetchData()
    fetchDevices()
    fetchSuppliers()
    fetchHospitals()
  }, [activeHospitalId])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const url = activeHospitalId 
        ? `/api/procurement?hospitalId=${activeHospitalId}`
        : '/api/procurement'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setProcurements(data)
      }
    } catch (error) {
      showError('Teslim almalar yüklenemedi')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDevices = async () => {
    try {
      const url = activeHospitalId 
        ? `/api/devices?hospitalId=${activeHospitalId}`
        : '/api/devices'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setDevices(data.devices || data)
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data)
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const fetchHospitals = async () => {
    try {
      const response = await fetch('/api/hospitals')
      if (response.ok) {
        const data = await response.json()
        setHospitals(data)
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/procurement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProcurement,
          deliveryChecklist: JSON.stringify(newProcurement.deliveryChecklist)
        })
      })

      if (response.ok) {
        showSuccess('Teslim alma kaydı oluşturuldu')
        setShowAddModal(false)
        resetForm()
        fetchData()
      } else {
        const error = await response.json()
        showError(error.error || 'Kayıt oluşturulamadı')
      }
    } catch (error) {
      showError('Bir hata oluştu')
    }
  }

  const handleUpdateStatus = async (id: string, field: string, value: string) => {
    try {
      const response = await fetch(`/api/procurement/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      })

      if (response.ok) {
        showSuccess('Güncellendi')
        fetchData()
      } else {
        showError('Güncellenemedi')
      }
    } catch (error) {
      showError('Bir hata oluştu')
    }
  }

  const resetForm = () => {
    setNewProcurement({
      purchaseOrderNumber: '',
      deviceId: '',
      hospitalId: activeHospitalId || '',
      supplierId: '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      deliveryChecklist: {
        ambalaj: false,
        belgeler: false,
        eksikParça: false
      },
      deliveryNotes: ''
    })
  }

  const filteredProcurements = procurements.filter(proc => {
    const matchesSearch = proc.purchaseOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proc.device?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'ALL' || proc.deliveryStatus === filterStatus
    return matchesSearch && matchesStatus
  })

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    DELIVERED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    RETURNED: 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <PackageCheck className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
            Cihaz Teslim Alma
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Cihaz teslim alma ve hizmete sunma süreçleri</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Yeni Teslim Alma</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="PENDING">Bekliyor</option>
            <option value="DELIVERED">Teslim Edildi</option>
            <option value="REJECTED">Reddedildi</option>
            <option value="RETURNED">İade Edildi</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredProcurements.length === 0 ? (
          <div className="text-center py-16">
            <PackageCheck className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Henüz teslim alma kaydı yok</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              İlk Kaydı Oluştur
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Sipariş No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Cihaz</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Tedarikçi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Sipariş Tarihi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Teslim Durumu</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProcurements.map((proc) => (
                  <tr key={proc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900 dark:text-white">
                      {proc.purchaseOrderNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {proc.device?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {proc.supplier?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {new Date(proc.orderDate).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[proc.deliveryStatus] || 'bg-gray-100 text-gray-800'}`}>
                        {proc.deliveryStatus === 'PENDING' ? 'Bekliyor' :
                         proc.deliveryStatus === 'DELIVERED' ? 'Teslim Edildi' :
                         proc.deliveryStatus === 'REJECTED' ? 'Reddedildi' :
                         proc.deliveryStatus === 'RETURNED' ? 'İade Edildi' : proc.deliveryStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedProcurement(proc)
                          setShowDetailModal(true)
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Detay"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Yeni Teslim Alma</h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sipariş Numarası <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProcurement.purchaseOrderNumber}
                    onChange={(e) => setNewProcurement({ ...newProcurement, purchaseOrderNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hastane <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newProcurement.hospitalId}
                    onChange={(e) => setNewProcurement({ ...newProcurement, hospitalId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seçin</option>
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cihaz (Opsiyonel)
                  </label>
                  <select
                    value={newProcurement.deviceId}
                    onChange={(e) => setNewProcurement({ ...newProcurement, deviceId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seçin</option>
                    {devices.map(d => (
                      <option key={d.id} value={d.id}>{d.name} - {d.tagNumber}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tedarikçi
                  </label>
                  <select
                    value={newProcurement.supplierId}
                    onChange={(e) => setNewProcurement({ ...newProcurement, supplierId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seçin</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sipariş Tarihi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newProcurement.orderDate}
                    onChange={(e) => setNewProcurement({ ...newProcurement, orderDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Beklenen Teslim Tarihi
                  </label>
                  <input
                    type="date"
                    value={newProcurement.expectedDeliveryDate}
                    onChange={(e) => setNewProcurement({ ...newProcurement, expectedDeliveryDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal - Basit versiyon, gerekirse genişletilebilir */}
      {showDetailModal && selectedProcurement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Teslim Alma Detayı</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400">Detay sayfası geliştirme aşamasında...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
