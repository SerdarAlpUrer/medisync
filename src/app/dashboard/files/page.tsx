'use client'

import { useState, useEffect, useRef } from 'react'
import {
    FileText,
    Upload,
    Download,
    Trash2,
    Search,
    FolderOpen,
    File,
    Image,
    FileSpreadsheet,
    Link2,
    Eye,
    Calendar
} from 'lucide-react'
import { useToast } from '@/components/ToastProvider'

interface FileItem {
    id: string
    fileName: string
    fileType: string
    filePath: string
    fileSize: number
    uploadedAt: string
    uploadedBy: string
    deviceId?: string
    deviceName?: string
    category: string
}

const FILE_CATEGORIES = [
    { value: 'manual', label: 'Kullanım Kılavuzu' },
    { value: 'maintenance', label: 'Bakım Dokümanı' },
    { value: 'calibration', label: 'Kalibrasyon Sertifikası' },
    { value: 'warranty', label: 'Garanti Belgesi' },
    { value: 'invoice', label: 'Fatura' },
    { value: 'report', label: 'Rapor' },
    { value: 'other', label: 'Diğer' }
]

export default function FilesPage() {
    const [files, setFiles] = useState<FileItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCategory, setFilterCategory] = useState('ALL')
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { showSuccess, showError } = useToast()

    const [uploadData, setUploadData] = useState({
        category: 'manual',
        deviceId: ''
    })

    useEffect(() => {
        fetchFiles()
    }, [])

    const fetchFiles = async () => {
        try {
            const res = await fetch('/api/files')
            if (res.ok) {
                const data = await res.json()
                setFiles(data.files || [])
            }
        } catch (error) {
            console.error('Error fetching files:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('category', uploadData.category)
            if (uploadData.deviceId) {
                formData.append('deviceId', uploadData.deviceId)
            }

            const res = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData
            })

            if (res.ok) {
                showSuccess('Dosya başarıyla yüklendi')
                fetchFiles()
                setShowUploadModal(false)
            } else {
                const error = await res.json()
                showError(error.message || 'Dosya yüklenemedi')
            }
        } catch (error) {
            showError('Dosya yüklenirken hata oluştu')
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return

        try {
            const res = await fetch(`/api/files/${id}`, { method: 'DELETE' })
            if (res.ok) {
                showSuccess('Dosya silindi')
                setFiles(files.filter(f => f.id !== id))
            } else {
                showError('Dosya silinemedi')
            }
        } catch (error) {
            showError('Hata oluştu')
        }
    }

    const getFileIcon = (fileType: string) => {
        if (fileType?.includes('image')) return <Image className="h-8 w-8 text-purple-500" />
        if (fileType?.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />
        if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) return <FileSpreadsheet className="h-8 w-8 text-green-500" />
        return <File className="h-8 w-8 text-blue-500" />
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const filteredFiles = files.filter(file => {
        const matchesSearch = file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (file.deviceName && file.deviceName.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesCategory = filterCategory === 'ALL' || file.category === filterCategory
        return matchesSearch && matchesCategory
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Dosya Yönetimi</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Dökümanları merkezi olarak yönetin</p>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                    <Upload className="h-5 w-5" />
                    <span>Dosya Yükle</span>
                </button>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Dosya Yükle</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
                                <select
                                    value={uploadData.category}
                                    onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                >
                                    {FILE_CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dosya Seç</label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleUpload}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                    disabled={isUploading}
                                />
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                disabled={isUploading}
                            >
                                İptal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search and Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Dosya adı veya cihaz ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                    >
                        <option value="ALL">Tüm Kategoriler</option>
                        {FILE_CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Dosya</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{files.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kılavuzlar</p>
                    <p className="text-2xl font-bold text-blue-600">{files.filter(f => f.category === 'manual').length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sertifikalar</p>
                    <p className="text-2xl font-bold text-green-600">{files.filter(f => f.category === 'calibration').length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Boyut</p>
                    <p className="text-2xl font-bold text-purple-600">{formatFileSize(files.reduce((acc, f) => acc + (f.fileSize || 0), 0))}</p>
                </div>
            </div>

            {/* Files List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <FolderOpen className="h-5 w-5 mr-2 text-yellow-500" />
                        Dosyalar ({filteredFiles.length})
                    </h2>
                </div>

                {filteredFiles.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Henüz dosya yüklenmemiş</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredFiles.map((file) => (
                            <div key={file.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                                        {getFileIcon(file.fileType)}
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white truncate">{file.fileName}</p>
                                            <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                                                <span>{formatFileSize(file.fileSize)}</span>
                                                <span>•</span>
                                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 rounded text-xs">
                                                    {FILE_CATEGORIES.find(c => c.value === file.category)?.label || file.category}
                                                </span>
                                                {file.deviceName && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center">
                                                            <Link2 className="h-3 w-3 mr-1" />
                                                            {file.deviceName}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-4">
                                        <a
                                            href={file.filePath}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            title="Görüntüle"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </a>
                                        <a
                                            href={file.filePath}
                                            download
                                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                            title="İndir"
                                        >
                                            <Download className="h-4 w-4" />
                                        </a>
                                        <button
                                            onClick={() => handleDelete(file.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Sil"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
