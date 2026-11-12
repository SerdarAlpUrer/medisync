'use client'

import { useState, useEffect } from 'react'
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Package,
    Building,
    Calendar,
    Download,
    PieChart,
    BarChart3
} from 'lucide-react'
import { useHospital } from '@/contexts/HospitalContext'
import { exportCostReportToExcel } from '@/lib/export'

interface CostData {
    totalCost: number
    maintenanceCost: number
    sparepartsCost: number
    calibrationCost: number
    byDevice: Array<{
        deviceId: string
        deviceName: string
        brand: string
        totalCost: number
        maintenanceCount: number
    }>
    byDepartment: Array<{
        department: string
        totalCost: number
        deviceCount: number
    }>
    monthly: Array<{
        month: string
        cost: number
    }>
}

export default function CostReportsPage() {
    const [data, setData] = useState<CostData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [dateRange, setDateRange] = useState('thisYear')
    const { activeHospitalId } = useHospital()

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const url = activeHospitalId
                    ? `/api/reports/costs?hospitalId=${activeHospitalId}&range=${dateRange}`
                    : `/api/reports/costs?range=${dateRange}`
                const res = await fetch(url)
                if (res.ok) {
                    const costData = await res.json()
                    setData(costData)
                }
            } catch (error) {
                console.error('Error fetching cost data:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [activeHospitalId, dateRange])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    const totalCost = data?.totalCost || 0

    const handleExportExcel = () => {
        if (!data) return
        exportCostReportToExcel(data)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Maliyet Raporları</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Bakım ve onarım maliyetlerini analiz edin</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                    >
                        <option value="thisMonth">Bu Ay</option>
                        <option value="lastMonth">Geçen Ay</option>
                        <option value="thisYear">Bu Yıl</option>
                        <option value="lastYear">Geçen Yıl</option>
                    </select>
                    <button
                        onClick={handleExportExcel}
                        disabled={!data}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg flex items-center space-x-2 transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Excel</span>
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Toplam Maliyet</p>
                            <p className="text-3xl font-bold mt-1">₺{totalCost.toLocaleString('tr-TR')}</p>
                        </div>
                        <DollarSign className="h-12 w-12 text-blue-200 opacity-50" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Bakım Maliyeti</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                ₺{(data?.maintenanceCost || 0).toLocaleString('tr-TR')}
                            </p>
                        </div>
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Yedek Parça</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                ₺{(data?.sparepartsCost || 0).toLocaleString('tr-TR')}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Kalibrasyon</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                ₺{(data?.calibrationCost || 0).toLocaleString('tr-TR')}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Devices by Cost */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Package className="h-5 w-5 mr-2 text-blue-500" />
                        En Maliyetli Cihazlar
                    </h2>
                    <div className="space-y-3">
                        {(data?.byDevice || []).slice(0, 5).map((device, index) => (
                            <div key={device.deviceId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-bold">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{device.deviceName}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{device.brand} • {device.maintenanceCount} bakım</p>
                                    </div>
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white">₺{device.totalCost.toLocaleString('tr-TR')}</span>
                            </div>
                        ))}
                        {(!data?.byDevice || data.byDevice.length === 0) && (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-4">Veri bulunamadı</p>
                        )}
                    </div>
                </div>

                {/* Department Costs */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Building className="h-5 w-5 mr-2 text-purple-500" />
                        Departman Bazlı Maliyetler
                    </h2>
                    <div className="space-y-3">
                        {(data?.byDepartment || []).map((dept, index) => {
                            const percentage = totalCost > 0 ? (dept.totalCost / totalCost * 100) : 0
                            return (
                                <div key={dept.department} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{dept.department}</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">₺{dept.totalCost.toLocaleString('tr-TR')}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                        <div
                                            className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                        {(!data?.byDepartment || data.byDepartment.length === 0) && (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-4">Veri bulunamadı</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Monthly Trend */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-green-500" />
                    Aylık Maliyet Trendi
                </h2>
                <div className="flex items-end space-x-2 h-48">
                    {(data?.monthly || []).map((month, index) => {
                        const maxCost = Math.max(...(data?.monthly || []).map(m => m.cost), 1)
                        const height = (month.cost / maxCost) * 100
                        return (
                            <div key={month.month} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-500 hover:from-green-600 hover:to-green-500"
                                    style={{ height: `${height}%`, minHeight: '4px' }}
                                    title={`₺${month.cost.toLocaleString('tr-TR')}`}
                                />
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">{month.month}</span>
                            </div>
                        )
                    })}
                    {(!data?.monthly || data.monthly.length === 0) && (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4 w-full">Trend verisi bulunamadı</p>
                    )}
                </div>
            </div>
        </div>
    )
}
