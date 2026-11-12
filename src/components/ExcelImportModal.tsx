'use client'

import React, { useState, useRef } from 'react'
import {
    FileSpreadsheet,
    AlertTriangle,
    Download,
    Upload,
    CheckCircle2,
    X,
    FileText,
    CheckSquare,
    Square,
    Info,
    HelpCircle
} from 'lucide-react'
import { downloadDeviceImportTemplate } from '@/lib/export'

interface ExcelImportModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirmImport: (file: File) => void
}

export default function ExcelImportModal({
    isOpen,
    onClose,
    onConfirmImport
}: ExcelImportModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isConfirmed, setIsConfirmed] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0]
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                setSelectedFile(file)
            }
        }
    }

    const handleStartImport = () => {
        if (!selectedFile || !isConfirmed) return
        onConfirmImport(selectedFile)
        handleClose()
    }

    const handleClose = () => {
        setSelectedFile(null)
        setIsConfirmed(false)
        onClose()
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col my-auto border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 lg:p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="bg-green-100 dark:bg-green-900/40 p-2.5 rounded-xl">
                            <FileSpreadsheet className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Excel ile Cihaz İçe Aktar</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Toplu tıbbi cihaz envanteri yükleme sihirbazı</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="p-5 lg:p-6 space-y-5 overflow-y-auto">
                    {/* Warning Callout Box */}
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4">
                        <div className="flex items-start space-x-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div className="space-y-1 text-sm">
                                <h3 className="font-semibold text-amber-900 dark:text-amber-300">
                                    ⚠️ Önemli: Dosyanız Standart Şablona Uygun Olmalıdır!
                                </h3>
                                <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed text-xs lg:text-sm">
                                    Cihazların sorunsuz ve eksiksiz içeri aktarılabilmesi için Excel dosyanızdaki sütun başlıkları aşağıdaki şablonla <strong>birebir eşleşmelidir</strong>. Hatalı sütun isimleri veya eksik zorunlu alanlar içe aktarma hatasına neden olabilir.
                                </p>
                            </div>
                        </div>

                        {/* Column Structure List */}
                        <div className="mt-3 pt-3 border-t border-amber-200/70 dark:border-amber-800/50 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div className="bg-white/80 dark:bg-gray-900/50 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1 flex items-center space-x-1">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    <span>Zorunlu / Temel Alanlar:</span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400">
                                    <strong>Cihaz Adı</strong>, <strong>Seri No</strong>, <strong>Marka</strong>, <strong>Model</strong>, <strong>Lokasyon</strong>, <strong>Kategori</strong>, <strong>Durum</strong>
                                </p>
                            </div>
                            <div className="bg-white/80 dark:bg-gray-900/50 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1 flex items-center space-x-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    <span>Opsiyonel / Ek Alanlar:</span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400">
                                    <strong>Künye No</strong> (boşsa oto üretilir), Barkod, RFID, Üretici, Tedarikçi, Alım Tarihi, Fiyat, Garanti Bitiş, Son/Sonraki Bakım, Bakım Aralığı, Açıklama
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Template Download Section */}
                    <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700/60 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs lg:text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    Hazır Excel Şablonunu İndirin
                                </span>
                            </div>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">.xlsx formatında</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                            Verilerinizi doğru sütunlara girmek için boş veya örnek doldurulmuş şablonu indirip kullanabilirsiniz:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => downloadDeviceImportTemplate('sample')}
                                className="flex items-center justify-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium transition-colors shadow-sm"
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span>📊 Örnek Şablon İndir (Dolu)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => downloadDeviceImportTemplate('empty')}
                                className="flex items-center justify-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors shadow-sm"
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span>📄 Boş Şablon İndir</span>
                            </button>
                        </div>
                    </div>

                    {/* File Dropzone / Selector */}
                    <div>
                        <label className="block text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Yüklenecek Excel Dosyası
                        </label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".xlsx, .xls"
                            className="hidden"
                        />

                        {!selectedFile ? (
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                                    dragActive
                                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-green-500 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                                }`}
                            >
                                <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Excel dosyasını buraya sürükleyin veya <span className="text-green-600 dark:text-green-400 font-semibold underline">dosya seçin</span>
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Desteklenen formatlar: .xlsx, .xls
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/60 rounded-xl">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <div className="bg-green-600 text-white p-2 rounded-lg shrink-0">
                                        <FileSpreadsheet className="h-5 w-5" />
                                    </div>
                                    <div className="truncate">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-xs text-green-700 dark:text-green-400">
                                            {formatFileSize(selectedFile.size)} • Yüklemeye hazır
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 shrink-0 ml-2"
                                >
                                    Değiştir
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mandatory Confirmation Checkbox */}
                    <div
                        onClick={() => setIsConfirmed(!isConfirmed)}
                        className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer select-none transition-colors ${
                            isConfirmed
                                ? 'bg-green-50/70 dark:bg-green-950/30 border-green-300 dark:border-green-700'
                                : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        }`}
                    >
                        <div className="mt-0.5 shrink-0 text-green-600 dark:text-green-400">
                            {isConfirmed ? (
                                <CheckSquare className="h-5 w-5" />
                            ) : (
                                <Square className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                            )}
                        </div>
                        <div className="text-xs lg:text-sm text-gray-700 dark:text-gray-300 leading-snug">
                            <span className="font-semibold text-gray-900 dark:text-white">Şablon Uygunluğu Onayı: </span>
                            Yüklediğim dosyanın yukarıda belirtilen MediSync standart Excel şablonuna ve sütun başlıklarına uygun olduğunu kontrol ettim ve onaylıyorum.
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-4 lg:p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        type="button"
                        disabled={!selectedFile || !isConfirmed}
                        onClick={handleStartImport}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm flex items-center space-x-2"
                    >
                        <Upload className="h-4 w-4" />
                        <span>İçeri Aktarmayı Başlat</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
