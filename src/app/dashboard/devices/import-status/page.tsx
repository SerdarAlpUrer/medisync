'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'

export default function ImportStatusPage() {
    const router = useRouter()
    const [errors, setErrors] = useState<string[]>([])
    const [successCount, setSuccessCount] = useState(0)

    useEffect(() => {
        const storedErrors = localStorage.getItem('importErrors')
        const storedSuccess = localStorage.getItem('importSuccessCount')

        if (storedErrors) {
            setErrors(JSON.parse(storedErrors))
        }
        if (storedSuccess) {
            setSuccessCount(parseInt(storedSuccess))
        }
    }, [])

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-6">
            <div className="flex items-center space-x-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-6 w-6 text-gray-600" />
                </button>
                <h1 className="text-3xl font-bold text-gray-900">İçe Aktarma Sonuçları</h1>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center space-x-4">
                    <div className="bg-green-100 p-3 rounded-full">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm text-green-600 font-medium">Başarıyla Eklenen</p>
                        <p className="text-3xl font-bold text-green-700">{successCount}</p>
                    </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center space-x-4">
                    <div className="bg-red-100 p-3 rounded-full">
                        <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                        <p className="text-sm text-red-600 font-medium">Eklenemeyen</p>
                        <p className="text-3xl font-bold text-red-700">{errors.length}</p>
                    </div>
                </div>
            </div>

            {/* Error List */}
            {errors.length > 0 ? (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    <div className="p-4 bg-red-50 border-b border-red-100 flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <h2 className="font-semibold text-red-700">Hata Detayları</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {errors.map((error, index) => (
                            <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start space-x-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                        {index + 1}
                                    </span>
                                    <p className="text-gray-700 leading-relaxed">{error}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-green-800">Harika!</h3>
                    <p className="text-green-600">Tüm cihazlar başarıyla aktarıldı. Hata bulunamadı.</p>
                </div>
            )}
        </div>
    )
}
