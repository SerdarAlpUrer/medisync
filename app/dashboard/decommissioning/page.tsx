'use client'

import { useState, useEffect } from 'react'
import {
  Trash2,
  Plus,
  Search,
  Filter,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Calendar
} from 'lucide-react'
import { useToast } from '@/components/ToastProvider'
import { useHospital } from '@/contexts/HospitalContext'

interface Decommissioning {
  id: string
  decommissionNumber: string
  deviceId: string
  device: { id: string; name: string; tagNumber: string; brand?: string; model?: string }
  hospital: { id: string; name: string }
  requestedByUser?: { id: string; name: string }
  reason: string
  reasonDetails?: string
  status: string
  evaluationStatus: string
  approvalStatus?: string
  requestDate: string
}

export default function DecommissioningPage() {
  const [decommissionings, setDecommissionings] = useState<Decommissioning[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedDecommissioning, setSelectedDecommissioning] = useState<Decommissioning | null>(null)
  const { showSuccess, showError } = useToast()
  const { activeHospitalId } = useHospital()

  const [newDecommissioning, setNewDecommissioning] = useState({
    deviceId: '',
    hospitalId: activeHospitalId || '',
    reason: 'OBSOLETE',
    reasonDetails: ''
  })

  useEffect(() => {
    fetchData()
    fetchDevices()
  }, [activeHospitalId])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const url = activeHospitalId 
        ? `/api/decommissioning?hospitalId=${activeHospitalId}`
        : '/api/decommissioning'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setDecommissionings(data)
      }
    } catch (error) {
      showError('Kullanım dışı bırakma kayıtları yüklenemedi')
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/decommissioning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDecommissioning)
      })

      if (response.ok) {
        showSuccess('Kullanım dışı bırakma talebi oluşturuldu')
        setShowAddModal(false)
        resetForm()
        fetchData()
      } else {
        const error = await response.json()
        showError(error.error || 'Talep oluşturulamadı')
      }
    } catch (error) {
      showError('Bir hata oluştu')
    }
  }

  const resetForm = () => {
    setNewDecommissioning({
      deviceId: '',
      hospitalId: activeHospitalId || '',
      reason: 'OBSOLETE',
      reasonDetails: ''
    })
  }

  const filteredDecommissionings = decommissionings.filter(dec => {
    const matchesSearch = dec.decommissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dec.device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dec.device.tagNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'ALL' || dec.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const statusColors: Record<string, string> = {
    REQUESTED: 'bg-blue-100 text-blue-800',
    APPROVED: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
    REJECTED: 'bg-red-100 text-red-800'
  }

  const reasonLabels: Record<string, string> = {
    OBSOLETE: 'Eski/Yenilendi',
    DAMAGED: 'Hasarlı',
    REPLACED: 'Yenisiyle Değiştirildi',
    SAFETY_CONCERN: 'Güvenlik Endişesi'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Trash2 className="h-8 w-8 mr-3 text-red-600 dark:text-red-400" />
            Cihaz Kullanım Dışı Bırakma
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Cihaz kullanım dışı bırakma süreçleri</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Yeni Talep</span>
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="REQUESTED">Talep Edildi</option>
            <option value="APPROVED">Onaylandı</option>
            <option value="COMPLETED">Tamamlandı</option>
            <option value="REJECTED">Reddedildi</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : filteredDecommissionings.length === 0 ? (
          <div className="text-center py-16">
            <Trash2 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Henüz kullanım dışı bırakma kaydı yok</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              İlk Talebi Oluştur
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Talep No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Cihaz</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Gerekçe</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Talep Tarihi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Durum</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDecommissionings.map((dec) => (
                  <tr key={dec.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900 dark:text-white">
                      {dec.decommissionNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <div className="font-medium">{dec.device.name}</div>
                        <div className="text-xs text-gray-500">{dec.device.tagNumber}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {reasonLabels[dec.reason] || dec.reason}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {new Date(dec.requestDate).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[dec.status] || 'bg-gray-100 text-gray-800'}`}>
                        {dec.status === 'REQUESTED' ? 'Talep Edildi' :
                         dec.status === 'APPROVED' ? 'Onaylandı' :
                         dec.status === 'COMPLETED' ? 'Tamamlandı' :
                         dec.status === 'REJECTED' ? 'Reddedildi' : dec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedDecommissioning(dec)
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kullanım Dışı Bırakma Talebi</h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cihaz <span className="text-red-500">*</span>
                </label>
                <select
                  value={newDecommissioning.deviceId}
                  onChange={(e) => setNewDecommissioning({ ...newDecommissioning, deviceId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Seçin</option>
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>{d.name} - {d.tagNumber}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gerekçe <span className="text-red-500">*</span>
                </label>
                <select
                  value={newDecommissioning.reason}
                  onChange={(e) => setNewDecommissioning({ ...newDecommissioning, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="OBSOLETE">Eski/Yenilendi</option>
                  <option value="DAMAGED">Hasarlı</option>
                  <option value="REPLACED">Yenisiyle Değiştirildi</option>
                  <option value="SAFETY_CONCERN">Güvenlik Endişesi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Detaylar
                </label>
                <textarea
                  value={newDecommissioning.reasonDetails}
                  onChange={(e) => setNewDecommissioning({ ...newDecommissioning, reasonDetails: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500"
                  rows={4}
                  placeholder="Gerekçe detaylarını açıklayın..."
                />
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
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Talep Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedDecommissioning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kullanım Dışı Bırakma Detayı</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedDecommissioning.device.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedDecommissioning.decommissionNumber}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gerekçe</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {reasonLabels[selectedDecommissioning.reason] || selectedDecommissioning.reason}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Durum</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[selectedDecommissioning.status] || 'bg-gray-100 text-gray-800'}`}>
                    {selectedDecommissioning.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Talep Tarihi</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(selectedDecommissioning.requestDate).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Talep Eden</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedDecommissioning.requestedByUser?.name || '-'}
                  </p>
                </div>
              </div>
              {selectedDecommissioning.reasonDetails && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Detaylar</p>
                  <p className="text-gray-900 dark:text-white">{selectedDecommissioning.reasonDetails}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
