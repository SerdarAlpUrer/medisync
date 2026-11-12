'use client'

import React from 'react'
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// Modern Color Palette
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Aktif',
    INACTIVE: 'Pasif',
    MAINTENANCE: 'Bakımda',
    CALIBRATION: 'Kalibrasyonda',
    REPAIR: 'Onarımda',
    RETIRED: 'Hizmet Dışı'
}

interface ChartData {
    statusDistribution: Array<{ name: string; value: number }>
    costDistribution: Array<{ name: string; value: number }>
    categoryDistribution: Array<{ name: string; value: number }>
}

export function DashboardCharts({ data }: { data: ChartData }) {
    // Transform status labels for display
    const statusData = data.statusDistribution.map(d => ({
        ...d,
        name: STATUS_LABELS[d.name] || d.name
    }))

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Device Status Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Cihaz Durum Dağılımı</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px' }}
                                itemStyle={{ color: '#1f2937' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Maintenance Cost Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Bakım Maliyet Dağılımı (Bu Ay)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data.costDistribution}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip
                                formatter={(value: number) => `₺${value.toLocaleString('tr-TR')}`}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="value" name="Maliyet" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                {data.costDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category Top 5 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 lg:col-span-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">En Çok Bulunan Cihaz Türleri</h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={data.categoryDistribution}
                            margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="value" name="Adet" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
