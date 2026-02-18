'use client'

import { useState, useMemo } from 'react'
import { FileDown, Table as TableIcon, Filter, RefreshCw, FileText } from 'lucide-react'
import { generateDeviceReport, generateMaintenanceReport } from '@/lib/pdf-generator'
import { exportDevicesToExcel, exportMaintenanceToExcel } from '@/lib/export'
import { useToast } from '@/components/ToastProvider'

interface ReportBuilderProps {
    devices: any[]
    maintenances: any[]
    calibrations: any[]
}

export default function ReportBuilder({ devices, maintenances, calibrations }: ReportBuilderProps) {
    const [source, setSource] = useState<'DEVICES' | 'MAINTENANCE' | 'CALIBRATION'>('DEVICES')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [searchTerm, setSearchTerm] = useState('')
    const { showSuccess, showError } = useToast()

    // Filter Logic
    const filteredData = useMemo(() => {
        let data: any[] = []
        if (source === 'DEVICES') data = devices
        else if (source === 'MAINTENANCE') data = maintenances
        else if (source === 'CALIBRATION') data = calibrations

        return data.filter(item => {
            // Status Filter
            if (statusFilter !== 'ALL') {
                if (item.status !== statusFilter) return false
            }

            // Search Filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase()
                const matchesName = item.name?.toLowerCase().includes(searchLower) ||
                    item.device?.name?.toLowerCase().includes(searchLower)
                const matchesSerial = item.serialNumber?.toLowerCase().includes(searchLower)

                if (!matchesName && !matchesSerial) return false
            }

            return true
        })
    }, [source, statusFilter, searchTerm, devices, maintenances, calibrations])

    // Export Handlers
    const handleExportPDF = () => {
        try {
            if (source === 'DEVICES') {
                generateDeviceReport(filteredData)
            } else if (source === 'MAINTENANCE') {
                generateMaintenanceReport(filteredData)
            } else {
                showError('Bu rapor türü için PDF desteği yakında eklenecek')
                return
            }
            showSuccess('PDF raporu oluşturuldu')
        } catch (error) {
            console.error(error)
            showError('PDF oluşturulurken hata meydana geldi')
        }
    }

    const handleExportExcel = () => {
        try {
            if (source === 'DEVICES') {
                exportDevicesToExcel(filteredData)
            } else if (source === 'MAINTENANCE') {
                exportMaintenanceToExcel(filteredData)
            } else {
                // Generic export or specific calibration export
                exportMaintenanceToExcel(filteredData) // Fallback reusing maintenance export for now matches structure often
            }
            showSuccess('Excel raporu oluşturuldu')
        } catch (error) {
            showError('Excel oluşturulurken hata meydana geldi')
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-6">
                <FileText className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Rapor Oluşturucu</h2>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* Source Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Veri Kaynağı</label>
                    <select
                        value={source}
                        onChange={(e) => {
                            setSource(e.target.value as any)
                            setStatusFilter('ALL') // Reset filter on source change
                        }}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="DEVICES">Cihaz Envanteri</option>
                        <option value="MAINTENANCE">Bakım Kayıtları</option>
                        <option value="CALIBRATION">Kalibrasyonlar</option>
                    </select>
                </div>

                {/* Status Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durum Filtresi</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ALL">Tümü</option>
                        {source === 'DEVICES' && (
                            <>
                                <option value="ACTIVE">Aktif</option>
                                <option value="PASSIVE">Pasif</option>
                                <option value="MAINTENANCE">Bakımda</option>
                            </>
                        )}
                        {(source === 'MAINTENANCE' || source === 'CALIBRATION') && (
                            <>
                                <option value="SCHEDULED">Planlandı</option>
                                <option value="IN_PROGRESS">Devam Ediyor</option>
                                <option value="COMPLETED">Tamamlandı</option>
                            </>
                        )}
                    </select>
                </div>

                {/* Search */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Arama</label>
                    <input
                        type="text"
                        placeholder="İsim, seri no vb..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                <button
                    onClick={handleExportPDF}
                    className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                    <FileDown className="h-4 w-4 mr-2" />
                    PDF İndir
                </button>
                <button
                    onClick={handleExportExcel}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                    <TableIcon className="h-4 w-4 mr-2" />
                    Excel İndir
                </button>
                <div className="ml-auto flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">{filteredData.length}</span>
                    <span className="ml-1">kayıt bulundu</span>
                </div>
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            {source === 'DEVICES' && (
                                <>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Cihaz</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Marka/Model</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Seri No</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Durum</th>
                                </>
                            )}
                            {(source === 'MAINTENANCE' || source === 'CALIBRATION') && (
                                <>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Cihaz</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Tip</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Tarih</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Durum</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        {filteredData.slice(0, 10).map((item, i) => (
                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                {source === 'DEVICES' && (
                                    <>
                                        <td className="px-4 py-3 text-gray-900 dark:text-white">{item.name}</td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{item.brand} {item.model}</td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono">{item.serialNumber}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </>
                                )}
                                {(source === 'MAINTENANCE' || source === 'CALIBRATION') && (
                                    <>
                                        <td className="px-4 py-3 text-gray-900 dark:text-white">{item.device?.name || '-'}</td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{item.type || 'Kalibrasyon'}</td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                            {item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString('tr-TR') : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                    item.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredData.length > 10 && (
                    <div className="p-3 text-center text-xs text-gray-500 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
                        ...ve {filteredData.length - 10} kayıt daha (Tümünü görmek için indirin)
                    </div>
                )}
                {filteredData.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        Kayıt bulunamadı. Filtreleri kontrol edin.
                    </div>
                )}
            </div>
        </div>
    )
}
