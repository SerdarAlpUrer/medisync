'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Package,
  MapPin,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle,
  Wrench,
  Building2,
  Phone,
  FileText,
  X,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface Device {
  id: string
  name: string
  brand: string
  model: string
  serialNumber: string
  tagNumber?: string
  location: { name: string }
  status: string
  condition: string
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  lastCalibrationDate?: string
  nextCalibrationDate?: string
  calibrationRecords?: any[]
  warrantyExpiry?: string
  supplier?: { name: string; phone?: string }
  description?: string
  category?: {
    id: string
    name: string
    group?: string
  }
}

export default function ScanDevicePage() {
  const params = useParams()
  const { data: session } = useSession()
  const [device, setDevice] = useState<Device | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInstructions, setShowInstructions] = useState(false)
  const [instructions, setInstructions] = useState<any>(null)
  const [loadingInstructions, setLoadingInstructions] = useState(false)

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        const response = await fetch(`/api/devices/${params.id}`)
        if (!response.ok) {
          throw new Error('Cihaz bulunamadı')
        }
        const data = await response.json()
        setDevice(data)
      } catch (err) {
        setError('Cihaz bilgileri yüklenemedi')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchDevice()
    }
  }, [params.id])

  const fetchUsageInstructions = async () => {
    if (!device?.id) return

    setLoadingInstructions(true)
    try {
      const response = await fetch(`/api/devices/${device.id}/usage-instruction`)
      if (response.ok) {
        const data = await response.json()
        setInstructions(data)
        setShowInstructions(true)
      }
    } catch (err) {
      console.error('Error fetching instructions:', err)
    } finally {
      setLoadingInstructions(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !device) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Hata</h1>
        <p className="text-gray-600 mb-6">{error || 'Cihaz bulunamadı'}</p>
        <Link
          href="/dashboard"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Panele Git
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header Image/Gradient */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 h-48 relative">
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
          <div className="bg-white p-4 rounded-2xl shadow-xl">
            <Package className="h-16 w-16 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 pt-20">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{device.name}</h1>
          <p className="text-gray-500 font-medium">{device.brand} {device.model}</p>
          {device.tagNumber && (
            <span className="inline-block mt-2 bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
              {device.tagNumber}
            </span>
          )}
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className={`p-3 rounded-xl border ${device.status === 'ACTIVE' ? 'bg-green-50 border-green-100 text-green-700' :
            ['MAINTENANCE', 'IN_MAINTENANCE', 'REPAIR', 'UNDER_REPAIR'].includes(device.status) ? 'bg-orange-50 border-orange-100 text-orange-700' :
              ['CALIBRATION', 'IN_CALIBRATION'].includes(device.status) ? 'bg-purple-50 border-purple-100 text-purple-700' :
                'bg-gray-50 border-gray-100 text-gray-700'
            }`}>
            <div className="flex items-center space-x-2 mb-1">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase">Durum</span>
            </div>
            <p className="font-bold">
              {device.status === 'ACTIVE' ? 'Aktif' :
                ['MAINTENANCE', 'IN_MAINTENANCE'].includes(device.status) ? 'Bakımda / Arızalı' :
                  ['CALIBRATION', 'IN_CALIBRATION'].includes(device.status) ? 'Kalibrasyonda' :
                    ['REPAIR', 'UNDER_REPAIR'].includes(device.status) ? 'Onarımda' :
                      ['SCRAPPED', 'DECOMMISSIONED'].includes(device.status) ? 'HEK / Hurda' : 'Pasif'}
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-2 mb-1 text-gray-500">
              <MapPin className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase">Konum</span>
            </div>
            <p className="font-bold text-gray-900">{device.location?.name || 'Belirtilmemiş'}</p>
          </div>
        </div>

        {/* Details List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Package className="h-4 w-4 mr-2 text-blue-500" />
              Cihaz Detayları
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="p-4 flex justify-between">
              <span className="text-gray-500 text-sm">Seri No</span>
              <span className="font-mono font-medium text-gray-900">{device.serialNumber}</span>
            </div>
            <div className="p-4 flex justify-between">
              <span className="text-gray-500 text-sm">Marka</span>
              <span className="font-medium text-gray-900">{device.brand}</span>
            </div>
            <div className="p-4 flex justify-between">
              <span className="text-gray-500 text-sm">Model</span>
              <span className="font-medium text-gray-900">{device.model}</span>
            </div>
            {device.description && (
              <div className="p-4">
                <span className="text-gray-500 text-sm block mb-1">Açıklama</span>
                <p className="text-gray-900 text-sm">{device.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Maintenance Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Wrench className="h-4 w-4 mr-2 text-orange-500" />
              Bakım Bilgileri
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="p-4 flex justify-between items-center">
              <span className="text-gray-500 text-sm">Son Bakım</span>
              <div className="flex items-center text-gray-900 font-medium">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                {device.lastMaintenanceDate ? new Date(device.lastMaintenanceDate).toLocaleDateString('tr-TR') : '-'}
              </div>
            </div>
            <div className="p-4 flex justify-between items-center">
              <span className="text-gray-500 text-sm">Sonraki Bakım</span>
              <div className="flex items-center text-gray-900 font-medium">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                {device.nextMaintenanceDate ? new Date(device.nextMaintenanceDate).toLocaleDateString('tr-TR') : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Calibration Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Activity className="h-4 w-4 mr-2 text-purple-500" />
              Kalibrasyon Bilgileri
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="p-4 flex justify-between items-center">
              <span className="text-gray-500 text-sm">Son Kalibrasyon</span>
              <div className="flex items-center text-gray-900 font-medium">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                {device.lastCalibrationDate ? new Date(device.lastCalibrationDate).toLocaleDateString('tr-TR') : '-'}
              </div>
            </div>
            <div className="p-4 flex justify-between items-center">
              <span className="text-gray-500 text-sm">Gelecek Kalibrasyon</span>
              <div className="flex items-center text-gray-900 font-medium">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                {device.nextCalibrationDate ? new Date(device.nextCalibrationDate).toLocaleDateString('tr-TR') : '-'}
              </div>
            </div>
            {device.calibrationRecords && device.calibrationRecords.length > 0 && (
              <>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Sonuç</span>
                  <div className="font-medium">
                    {device.calibrationRecords[0].result === 'PASSED' && <span className="text-green-600">KULLANIMA UYGUNDUR</span>}
                    {device.calibrationRecords[0].result === 'PASSED_WITH_ADJUSTMENT' && <span className="text-blue-600">SINIRLI KULLANIMA UYGUNDUR</span>}
                    {device.calibrationRecords[0].result === 'FAILED' && <span className="text-red-600">KULLANIMA UYGUN DEĞİLDİR</span>}
                    {!device.calibrationRecords[0].result && <span className="text-gray-500">-</span>}
                  </div>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Sertifika No</span>
                  <div className="font-medium text-gray-900">
                    {device.calibrationRecords[0].certificateNumber || '-'}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Supplier Info */}
        {device.supplier && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-4 border-b border-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Building2 className="h-4 w-4 mr-2 text-purple-500" />
                Tedarikçi
              </h3>
            </div>
            <div className="p-4">
              <p className="font-medium text-gray-900 mb-1">{device.supplier.name}</p>
              {device.supplier.phone && (
                <a href={`tel:${device.supplier.phone}`} className="flex items-center text-blue-600 text-sm mt-2">
                  <Phone className="h-3 w-3 mr-1" />
                  {device.supplier.phone}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Kullanım Talimatı Butonu */}
        <div className="grid grid-cols-1 gap-4 mb-4">
          <button
            onClick={fetchUsageInstructions}
            disabled={loadingInstructions}
            className="inline-flex items-center justify-center w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50"
          >
            {loadingInstructions ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Yükleniyor...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 mr-2" />
                Kullanım Talimatını Görüntüle
              </>
            )}
          </button>

          <Link
            href={`/report-fault?query=${encodeURIComponent(device.tagNumber || device.serialNumber)}`}
            className="inline-flex items-center justify-center w-full bg-red-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg"
          >
            <AlertTriangle className="h-5 w-5 mr-2" />
            Arıza Bildir
          </Link>
        </div>

        {/* Kullanım Talimatı Modal */}
        {showInstructions && instructions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Kullanım Talimatı</h2>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg mb-2">{instructions.device?.name}</h3>
                  <p className="text-sm text-gray-600">
                    {instructions.device?.brand} {instructions.device?.model} - {instructions.device?.category}
                  </p>
                </div>

                {instructions.safetyWarnings && instructions.safetyWarnings.length > 0 && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">⚠ Güvenlik Uyarıları</h4>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {instructions.safetyWarnings.map((warning: string, idx: number) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-gray-700">
                    {instructions.instructions}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Action - Only for authorized users */}
        {session?.user?.role && ['ADMIN', 'TECHNICIAN', 'ENGINEER', 'MANAGER'].includes(session.user.role) && (
          <div className="text-center">
            <Link
              href={`/dashboard/devices/${device.id}`}
              className="inline-flex items-center justify-center w-full bg-gray-900 text-white px-6 py-4 rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-lg"
            >
              <Wrench className="h-5 w-5 mr-2" />
              Cihazı Düzenle / Yönet
            </Link>
          </div>
        )}

        <div className="text-center mt-4">
          <p className="text-xs text-gray-400">
            Bu sayfayı görüntülüyorsunuz çünkü bir cihaz QR kodu tarattınız.
          </p>
        </div>
      </div>
    </div>
  )
}
