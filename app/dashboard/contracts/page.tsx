'use client'

import { useState, useEffect } from 'react'
import {
    FileText,
    Plus,
    Calendar,
    Search,
    Filter,
    Download,
    X,
    Upload,
    AlertCircle,
    Trash2,
    DollarSign,
    CheckCircle,
    File,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { useToast } from '@/components/ToastProvider'
import { useHospital } from '@/contexts/HospitalContext'
import { useAppearance } from '@/contexts/AppearanceContext'
import Link from 'next/link'

export default function ContractsPage() {
    const [contracts, setContracts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('ALL')

    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const { itemsPerPage } = useAppearance()

    // Form States
    const [newContract, setNewContract] = useState({
        name: '',
        contractNumber: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        price: '',
        currency: 'TRY',
        partsIncluded: false,
        description: '',
        supplierId: '',
        status: 'ACTIVE'
    })

    const [selectedContract, setSelectedContract] = useState<any>(null)
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { showSuccess, showError } = useToast()
    const { activeHospital } = useHospital()

    useEffect(() => {
        if (activeHospital) {
            fetchContracts()
        }
    }, [activeHospital])

    const fetchContracts = async () => {
        try {
            setIsLoading(true)
            const params = new URLSearchParams()
            if (activeHospital) params.append('hospitalId', activeHospital.id)
            if (filterStatus !== 'ALL') params.append('status', filterStatus)
            if (searchTerm) params.append('search', searchTerm)

            const res = await fetch(`/api/contracts?${params.toString()}`)
            const data = await res.json()

            if (res.ok) {
                setContracts(data)
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            showError('Sözleşmeler yüklenirken hata oluştu')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileUpload = async (file: File, contractName: string) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('contractName', contractName)

        const res = await fetch('/api/contracts/upload', {
            method: 'POST',
            body: formData
        })

        if (!res.ok) throw new Error('Dosya yüklenemedi')

        const data = await res.json()
        return data.path // Returns processed filename
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setIsSubmitting(true)

            if (!activeHospital) {
                showError('Hastane seçili değil')
                return
            }

            let documentPath = null
            if (uploadFile) {
                if (uploadFile) {
                    documentPath = await handleFileUpload(uploadFile, newContract.name || 'Genel')
                }
            }

            const payload = {
                ...newContract,
                hospitalId: activeHospital.id,
                documentPath: documentPath || undefined
            }

            const res = await fetch('/api/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (res.ok) {
                showSuccess('Sözleşme başarıyla oluşturuldu')
                setShowAddModal(false)
                setUploadFile(null)
                // Reset form
                setNewContract({
                    name: '',
                    contractNumber: '',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: '',
                    price: '',
                    currency: 'TRY',
                    partsIncluded: false,
                    description: '',
                    supplierId: '',
                    status: 'ACTIVE'
                })
                fetchContracts()
            } else {
                throw new Error(data.error)
            }
        } catch (error: any) {
            showError(error.message || 'Hata oluştu')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedContract) return

        try {
            setIsSubmitting(true)

            let documentPath = selectedContract.documentPath
            if (uploadFile) {
                if (uploadFile) {
                    documentPath = await handleFileUpload(uploadFile, selectedContract.name || 'Genel')
                }
            }

            const payload = {
                ...selectedContract,
                documentPath
            }

            const res = await fetch(`/api/contracts/${selectedContract.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (res.ok) {
                showSuccess('Sözleşme güncellendi')
                setShowEditModal(false)
                setSelectedContract(null)
                setUploadFile(null)
                fetchContracts()
            } else {
                throw new Error(data.error)
            }
        } catch (error: any) {
            showError(error.message || 'Güncelleme hatası')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedContract) return

        try {
            setIsSubmitting(true)
            const res = await fetch(`/api/contracts/${selectedContract.id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                showSuccess('Sözleşme silindi')
                setShowDeleteModal(false)
                setSelectedContract(null)
                fetchContracts()
            } else {
                const data = await res.json()
                throw new Error(data.error)
            }
        } catch (error: any) {
            showError(error.message || 'Silme hatası')
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredContracts = contracts.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.contractNumber && c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus

        return matchesSearch && matchesStatus
    })

    const totalPages = Math.ceil(filteredContracts.length / itemsPerPage)
    const paginatedContracts = filteredContracts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    // Reset page when filtering
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, filterStatus, activeHospital])

    return (
        <div className="space-y-6 p-6 pb-20 md:pb-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-8 h-8 text-blue-600" />
                        Sözleşme Yönetimi
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Bakım ve servis sözleşmelerini takip edin
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Sözleşme
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Sözleşme adı veya numara ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-2 min-w-[200px]">
                        <Filter className="text-gray-400 w-5 h-5" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                        >
                            <option value="ALL">Tüm Durumlar</option>
                            <option value="ACTIVE">Aktif</option>
                            <option value="EXPIRED">Süresi Dolmuş</option>
                            <option value="CANCELLED">İptal Edilmiş</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredContracts.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700">
                    <div className="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Kayıt Bulunamadı</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm || filterStatus !== 'ALL'
                            ? 'Filtreleme kriterlerine uygun sözleşme yok.'
                            : 'Henüz hiç sözleşme eklenmemiş.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedContracts.map((contract) => (
                            <div key={contract.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow p-6 group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <File className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1" title={contract.name}>
                                                {contract.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {contract.contractNumber || 'Numara yok'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${contract.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                        contract.status === 'EXPIRED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                        {contract.status === 'ACTIVE' ? 'Aktif' : contract.status === 'EXPIRED' ? 'Süresi Doldu' : 'İptal'}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                        <span>
                                            {new Date(contract.startDate).toLocaleDateString('tr-TR')} - {new Date(contract.endDate).toLocaleDateString('tr-TR')}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                        <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                                        <span>
                                            {contract.price ? `${contract.price.toLocaleString('tr-TR')} ${contract.currency}` : 'Fiyat belirtilmedi'}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                        <CheckCircle className={`w-4 h-4 mr-2 ${contract.partsIncluded ? 'text-green-500' : 'text-gray-300'}`} />
                                        <span>
                                            {contract.partsIncluded ? 'Yedek Parça Dahil' : 'Yedek Parça Hariç'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-4 border-t dark:border-gray-700">
                                    {contract.documentPath && (
                                        <a
                                            href={`/api/contracts/documents/${contract.documentPath}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                                        >
                                            <Download className="w-4 h-4" />
                                            Belge
                                        </a>
                                    )}
                                    <div className="flex-1"></div>
                                    <button
                                        onClick={() => {
                                            const startDate = new Date(contract.startDate).toISOString().split('T')[0]
                                            const endDate = new Date(contract.endDate).toISOString().split('T')[0]
                                            setSelectedContract({ ...contract, startDate, endDate })
                                            setShowEditModal(true)
                                        }}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 transition-colors"
                                    >
                                        <FileText className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedContract(contract)
                                            setShowDeleteModal(true)
                                        }}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full text-red-600 dark:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-between px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl relative z-0">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Önceki
                                </button>
                                <button
                                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Sonraki
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Toplam <span className="font-medium">{filteredContracts.length}</span> sonuçtan{' '}
                                        <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> -{' '}
                                        <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredContracts.length)}</span> arası gösteriliyor
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button
                                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => handlePageChange(i + 1)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1
                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/20'
                                                    : 'bg-white dark:bg-gray-800 border-gray-300 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Add/Edit Modal */}
            {(showAddModal || showEditModal) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {showAddModal ? 'Yeni Sözleşme Ekle' : 'Sözleşme Düzenle'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false)
                                    setShowEditModal(false)
                                    setSelectedContract(null)
                                    setUploadFile(null)
                                }}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={showAddModal ? handleSubmit : handleUpdate} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Sözleşme Adı *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={showAddModal ? newContract.name : selectedContract.name}
                                        onChange={(e) => showAddModal ? setNewContract({ ...newContract, name: e.target.value }) : setSelectedContract({ ...selectedContract, name: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Sözleşme No
                                    </label>
                                    <input
                                        type="text"
                                        value={showAddModal ? newContract.contractNumber : (selectedContract.contractNumber || '')}
                                        onChange={(e) => showAddModal ? setNewContract({ ...newContract, contractNumber: e.target.value }) : setSelectedContract({ ...selectedContract, contractNumber: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Başlangıç Tarihi *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={showAddModal ? newContract.startDate : selectedContract.startDate}
                                        onChange={(e) => showAddModal ? setNewContract({ ...newContract, startDate: e.target.value }) : setSelectedContract({ ...selectedContract, startDate: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Bitiş Tarihi *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={showAddModal ? newContract.endDate : selectedContract.endDate}
                                        onChange={(e) => showAddModal ? setNewContract({ ...newContract, endDate: e.target.value }) : setSelectedContract({ ...selectedContract, endDate: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Fiyat
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={showAddModal ? newContract.price : (selectedContract.price || '')}
                                            onChange={(e) => showAddModal ? setNewContract({ ...newContract, price: e.target.value }) : setSelectedContract({ ...selectedContract, price: e.target.value })}
                                            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                        />
                                        <select
                                            value={showAddModal ? newContract.currency : selectedContract.currency}
                                            onChange={(e) => showAddModal ? setNewContract({ ...newContract, currency: e.target.value }) : setSelectedContract({ ...selectedContract, currency: e.target.value })}
                                            className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                        >
                                            <option value="TRY">TL</option>
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Durum
                                    </label>
                                    <select
                                        value={showAddModal ? newContract.status : selectedContract.status}
                                        onChange={(e) => showAddModal ? setNewContract({ ...newContract, status: e.target.value }) : setSelectedContract({ ...selectedContract, status: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                    >
                                        <option value="ACTIVE">Aktif</option>
                                        <option value="EXPIRED">Süresi Dolmuş</option>
                                        <option value="CANCELLED">İptal</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="partsIncluded"
                                    checked={showAddModal ? newContract.partsIncluded : selectedContract.partsIncluded}
                                    onChange={(e) => showAddModal ? setNewContract({ ...newContract, partsIncluded: e.target.checked }) : setSelectedContract({ ...selectedContract, partsIncluded: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="partsIncluded" className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none">
                                    Yedek Parça Dahil
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Açıklama
                                </label>
                                <textarea
                                    rows={3}
                                    value={showAddModal ? newContract.description : (selectedContract.description || '')}
                                    onChange={(e) => showAddModal ? setNewContract({ ...newContract, description: e.target.value }) : setSelectedContract({ ...selectedContract, description: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Sözleşme Belgesi (PDF)
                                </label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                                    <div className="space-y-1 text-center">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                            <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                                <span>Dosya Seç</span>
                                                <input
                                                    type="file"
                                                    className="sr-only"
                                                    accept=".pdf, .jpg, .jpeg, .png"
                                                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                                />
                                            </label>
                                            <p className="pl-1">veya sürükleyip bırakın</p>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            PDF, PNG, JPG (Max 10MB)
                                        </p>
                                        {uploadFile && (
                                            <p className="text-sm text-green-600 font-medium">
                                                Seçilen: {uploadFile.name}
                                            </p>
                                        )}
                                        {!uploadFile && showEditModal && selectedContract.documentPath && (
                                            <p className="text-sm text-blue-600">
                                                Mevcut belge kayıtlı (Değiştirmek için dosya seçin)
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false)
                                        setShowEditModal(false)
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                                    {showAddModal ? 'Kaydet' : 'Güncelle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <AlertCircle className="w-8 h-8" />
                            <h3 className="text-lg font-bold">Sözleşmeyi Sil</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            "{selectedContract?.name}" isimli sözleşmeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
