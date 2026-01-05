'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  Edit2,
  Trash2,
  Upload,
  ArrowUpDown,
  Settings
} from 'lucide-react'
// XLSX will be dynamically imported when needed
import { exportDevicesToExcel } from '@/lib/export'
import BarcodeReader from '@/components/BarcodeReader'
import { useToast } from '@/components/ToastProvider'
import { demoDevices, demoLocations } from '@/lib/demo-data'
import QRCodeGenerator from '@/components/QRCodeGenerator'
import { useHospital } from '@/contexts/HospitalContext'
import { getBaseUrl } from '@/lib/networking'



// Device interface for type safety
interface Device {
  id: string
  name: string
  brand: string
  model: string
  serialNumber: string
  tagNumber?: string
  barcode?: string
  rfidTag?: string
  manufacturer?: string
  location: string
  locationId?: string // Added for location filtering
  category: string
  supplier?: string
  status: string
  condition?: string
  purchaseDate?: string
  purchasePrice?: number
  warrantyExpiry?: string
  lastMaintenance: string
  nextMaintenanceDate?: string
  maintenanceInterval?: number
  description?: string
}

// Helper for status mapping
const REVERSE_STATUS_MAP: Record<string, string> = {
  'Aktif': 'ACTIVE',
  'Pasif': 'INACTIVE',
  'Bakımda': 'MAINTENANCE',
  'Kalibrasyonda': 'CALIBRATION',
  'Onarımda': 'REPAIR',
  'Hizmet Dışı': 'RETIRED'
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterLocation, setFilterLocation] = useState('ALL')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc'
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [showBarcodeReader, setShowBarcodeReader] = useState(false)
  const [showAddDevice, setShowAddDevice] = useState(false)
  const { showSuccess, showError } = useToast()
  const { activeHospitalId, activeHospital } = useHospital()

  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null)

  // New Device State
  const [newDevice, setNewDevice] = useState({
    name: 'MRI Cihazı',
    brand: '',
    model: '',
    serialNumber: '',
    barcode: '',
    rfidTag: '',
    manufacturer: '',
    locationId: '',
    newLocationName: '', // For manual entry
    supplierId: '',
    newSupplierName: '', // For manual entry
    status: 'ACTIVE',
    condition: 'GOOD',
    purchasePrice: 0,
    purchaseDate: '',
    warrantyExpiry: '',
    nextMaintenanceDate: '',
    maintenanceInterval: 180,
    description: '',
    productionYear: ''
  })

  // QR Code State
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedDeviceForQR, setSelectedDeviceForQR] = useState<Device | null>(null)

  const [categories, setCategories] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleteMode, setIsDeleteMode] = useState(false)

  // Import Progress State
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({
    stage: '', // 'reading', 'parsing', 'uploading', 'processing', 'done', 'error'
    message: '',
    totalRecords: 0,
    processedRecords: 0,
    fileName: ''
  })

  // Settings State
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [tagFormat, setTagFormat] = useState('TAG-{YYYY}-{SEQ}')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.deviceTagFormat) {
          setTagFormat(data.deviceTagFormat)
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const saveSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceTagFormat: tagFormat })
      })

      const data = await res.json()

      if (res.ok) {
        showSuccess('Ayarlar kaydedildi')
        setShowSettingsModal(false)
      } else {
        console.error('Settings save error:', data)
        showError(`Hata: ${data.details || data.error || 'Ayarlar kaydedilemedi'}`)
      }
    } catch (error) {
      console.error('Settings save exception:', error)
      showError(`Bir hata oluştu: ${error instanceof Error ? error.message : String(error)}`)
    }
  }


  // Helper to group categories
  const groupedCategories = categories.reduce((acc, cat) => {
    const group = cat.group || 'Diğer';
    if (!acc[group]) acc[group] = [];
    acc[group].push(cat);
    return acc;
  }, {} as Record<string, any[]>);

  // Fetch devices data based on demo mode
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        // Check Demo Mode from localStorage
        const savedSettings = localStorage.getItem('appSettings')
        const demoMode = savedSettings ? JSON.parse(savedSettings).demoMode : false
        setIsDemoMode(demoMode)

        if (demoMode) {
          // ... (demo logic unchanged)
        } else {
          // Fetch from API - filter by active hospital if selected
          const deviceUrl = activeHospitalId
            ? `/api/devices?hospitalId=${activeHospitalId}&sort=${sortConfig.key}&order=${sortConfig.direction}`
            : `/api/devices?sort=${sortConfig.key}&order=${sortConfig.direction}`
          const locationsUrl = activeHospitalId
            ? `/api/locations?hospitalId=${activeHospitalId}`
            : '/api/locations'
          const [devicesRes, locationsRes, suppliersRes, categoriesRes] = await Promise.all([
            fetch(deviceUrl, { cache: 'no-store' }),
            fetch(locationsUrl, { cache: 'no-store' }),
            fetch('/api/suppliers', { cache: 'no-store' }),
            fetch('/api/categories', { cache: 'no-store' })
          ])

          if (devicesRes.ok) {
            const response = await devicesRes.json()
            // Handle both old format (direct array) and new format (wrapped in success/data)
            const data = Array.isArray(response) ? response : (response.data?.devices || response.data || response)
            const transformedDevices: Device[] = (Array.isArray(data) ? data : []).map((d: any) => ({
              id: d.id,
              name: d.name,
              brand: d.brand || '',
              model: d.model || '',
              serialNumber: d.serialNumber,
              tagNumber: d.tagNumber,
              barcode: d.barcode,
              rfidTag: d.rfidTag,
              manufacturer: d.manufacturer,
              location: d.location?.name || 'Belirtilmemiş',
              locationId: d.locationId || d.location?.id || undefined, // Store locationId for filtering
              category: d.category?.name || 'Genel',
              supplier: d.supplier?.name,
              status: d.status,
              condition: d.condition,
              purchaseDate: d.purchaseDate,
              purchasePrice: d.purchasePrice,
              warrantyExpiry: d.warrantyExpiry,
              lastMaintenance: d.lastMaintenanceDate
                ? new Date(d.lastMaintenanceDate).toISOString().split('T')[0]
                : '-',
              nextMaintenanceDate: d.nextMaintenanceDate
                ? new Date(d.nextMaintenanceDate).toISOString().split('T')[0]
                : undefined,
              maintenanceInterval: d.maintenanceInterval,
              description: d.description
            }))
            setDevices(transformedDevices)
          }

          if (locationsRes.ok) setLocations(await locationsRes.json())
          if (suppliersRes.ok) setSuppliers(await suppliersRes.json())
          if (categoriesRes.ok) setCategories(await categoriesRes.json())
        }
      } catch (error) {
        console.error('Error fetching devices:', error)
        showError('Cihazlar yüklenirken hata oluştu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDevices()
  }, [activeHospitalId, sortConfig])

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Bulk Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredDevices.map(d => d.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectDevice = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkDelete = async () => {
    if (!confirm(`${selectedIds.size} adet cihazı silmek istediğinize emin misiniz?`)) return

    try {
      const response = await fetch('/api/devices/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      })

      if (response.ok) {
        showSuccess('Seçili cihazlar silindi')
        setDevices(devices.filter(d => !selectedIds.has(d.id)))
        setSelectedIds(new Set())
      } else {
        const error = await response.json()
        showError(error.error || 'Silme işlemi başarısız')
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      showError('Bir hata oluştu')
    }
  }

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.tagNumber && device.tagNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = filterStatus === 'ALL' || device.status === filterStatus
    const matchesLocation = filterLocation === 'ALL' || device.location === filterLocation
    // Note: device.name is used as the "Device Type" in this app
    const matchesCategory = filterCategory === 'ALL' || device.name === filterCategory

    return matchesSearch && matchesStatus && matchesLocation && matchesCategory
  })

  // Pagination Logic
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedDevices = filteredDevices.slice(startIndex, startIndex + itemsPerPage)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus, filterLocation, filterCategory])

  // Derive unique options for filters
  // Revert: Use categories from loaded devices to ensure branch specificity and avoid unused types

  // Revert: Use locations from loaded devices to ensure branch specificity (as locations are global in schema)
  const availableLocations = Array.from(new Set(devices.map(d => d.location))).sort()

  // Derive unique device types (names) from loaded devices for dynamic filtering
  const availableDeviceTypes: string[] = Array.from(new Set(devices.map(d => d.name))).sort()




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

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Start import process
    setIsImporting(true)
    setImportProgress({
      stage: 'reading',
      message: 'Dosya okunuyor...',
      totalRecords: 0,
      processedRecords: 0,
      fileName: file.name
    })

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        // Stage 2: Parsing
        setImportProgress(prev => ({
          ...prev,
          stage: 'parsing',
          message: 'Excel dosyası ayrıştırılıyor...'
        }))

        // Dynamically import XLSX only when needed
        const XLSX = await import('xlsx')
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        const devicesToImport = jsonData.map((row: any) => ({
          name: row['Cihaz Adı'] || row['name'],
          brand: row['Marka'] || row['brand'],
          model: row['Model'] || row['model'],
          serialNumber: row['Seri No'] || row['Seri Numarası'] || row['serialNumber'],
          tagNumber: row['Künye No'] || row['tagNumber'],
          barcode: row['Barkod'] || row['barcode'],
          rfidTag: row['RFID'] || row['rfidTag'],
          manufacturer: row['Üretici'] || row['manufacturer'],
          locationName: row['Lokasyon'] || row['location'],
          categoryName: row['Kategori'] || row['Cihaz Türü'] || row['category'],
          supplierName: row['Tedarikçi'] || row['supplier'],
          status: REVERSE_STATUS_MAP[row['Durum']] || row['status'] || 'ACTIVE',
          condition: row['Koşul'] || row['condition'] || 'GOOD',
          purchaseDate: row['Alım Tarihi'] || row['purchaseDate'],
          purchasePrice: row['Satın Alma Fiyatı'] || row['purchasePrice'],
          warrantyExpiry: row['Garanti Bitiş'] || row['warrantyExpiry'],
          nextMaintenanceDate: row['Sonraki Bakım'] || row['nextMaintenanceDate'],
          maintenanceInterval: row['Bakım Aralığı (Gün)'] || row['maintenanceInterval'],
          description: row['Açıklama'] || row['description']
        }))

        // Basic validation
        if (devicesToImport.length === 0) {
          setImportProgress(prev => ({
            ...prev,
            stage: 'error',
            message: 'Dosyada veri bulunamadı'
          }))
          setTimeout(() => setIsImporting(false), 2000)
          return
        }

        // Stage 3: Uploading
        setImportProgress(prev => ({
          ...prev,
          stage: 'uploading',
          message: `${devicesToImport.length} kayıt sunucuya gönderiliyor...`,
          totalRecords: devicesToImport.length
        }))

        const response = await fetch('/api/devices/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            devices: devicesToImport,
            hospitalId: activeHospitalId
          })
        })

        // Stage 4: Processing
        setImportProgress(prev => ({
          ...prev,
          stage: 'processing',
          message: 'Kayıtlar işleniyor...'
        }))

        const result = await response.json()

        if (response.ok) {
          // Stage 5: Done
          setImportProgress(prev => ({
            ...prev,
            stage: 'done',
            message: `${result.results.success} cihaz başarıyla aktarıldı${result.results.failed > 0 ? `, ${result.results.failed} hata` : ''}`,
            processedRecords: result.results.success
          }))

          if (result.results.failed > 0) {
            // Hatalı kayıtları localStorage'a kaydet ve yönlendir
            localStorage.setItem('importErrors', JSON.stringify(result.results.errors))
            localStorage.setItem('importSuccessCount', result.results.success.toString())
            setTimeout(() => {
              setIsImporting(false)
              window.location.href = '/dashboard/devices/import-status'
            }, 1500)
          } else {
            showSuccess(`${result.results.success} cihaz başarıyla içe aktarıldı`)
            setTimeout(() => {
              setIsImporting(false)
              window.location.reload()
            }, 1500)
          }
        } else {
          setImportProgress(prev => ({
            ...prev,
            stage: 'error',
            message: result.error || 'İçe aktarma başarısız'
          }))
          setTimeout(() => setIsImporting(false), 3000)
        }

      } catch (error) {
        console.error('Excel parse error:', error)
        setImportProgress(prev => ({
          ...prev,
          stage: 'error',
          message: 'Dosya işlenirken hata oluştu'
        }))
        setTimeout(() => setIsImporting(false), 3000)
      } finally {
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
    reader.readAsArrayBuffer(file)
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
          category: 'Genel',
          status: newDevice.status,
          lastMaintenance: new Date().toISOString().split('T')[0]
        }
        setDevices([...devices, deviceToAdd])
        showSuccess('Yeni cihaz başarıyla eklendi (Demo)')
      } else {
        // Find category name from categories list
        let categoryName = 'Genel'
        const matchedCategory = categories.find(c => c.name === newDevice.name)
        if (matchedCategory) {
          categoryName = matchedCategory.group || 'Genel'
        }

        const payload = {
          ...newDevice,
          categoryName,
          hospitalId: activeHospitalId || undefined, // Add active hospital
          // If locationId is 'NEW', send newLocationName as locationName
          locationName: newDevice.locationId === 'NEW' ? newDevice.newLocationName : undefined,
          locationId: newDevice.locationId === 'NEW' ? undefined : newDevice.locationId,
          // If supplierId is 'NEW', send newSupplierName as supplierName
          supplierName: newDevice.supplierId === 'NEW' ? newDevice.newSupplierName : undefined,
          supplierId: newDevice.supplierId === 'NEW' ? undefined : newDevice.supplierId
        }

        const response = await fetch('/api/devices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
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
            category: savedDevice.category?.name || 'Genel',
            supplier: savedDevice.supplier?.name,
            status: savedDevice.status,
            lastMaintenance: savedDevice.lastMaintenanceDate
              ? new Date(savedDevice.lastMaintenanceDate).toISOString().split('T')[0]
              : '-'
          }
          setDevices([deviceToAdd, ...devices])
          // Refresh lists to include newly created items
          if (newDevice.locationId === 'NEW' || newDevice.supplierId === 'NEW') {
            // Non-blocking background update
            Promise.all([
              fetch('/api/locations').then(r => r.json()).then(setLocations),
              fetch('/api/suppliers').then(r => r.json()).then(setSuppliers)
            ]).catch(console.error)
          }

          showSuccess('Yeni cihaz başarıyla eklendi')
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Kaydetme başarısız')
        }
      }

      setShowAddDevice(false)
      setNewDevice({
        name: 'MRI Cihazı',
        brand: '',
        model: '',
        serialNumber: '',
        barcode: '',
        rfidTag: '',
        manufacturer: '',
        locationId: '',
        newLocationName: '',
        supplierId: '',
        newSupplierName: '',
        status: 'ACTIVE',
        condition: 'GOOD',
        purchasePrice: 0,
        purchaseDate: '',
        warrantyExpiry: '',
        nextMaintenanceDate: '',
        maintenanceInterval: 180,
        description: '',
        productionYear: ''
      })
    } catch (error: any) {
      console.error('Error adding device:', error)
      showError(error?.message || 'Cihaz eklenirken hata oluştu')
    }
  }

  const handleQuickUpdate = async (id: string, field: string, value: string) => {
    // Optimistic update
    const oldDevices = [...devices]
    setDevices(devices.map(device =>
      device.id === id ? { ...device, [field]: value } : device
    ))

    if (!isDemoMode) {
      try {
        const response = await fetch(`/api/devices/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field === 'locationId' ? 'locationId' : field]: value })
        })

        if (!response.ok) throw new Error('Güncelleme başarısız')
        showSuccess('Cihaz güncellendi')
      } catch (error) {
        console.error('Update error:', error)
        showError('Güncelleme kaydedilemedi')
        setDevices(oldDevices) // Revert
      }
    } else {
      showSuccess('Cihaz güncellendi (Demo)')
    }
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
      {/* Import Progress Modal */}
      {isImporting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              {/* Progress Icon */}
              <div className="mb-6">
                {importProgress.stage === 'error' ? (
                  <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <X className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                ) : importProgress.stage === 'done' ? (
                  <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="w-16 h-16 mx-auto relative">
                    <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-400 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {importProgress.stage === 'error' ? 'İçe Aktarma Hatası' :
                  importProgress.stage === 'done' ? 'İçe Aktarma Tamamlandı' :
                    'Excel\'den İçe Aktarılıyor...'}
              </h3>

              {/* File Name */}
              {importProgress.fileName && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate">
                  📄 {importProgress.fileName}
                </p>
              )}

              {/* Progress Steps */}
              <div className="space-y-3 mb-6">
                <ProgressStep
                  label="Dosya Okunuyor"
                  isActive={importProgress.stage === 'reading'}
                  isCompleted={['parsing', 'uploading', 'processing', 'done'].includes(importProgress.stage)}
                  isError={importProgress.stage === 'error'}
                />
                <ProgressStep
                  label="Excel Ayrıştırılıyor"
                  isActive={importProgress.stage === 'parsing'}
                  isCompleted={['uploading', 'processing', 'done'].includes(importProgress.stage)}
                  isError={importProgress.stage === 'error'}
                />
                <ProgressStep
                  label="Sunucuya Gönderiliyor"
                  isActive={importProgress.stage === 'uploading'}
                  isCompleted={['processing', 'done'].includes(importProgress.stage)}
                  isError={importProgress.stage === 'error'}
                />
                <ProgressStep
                  label="Kayıtlar İşleniyor"
                  isActive={importProgress.stage === 'processing'}
                  isCompleted={importProgress.stage === 'done'}
                  isError={importProgress.stage === 'error'}
                />
              </div>

              {/* Status Message */}
              <p className={`text-sm font-medium ${importProgress.stage === 'error' ? 'text-red-600 dark:text-red-400' :
                importProgress.stage === 'done' ? 'text-green-600 dark:text-green-400' :
                  'text-gray-600 dark:text-gray-300'
                }`}>
                {importProgress.message}
              </p>

              {/* Record Count */}
              {importProgress.totalRecords > 0 && importProgress.stage !== 'error' && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {importProgress.stage === 'done'
                    ? `${importProgress.processedRecords} / ${importProgress.totalRecords} kayıt işlendi`
                    : `Toplam ${importProgress.totalRecords} kayıt`}
                </p>
              )}

              {/* Close button for error state */}
              {importProgress.stage === 'error' && (
                <button
                  onClick={() => setIsImporting(false)}
                  className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Kapat
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Cihaz Yönetimi</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm lg:text-base">Tüm tıbbi cihazları görüntüleyin ve yönetin</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Import/Export Buttons */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportExcel}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 lg:px-4 lg:py-3 rounded-lg font-semibold flex items-center space-x-1 lg:space-x-2 transition-colors text-sm lg:text-base"
            title="Excel'den Al"
          >
            <Download className="h-4 w-4 lg:h-5 lg:w-5" />
            <span className="hidden sm:inline">Excel'den Al</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 lg:px-4 lg:py-3 rounded-lg font-semibold flex items-center space-x-1 lg:space-x-2 transition-colors text-sm lg:text-base"
            title="Excel'e Aktar"
          >
            <Upload className="h-4 w-4 lg:h-5 lg:w-5" />
            <span className="hidden sm:inline">Excel'e Aktar</span>
          </button>

          <button
            onClick={() => setShowBarcodeReader(true)}
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-2 lg:px-4 lg:py-3 rounded-lg font-semibold flex items-center space-x-1 lg:space-x-2 transition-colors text-sm lg:text-base"
            title="Barkod Oku"
          >
            <QrCode className="h-4 w-4 lg:h-5 lg:w-5" />
            <span className="hidden sm:inline">Barkod Oku</span>
          </button>
          <button
            onClick={() => setShowAddDevice(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 lg:px-6 lg:py-3 rounded-lg font-semibold flex items-center space-x-1 lg:space-x-2 transition-colors text-sm lg:text-base"
            title="Yeni Cihaz Ekle"
          >
            <Plus className="h-4 w-4 lg:h-5 lg:w-5" />
            <span className="hidden sm:inline">Yeni Cihaz</span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 lg:p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-gray-700 rounded-lg transition-colors"
            title="Ayarlar"
          >
            <Settings className="h-5 w-5" />
          </button>

          {/* Bulk Delete Controls */}
          <div className="flex items-center space-x-2 border-l border-gray-200 dark:border-gray-700 pl-4 ml-2">
            {!isDeleteMode ? (
              <button
                onClick={() => setIsDeleteMode(true)}
                className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 px-4 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors border border-red-200 dark:border-red-900/30"
              >
                <Trash2 className="h-5 w-5" />
                <span>Cihaz Sil</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsDeleteMode(false)
                    setSelectedIds(new Set())
                  }}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  İptal
                </button>
                {selectedIds.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors shadow-sm"
                  >
                    <Trash2 className="h-5 w-5" />
                    <span>Seçilenleri Sil ({selectedIds.size})</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
        <QuickStat
          label="Onarımda"
          value={devices.filter(d => d.status === 'REPAIR').length}
          icon={<Package />}
          color="red"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Cihaz adı, marka, model veya seri numarası ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
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
              <option value="ACTIVE">Aktif</option>
              <option value="MAINTENANCE">Bakımda</option>
              <option value="CALIBRATION">Kalibrasyonda</option>
              <option value="REPAIR">Onarımda</option>
              <option value="INACTIVE">Pasif</option>
              <option value="RETIRED">Hizmet Dışı</option>
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
              {availableLocations.map((locName) => (
                <option key={locName} value={locName}>{locName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Devices - Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {paginatedDevices.map((device) => (
          <div key={device.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{device.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{device.brand} {device.model}</p>
              </div>
              <DeviceStatusBadge status={device.status} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-300">
                <span className="text-gray-400 text-xs">Künye:</span>
                <span className="font-mono text-xs">{device.tagNumber || '-'}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-300">
                <span className="text-gray-400 text-xs">Seri:</span>
                <span className="font-mono text-xs truncate">{device.serialNumber}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-300">
                <MapPin className="h-3 w-3 text-gray-400" />
                <span className="text-xs truncate">{device.location}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-300">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-xs">{device.lastMaintenance}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                {isDeleteMode && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(device.id)}
                    onChange={() => handleSelectDevice(device.id)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
                  />
                )}
                <button
                  onClick={() => {
                    setSelectedDeviceForQR(device)
                    setShowQRModal(true)
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  title="QR Kod"
                >
                  <QrCode className="h-4 w-4" />
                </button>
              </div>
              <a
                href={`/dashboard/devices/${device.id}`}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium text-sm"
              >
                Detaylar →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Devices Table - Desktop View */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {isDeleteMode && (
                  <th className="px-6 py-4 w-4">
                    <input
                      type="checkbox"
                      checked={filteredDevices.length > 0 && selectedIds.size === filteredDevices.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                    />
                  </th>
                )}
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Cihaz
                    <ArrowUpDown className={`h-4 w-4 ${sortConfig.key === 'name' ? 'text-blue-500' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  onClick={() => handleSort('tagNumber')}
                >
                  <div className="flex items-center gap-2">
                    Künye
                    <ArrowUpDown className={`h-4 w-4 ${sortConfig.key === 'tagNumber' ? 'text-blue-500' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  onClick={() => handleSort('brand')}
                >
                  <div className="flex items-center gap-2">
                    Marka
                    <ArrowUpDown className={`h-4 w-4 ${sortConfig.key === 'brand' ? 'text-blue-500' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  onClick={() => handleSort('model')}
                >
                  <div className="flex items-center gap-2">
                    Model
                    <ArrowUpDown className={`h-4 w-4 ${sortConfig.key === 'model' ? 'text-blue-500' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  onClick={() => handleSort('serialNumber')}
                >
                  <div className="flex items-center gap-2">
                    Seri No
                    <ArrowUpDown className={`h-4 w-4 ${sortConfig.key === 'serialNumber' ? 'text-blue-500' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  onClick={() => handleSort('location')}
                >
                  <div className="flex items-center gap-2">
                    Lokasyon
                    <ArrowUpDown className={`h-4 w-4 ${sortConfig.key === 'location' ? 'text-blue-500' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Durum
                    <ArrowUpDown className={`h-4 w-4 ${sortConfig.key === 'status' ? 'text-blue-500' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Son Bakım</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedDevices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                  {isDeleteMode && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(device.id)}
                        onChange={() => handleSelectDevice(device.id)}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900 dark:text-white">{device.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {device.tagNumber ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {device.tagNumber}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                      <button
                        onClick={() => {
                          setSelectedDeviceForQR(device)
                          setShowQRModal(true)
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="QR Kod Oluştur"
                      >
                        <QrCode className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-gray-200">{device.brand}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-gray-200">{device.model}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-600 dark:text-gray-300">{device.serialNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <QuickEditCell
                      value={(device as any).locationId || ''}
                      type="select"
                      options={(() => {
                        const hospitalDeviceLocationIds = new Set(
                          devices
                            .map(d => d.locationId)
                            .filter((id): id is string => Boolean(id))
                        )
                        const filteredLocations = activeHospitalId && hospitalDeviceLocationIds.size > 0
                          ? locations.filter(loc => hospitalDeviceLocationIds.has(loc.id))
                          : locations
                        return filteredLocations.map(loc => ({ value: loc.id, label: loc.name }))
                      })()}
                      onSave={(val) => handleQuickUpdate(device.id, 'locationId', val)}
                    >
                      <div className="flex items-center space-x-1 text-sm text-gray-700 dark:text-gray-300">
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
                    <div className="flex items-center space-x-1 text-sm text-gray-700 dark:text-gray-300">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{device.lastMaintenance}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={`/dashboard/devices/${device.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
                    >
                      Detaylar →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg px-4 lg:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
          Toplam <span className="font-semibold">{filteredDevices.length}</span> cihazdan <span className="font-semibold">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredDevices.length)}</span> arası gösteriliyor
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm ${currentPage === 1 ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white'}`}
          >
            Önceki
          </button>
          <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded">
            Sayfa {currentPage} / {totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white'}`}
          >
            Sonraki
          </button>
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Yeni Cihaz Ekle</h2>
            </div>
            <div className="p-6">
              <form className="grid grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); handleAddDevice(); }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cihaz Türü *</label>
                  <select
                    value={newDevice.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'NEW') {
                        setNewDevice({ ...newDevice, name: '' });
                      } else {
                        setNewDevice({ ...newDevice, name: val });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seçiniz...</option>
                    <option value="NEW" className="font-semibold text-blue-600">+ Yeni Cihaz Türü Ekle</option>
                    {Object.entries(groupedCategories).map(([group, catList]: any) => (
                      <optgroup key={group} label={group}>
                        {catList.map((cat: any) => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {/* Custom Device Type Input */}
                  {(!newDevice.name || !categories.find(c => c.name === newDevice.name)) && (
                    <input
                      type="text"
                      value={newDevice.name}
                      onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                      className="mt-2 w-full px-3 py-2 border border-blue-300 dark:border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:text-white"
                      placeholder="Yeni cihaz türünü yazınız..."
                      autoFocus
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marka</label>
                  <input
                    type="text"
                    value={newDevice.brand}
                    onChange={(e) => setNewDevice({ ...newDevice, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: Siemens"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
                  <input
                    type="text"
                    value={newDevice.model}
                    onChange={(e) => setNewDevice({ ...newDevice, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: Magnetom Vida"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seri Numarası *</label>
                  <input
                    type="text"
                    value={newDevice.serialNumber}
                    onChange={(e) => setNewDevice({ ...newDevice, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lokasyon</label>
                  <div className="space-y-2">
                    <select
                      value={newDevice.locationId}
                      onChange={(e) => setNewDevice({ ...newDevice, locationId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seçiniz</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                      <option value="NEW" className="font-semibold text-blue-600">+ Yeni Lokasyon Ekle</option>
                    </select>
                    {newDevice.locationId === 'NEW' && (
                      <input
                        type="text"
                        value={newDevice.newLocationName}
                        onChange={(e) => setNewDevice({ ...newDevice, newLocationName: e.target.value })}
                        className="w-full px-3 py-2 border border-blue-300 dark:border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:text-white"
                        placeholder="Yeni Lokasyon Adı"
                        autoFocus
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tedarikçi</label>
                  <div className="space-y-2">
                    <select
                      value={newDevice.supplierId}
                      onChange={(e) => setNewDevice({ ...newDevice, supplierId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seçiniz</option>
                      {suppliers.map((sup) => (
                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                      ))}
                      <option value="NEW" className="font-semibold text-blue-600">+ Yeni Tedarikçi Ekle</option>
                    </select>
                    {newDevice.supplierId === 'NEW' && (
                      <input
                        type="text"
                        value={newDevice.newSupplierName}
                        onChange={(e) => setNewDevice({ ...newDevice, newSupplierName: e.target.value })}
                        className="w-full px-3 py-2 border border-blue-300 dark:border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:text-white"
                        placeholder="Yeni Tedarikçi Adı"
                        autoFocus
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durum</label>
                  <select
                    value={newDevice.status}
                    onChange={(e) => setNewDevice({ ...newDevice, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Pasif</option>
                    <option value="MAINTENANCE">Bakımda</option>
                    <option value="CALIBRATION">Kalibrasyonda</option>
                    <option value="REPAIR">Onarımda</option>
                  </select>
                </div>

                {/* New Fields */}
                <div className="col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Teknik Detaylar</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Barkod</label>
                  <input
                    type="text"
                    value={newDevice.barcode}
                    onChange={(e) => setNewDevice({ ...newDevice, barcode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Opsiyonel"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RFID Etiketi</label>
                  <input
                    type="text"
                    value={newDevice.rfidTag}
                    onChange={(e) => setNewDevice({ ...newDevice, rfidTag: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Opsiyonel"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Üretici</label>
                  <input
                    type="text"
                    value={newDevice.manufacturer}
                    onChange={(e) => setNewDevice({ ...newDevice, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Üretim Yılı</label>
                  <input
                    type="number"
                    value={newDevice.productionYear}
                    onChange={(e) => setNewDevice({ ...newDevice, productionYear: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: 2023"
                    min="1990"
                    max={new Date().getFullYear()}
                  />
                </div>

                <div className="col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Satın Alma ve Garanti</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alım Tarihi</label>
                  <input
                    type="date"
                    value={newDevice.purchaseDate}
                    onChange={(e) => setNewDevice({ ...newDevice, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fiyat (TL)</label>
                  <input
                    type="number"
                    value={newDevice.purchasePrice}
                    onChange={(e) => setNewDevice({ ...newDevice, purchasePrice: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Garanti Bitiş</label>
                  <input
                    type="date"
                    value={newDevice.warrantyExpiry}
                    onChange={(e) => setNewDevice({ ...newDevice, warrantyExpiry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddDevice(false)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium"
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
      )
      }

      {/* Settings Modal */}
      {
        showSettingsModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Settings className="h-6 w-6 mr-2 text-gray-500" />
                Cihaz Ayarları
              </h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Künye Formatı
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Cihaz künye numaralarının nasıl oluşturulacağını belirleyin.
                  <br />
                  Kullanılabilir değişkenler: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{'{YYYY}'}</code>, <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{'{MM}'}</code>, <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{'{SEQ}'}</code>
                </p>
                <input
                  type="text"
                  value={tagFormat}
                  onChange={(e) => setTagFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="TAG-{YYYY}-{SEQ}"
                />
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Önizleme: <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {tagFormat
                      .replace('{YYYY}', new Date().getFullYear().toString())
                      .replace('{MM}', (new Date().getMonth() + 1).toString().padStart(2, '0'))
                      .replace('{SEQ}', '0001')}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="İptal"
                >
                  İptal
                </button>
                <button
                  onClick={saveSettings}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* QR Code Modal */}
      {
        showQRModal && selectedDeviceForQR && (
          <QRCodeGenerator
            value={`${getBaseUrl()}/scan/${selectedDeviceForQR.id}`}
            title={`${selectedDeviceForQR.tagNumber || 'No Tag'} - ${selectedDeviceForQR.name}`}
            onClose={() => setShowQRModal(false)}
          />
        )
      }
    </div >
  )
}

// Helper Components
function QuickStat({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
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
    ACTIVE: { label: 'Aktif', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    INACTIVE: { label: 'Pasif', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300' },
    MAINTENANCE: { label: 'Bakımda', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
    CALIBRATION: { label: 'Kalibrasyonda', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
    REPAIR: { label: 'Onarımda', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' }
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
  type: 'text' | 'select' | 'date';
  options?: { value: string; label: string }[];
  onSave: (value: string) => void;
  children: React.ReactNode;
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)

  useEffect(() => {
    setEditValue(value)
  }, [value])

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
      <div className="flex items-center space-x-2 z-50 relative">
        {type === 'select' ? (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            autoFocus
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            autoFocus
          />
        )}
        <button
          onClick={handleSave}
          className="p-1 text-green-600 hover:bg-green-50 rounded"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      className="group relative cursor-pointer"
      onClick={() => setIsEditing(true)}
    >
      {children}
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Edit2 className="h-3 w-3 text-gray-400" />
      </div>
    </div>
  )
}

// Progress Step Component for Import Modal
function ProgressStep({ label, isActive, isCompleted, isError }: {
  label: string;
  isActive: boolean;
  isCompleted: boolean;
  isError: boolean;
}) {
  return (
    <div className="flex items-center space-x-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isError ? 'bg-red-100 dark:bg-red-900/30' :
        isCompleted ? 'bg-green-100 dark:bg-green-900/30' :
          isActive ? 'bg-blue-100 dark:bg-blue-900/30 animate-pulse' :
            'bg-gray-100 dark:bg-gray-700'
        }`}>
        {isError ? (
          <X className="h-3 w-3 text-red-600 dark:text-red-400" />
        ) : isCompleted ? (
          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
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