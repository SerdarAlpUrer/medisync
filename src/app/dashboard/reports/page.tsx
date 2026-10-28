'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Download, TrendingUp, PieChart, X, FileSpreadsheet } from 'lucide-react'
import { useToast } from '@/components/ToastProvider'
import { useHospital } from '@/contexts/HospitalContext'
import { exportDevicesToExcel, exportMaintenanceToExcel, exportCalibrationsToExcel } from '@/lib/export'
import ReportBuilder from '@/components/ReportBuilder'

export default function ReportsPage() {
    const [stats, setStats] = useState({
        totalDevices: 0,
        activeDevices: 0,
        maintenanceThisMonth: 0,
        calibrationThisMonth: 0,
        totalCost: 0
    })
    const [devices, setDevices] = useState<any[]>([])
    const [maintenances, setMaintenances] = useState<any[]>([])
    const [calibrations, setCalibrations] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showReportModal, setShowReportModal] = useState(false)
    const [selectedReport, setSelectedReport] = useState<any>(null)
    const { showSuccess, showError } = useToast()
    const { activeHospital } = useHospital()

    useEffect(() => {
        fetchData()
    }, [activeHospital])

    const fetchData = async () => {
        try {
            setIsLoading(true)

            const queryParams = activeHospital ? `?hospitalId=${activeHospital.id}` : ''

            const [statsRes, devicesRes, maintenanceRes, calibrationRes] = await Promise.all([
                fetch('/api/reports'),
                fetch(`/api/devices${queryParams}`),
                fetch(`/api/maintenance${queryParams}`),
                fetch(`/api/calibration${queryParams}`)
            ])

            if (statsRes.ok) {
                setStats(await statsRes.json())
            }
            if (devicesRes.ok) {
                const data = await devicesRes.json()
                const list = Array.isArray(data) ? data : (data.data?.devices || data.devices || data.data || [])
                setDevices(Array.isArray(list) ? list : [])
            }
            if (maintenanceRes.ok) {
                const data = await maintenanceRes.json()
                const list = Array.isArray(data) ? data : (data.data || [])
                setMaintenances(Array.isArray(list) ? list : [])
            }
            if (calibrationRes.ok) {
                const data = await calibrationRes.json()
                const list = Array.isArray(data) ? data : (data.data || [])
                setCalibrations(Array.isArray(list) ? list : [])
            }
        } catch (error) {
            console.error('Error fetching report data:', error)
            showError('Rapor verileri yüklenirken hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDownload = (reportName: string, category: string) => {
        try {
            switch (category) {
                case 'Cihaz Raporları':
                    if (reportName === 'Cihaz Envanteri' || reportName === 'Durum Raporu' || reportName === 'Lokasyon Bazlı') {
                        exportDevicesToExcel(devices)
                        showSuccess('Cihaz raporu indirildi')
                    }
                    break
                case 'Bakım Raporları':
                    exportMaintenanceToExcel(maintenances)
                    showSuccess('Bakım raporu indirildi')
                    break
                case 'Kalibrasyon Raporları':
                    exportCalibrationsToExcel(calibrations)
                    showSuccess('Kalibrasyon raporu indirildi')
                    break
                case 'Mali Raporlar':
                    // Export combined cost data
                    const costData = [
                        ...maintenances.map(m => ({ ...m, type: 'Bakım' })),
                        ...calibrations.map(c => ({ ...c, type: 'Kalibrasyon' }))
                    ].filter(item => item.cost)
                    if (costData.length > 0) {
                        exportMaintenanceToExcel(costData)
                        showSuccess('Mali rapor indirildi')
                    } else {
                        showError('Maliyet verisi bulunamadı')
                    }
                    break
                default:
                    showError('Bu rapor türü henüz desteklenmiyor')
            }
        } catch (error) {
            showError('Rapor indirilemedi')
        }
    }

    const handleViewReport = (reportName: string, category: string) => {
        let data: any[] = []
        let columns: string[] = []

        switch (category) {
            case 'Cihaz Raporları':
                data = devices
                columns = ['Cihaz Adı', 'Marka', 'Model', 'Seri No', 'Durum', 'Lokasyon']
                break
            case 'Bakım Raporları':
                data = maintenances
                columns = ['Cihaz', 'Tip', 'Durum', 'Tarih', 'Teknisyen', 'Maliyet']
                break
            case 'Kalibrasyon Raporları':
                data = calibrations
                columns = ['Cihaz', 'Durum', 'Tarih', 'Geçerlilik', 'Lab', 'Sertifika No']
                break
            case 'Mali Raporlar':
                data = [
                    ...maintenances.map(m => ({ ...m, reportType: 'Bakım' })),
                    ...calibrations.map(c => ({ ...c, reportType: 'Kalibrasyon' }))
                ].filter(item => item.cost)
                columns = ['Tür', 'Cihaz', 'Tarih', 'Maliyet']
                break
        }

        setSelectedReport({ name: reportName, category, data, columns })
        setShowReportModal(true)
    }

    const reportCategories = [
        {
            title: 'Cihaz Raporları',
            reports: [
                { name: 'Cihaz Envanteri', description: 'Tüm cihazların detaylı listesi' },
                { name: 'Durum Raporu', description: 'Cihazların mevcut durumu' },
                { name: 'Lokasyon Bazlı', description: 'Departmanlara göre cihaz dağılımı' },
            ],
        },
        {
            title: 'Bakım Raporları',
            reports: [
                { name: 'Bakım Geçmişi', description: 'Tamamlanan bakım işlemleri' },
                { name: 'Bakım Maliyetleri', description: 'Aylık/yıllık bakım giderleri' },
                { name: 'Planlı Bakımlar', description: 'Yaklaşan bakım planları' },
            ],
        },
        {
            title: 'Kalibrasyon Raporları',
            reports: [
                { name: 'Kalibrasyon Takvimi', description: 'Yaklaşan kalibrasyonlar' },
                { name: 'Sertifikalar', description: 'Kalibrasyon sertifika listesi' },
                { name: 'Geçmiş Kalibrasyonlar', description: 'Tamamlanan kalibrasyonlar' },
            ],
        },
        {
            title: 'Mali Raporlar',
            reports: [
                { name: 'Toplam Maliyet Analizi', description: 'Cihaz başına toplam maliyetler' },
                { name: 'Bütçe Raporu', description: 'Bütçe kullanım oranları' },
                { name: 'ROI Analizi', description: 'Yatırım getirisi analizi' },
            ],
        },
    ]

    if (isLoading) {
        return <div className="flex justify-center items-center h-64">Yükleniyor...</div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Raporlar</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Detaylı raporlar oluşturun ve analiz yapın</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <QuickStatCard
                    title="Toplam Cihaz"
                    value={stats.totalDevices.toString()}
                    trend={`${stats.activeDevices} Aktif`}
                    color="blue"
                />
                <QuickStatCard
                    title="Bu Ay Bakım"
                    value={stats.maintenanceThisMonth.toString()}
                    trend="Planlı"
                    color="green"
                />
                <QuickStatCard
                    title="Bu Ay Kalibrasyon"
                    value={stats.calibrationThisMonth.toString()}
                    trend="Planlı"
                    color="purple"
                />
                <QuickStatCard
                    title="Toplam Maliyet (Bu Ay)"
                    value={`₺${stats.totalCost.toLocaleString('tr-TR')}`}
                    trend="Bakım + Kalibrasyon"
                    color="orange"
                />
            </div>

            {/* Report Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reportCategories.map((category, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{category.title}</h2>
                        <div className="space-y-3">
                            {category.reports.map((report, reportIndex) => (
                                <div key={reportIndex} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{report.name}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{report.description}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleDownload(report.name, category.title)}
                                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                            title="Excel olarak indir"
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleViewReport(report.name, category.title)}
                                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                            title="Görüntüle"
                                        >
                                            <BarChart3 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Report Builder */}
            <ReportBuilder
                devices={devices}
                maintenances={maintenances}
                calibrations={calibrations}
            />

            {/* Report Viewer Modal */}
            {showReportModal && selectedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedReport.name}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedReport.category} - {selectedReport.data.length} kayıt</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => handleDownload(selectedReport.name, selectedReport.category)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                                >
                                    <Download className="h-4 w-4" />
                                    <span>Excel İndir</span>
                                </button>
                                <button
                                    onClick={() => setShowReportModal(false)}
                                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-auto max-h-[70vh]">
                            {selectedReport.data.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>Bu rapor için veri bulunamadı</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                {selectedReport.columns.map((col: string, i: number) => (
                                                    <th key={i} className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {selectedReport.data.slice(0, 50).map((item: any, i: number) => (
                                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    {selectedReport.category === 'Cihaz Raporları' && (
                                                        <>
                                                            <td className="px-4 py-3 text-gray-900 dark:text-white">{item.name}</td>
                                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.brand || '-'}</td>
                                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.model || '-'}</td>
                                                            <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">{item.serialNumber}</td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                                    {item.status === 'ACTIVE' ? 'Aktif' : item.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.location?.name || '-'}</td>
                                                        </>
                                                    )}
                                                    {selectedReport.category === 'Bakım Raporları' && (
                                                        <>
                                                            <td className="px-4 py-3 text-gray-900 dark:text-white">{item.device?.name || '-'}</td>
                                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.type || '-'}</td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString('tr-TR') : '-'}</td>
                                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.technician?.name || '-'}</td>
                                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.cost ? `₺${item.cost.toLocaleString('tr-TR')}` : '-'}</td>
                                                        </>
                                                    )}
                                                    {selectedReport.category === 'Kalibrasyon Raporları' && (
                                                        <>
                                                            <td className="px-4 py-3 text-gray-900 dark:text-white">{item.device?.name || '-'}</td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString('tr-TR') : '-'}</td>
                                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('tr-TR') : '-'}</td>
                                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.calibrationLab || '-'}</td>
                                                            <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">{item.certificateNumber || '-'}</td>
                                                        </>
                                                    )}
                                                    {selectedReport.category === 'Mali Raporlar' && (
                                                        <>
                                                            <td className="px-4 py-3 text-gray-900 dark:text-white">{item.reportType}</td>
                                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.device?.name || '-'}</td>
                                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString('tr-TR') : '-'}</td>
                                                            <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">₺{item.cost?.toLocaleString('tr-TR') || '0'}</td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {selectedReport.data.length > 50 && (
                                        <p className="text-center text-gray-500 mt-4 text-sm">
                                            İlk 50 kayıt gösteriliyor. Tüm verileri görmek için Excel olarak indirin.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function QuickStatCard({
    title,
    value,
    trend,
    color
}: {
    title: string
    value: string
    trend: string
    color: string
}) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{title}</p>
            <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-semibold">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {trend}
                </div>
            </div>
        </div>
    )
}
