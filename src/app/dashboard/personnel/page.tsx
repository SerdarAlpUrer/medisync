'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Users,
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    GraduationCap,
    Building2,
    Phone,
    Mail,
    Filter,
    FileSpreadsheet,
    Eye,
    Download,
    Upload,
    Loader2,
    CheckCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { useToast } from '@/components/ToastProvider'
import { useHospital } from '@/contexts/HospitalContext'
import { useAppearance } from '@/contexts/AppearanceContext'

interface Staff {
    id: string
    registrationNumber: string
    idNumber: string | null
    name: string
    department: string | null
    title: string | null
    phone: string | null
    email: string | null
    isActive: boolean
    hospital: { id: string; name: string } | null
    trainings: {
        id: string
        completedAt: string
        session: { id: string; title: string; trainingDate: string }
    }[]
}

export default function PersonnelPage() {
    const [staffList, setStaffList] = useState<Staff[]>([])
    const [departments, setDepartments] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterDepartment, setFilterDepartment] = useState('ALL')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [importLoading, setImportLoading] = useState(false)
    const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const { itemsPerPage } = useAppearance()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { showSuccess, showError } = useToast()
    const { activeHospitalId, hospitals } = useHospital()

    const [formData, setFormData] = useState({
        registrationNumber: '',
        idNumber: '',
        name: '',
        department: '',
        title: '',
        phone: '',
        email: '',
        hospitalId: ''
    })

    useEffect(() => {
        fetchStaff()
    }, [activeHospitalId])

    const fetchStaff = async () => {
        setIsLoading(true)
        try {
            const url = activeHospitalId
                ? `/api/staff?hospitalId=${activeHospitalId}`
                : '/api/staff'
            const response = await fetch(url)
            if (response.ok) {
                const data = await response.json()
                setStaffList(data.staff || [])
                setDepartments(data.departments || [])
            }
        } catch (error) {
            console.error('Error fetching staff:', error)
            showError('Personel listesi yüklenemedi')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = editingStaff ? `/api/staff/${editingStaff.id}` : '/api/staff'
            const method = editingStaff ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                showSuccess(editingStaff ? 'Personel güncellendi' : 'Personel eklendi')
                setShowAddModal(false)
                resetForm()
                fetchStaff()
            } else {
                const error = await response.json()
                showError(error.error || 'İşlem başarısız')
            }
        } catch (error) {
            showError('Bir hata oluştu')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu personeli silmek istediğinizden emin misiniz?')) return

        try {
            const response = await fetch(`/api/staff/${id}`, { method: 'DELETE' })
            if (response.ok) {
                showSuccess('Personel silindi')
                fetchStaff()
            } else {
                showError('Personel silinemedi')
            }
        } catch (error) {
            showError('Bir hata oluştu')
        }
    }

    const openEditModal = (staff: Staff) => {
        setEditingStaff(staff)
        setFormData({
            registrationNumber: staff.registrationNumber,
            idNumber: staff.idNumber || '',
            name: staff.name,
            department: staff.department || '',
            title: staff.title || '',
            phone: staff.phone || '',
            email: staff.email || '',
            hospitalId: staff.hospital?.id || ''
        })
        setShowAddModal(true)
    }

    const resetForm = () => {
        setFormData({
            registrationNumber: '',
            idNumber: '',
            name: '',
            department: '',
            title: '',
            phone: '',
            email: '',
            hospitalId: activeHospitalId || ''
        })
        setEditingStaff(null)
    }

    const handleExcelExport = async () => {
        try {
            const url = activeHospitalId
                ? `/api/staff/excel?hospitalId=${activeHospitalId}`
                : '/api/staff/excel'
            const response = await fetch(url)
            if (response.ok) {
                const blob = await response.blob()
                const downloadUrl = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = downloadUrl
                a.download = `personel_listesi_${new Date().toISOString().split('T')[0]}.xlsx`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                window.URL.revokeObjectURL(downloadUrl)
                showSuccess('Excel dosyası indirildi')
            } else {
                showError('Excel indirilemedi')
            }
        } catch (error) {
            showError('Bir hata oluştu')
        }
    }

    const handleExcelImport = async (file: File) => {
        setImportLoading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            if (activeHospitalId) {
                formData.append('hospitalId', activeHospitalId)
            }

            const response = await fetch('/api/staff/excel', {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const result = await response.json()
                setImportResult(result)
                if (result.imported > 0) {
                    showSuccess(`${result.imported} personel başarıyla eklendi/güncellendi`)
                    fetchStaff()
                }
            } else {
                const error = await response.json()
                showError(error.error || 'Import başarısız')
            }
        } catch (error) {
            showError('Bir hata oluştu')
        } finally {
            setImportLoading(false)
        }
    }

    const filteredStaff = staffList.filter(staff => {
        const matchesSearch =
            staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (staff.idNumber && staff.idNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (staff.email && staff.email.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesDept = filterDepartment === 'ALL' || staff.department === filterDepartment
        return matchesSearch && matchesDept
    })

    const totalPages = Math.ceil(filteredStaff.length / itemsPerPage)
    const paginatedStaff = filteredStaff.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    // Reset page when filtering
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, filterDepartment, activeHospitalId])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Users className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
                        Personel Yönetimi
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Sağlık personeli kayıtları ve eğitim takibi
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowAddModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    <span>Yeni Personel</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Personel</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{staffList.length}</p>
                        </div>
                        <Users className="h-10 w-10 text-blue-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Departman Sayısı</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{departments.length}</p>
                        </div>
                        <Building2 className="h-10 w-10 text-purple-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Eğitim Alan</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {staffList.filter(s => s.trainings.length > 0).length}
                            </p>
                        </div>
                        <GraduationCap className="h-10 w-10 text-green-500 opacity-50" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Aktif Personel</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {staffList.filter(s => s.isActive).length}
                            </p>
                        </div>
                        <Users className="h-10 w-10 text-teal-500 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="İsim, sicil no veya e-posta ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ALL">Tüm Departmanlar</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExcelExport}
                            className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                            <Download className="h-5 w-5" />
                            <span>Excel İndir</span>
                        </button>
                        <button
                            onClick={() => { setShowImportModal(true); setImportResult(null); }}
                            className="flex items-center justify-center space-x-2 px-4 py-2 border border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        >
                            <Upload className="h-5 w-5" />
                            <span>Excel Yükle</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Staff Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredStaff.length === 0 ? (
                    <div className="text-center py-16">
                        <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Personel bulunamadı</h3>
                        <button
                            onClick={() => { resetForm(); setShowAddModal(true); }}
                            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            İlk Personeli Ekle
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Sicil No</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Kimlik No</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Ad Soyad</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Departman</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Unvan</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Eğitim</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {paginatedStaff.map((staff) => (
                                        <tr key={staff.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900 dark:text-white">
                                                {staff.registrationNumber}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-mono text-gray-700 dark:text-gray-300">
                                                {staff.idNumber || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                                                        {staff.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{staff.name}</p>
                                                        {staff.email && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{staff.email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {staff.department || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {staff.title || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${staff.trainings.length > 0
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                                    }`}>
                                                    {staff.trainings.length} eğitim
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => { setSelectedStaff(staff); setShowDetailModal(true); }}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                                        title="Detay"
                                                    >
                                                        <Eye className="h-4 w-4 text-blue-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(staff)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                                        title="Düzenle"
                                                    >
                                                        <Edit2 className="h-4 w-4 text-yellow-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(staff.id)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                                        title="Sil"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
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
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Sonraki
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Toplam <span className="font-medium">{filteredStaff.length}</span> sonuçtan{' '}
                                            <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> -{' '}
                                            <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredStaff.length)}</span> arası gösteriliyor
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
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg">
                        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingStaff ? 'Personel Düzenle' : 'Yeni Personel Ekle'}
                            </h2>
                            <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Sicil No <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.registrationNumber}
                                        onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        TC Kimlik No <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.idNumber}
                                        onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                        maxLength={11}
                                        placeholder="11 haneli TC Kimlik No"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Ad Soyad <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Departman</label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                        placeholder="Yoğun Bakım, Acil, vb."
                                        list="departments-list"
                                    />
                                    <datalist id="departments-list">
                                        {departments.map(d => <option key={d} value={d} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unvan</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                        placeholder="Hemşire, Teknisyen, vb."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefon</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-posta</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                    />
                                </div>
                            </div>

                            {hospitals.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hastane/Şube</label>
                                    <select
                                        value={formData.hospitalId}
                                        onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                    >
                                        <option value="">Seçin</option>
                                        {hospitals.map(h => (
                                            <option key={h.id} value={h.id}>{h.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddModal(false); resetForm(); }}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editingStaff ? 'Güncelle' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedStaff && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Personel Detayı</h2>
                            <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Info */}
                            <div className="flex items-start space-x-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                    {selectedStaff.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedStaff.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Sicil No: {selectedStaff.registrationNumber}</p>
                                    {selectedStaff.title && <p className="text-sm text-gray-600 dark:text-gray-300">{selectedStaff.title}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                                    <Building2 className="h-4 w-4" />
                                    <span>{selectedStaff.department || 'Departman belirtilmemiş'}</span>
                                </div>
                                {selectedStaff.phone && (
                                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                                        <Phone className="h-4 w-4" />
                                        <span>{selectedStaff.phone}</span>
                                    </div>
                                )}
                                {selectedStaff.email && (
                                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                                        <Mail className="h-4 w-4" />
                                        <span>{selectedStaff.email}</span>
                                    </div>
                                )}
                            </div>

                            {/* Training History */}
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                    <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
                                    Eğitim Geçmişi ({selectedStaff.trainings.length})
                                </h4>
                                {selectedStaff.trainings.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedStaff.trainings.map(t => (
                                            <div key={t.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{t.session.title}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(t.session.trainingDate).toLocaleDateString('tr-TR')}
                                                    </p>
                                                </div>
                                                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded text-xs">
                                                    Tamamlandı
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm italic">Henüz eğitim kaydı yok</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Excel Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg">
                        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Excel'den Personel Yükle</h2>
                            <button onClick={() => setShowImportModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {!importResult ? (
                                <>
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept=".xlsx,.xls"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) handleExcelImport(file)
                                            }}
                                            className="hidden"
                                        />
                                        {importLoading ? (
                                            <div className="flex flex-col items-center">
                                                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                                                <p className="text-gray-600 dark:text-gray-400">Dosya işleniyor...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                <p className="text-gray-600 dark:text-gray-400 mb-2">Excel dosyasını yüklemek için tıklayın</p>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                                                >
                                                    Dosya Seç
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">Excel Formatı</h4>
                                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                            Excel dosyasında şu sütunlar olmalıdır:
                                        </p>
                                        <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 list-disc list-inside">
                                            <li><strong>Sicil No</strong> (Zorunlu)</li>
                                            <li><strong>Ad Soyad</strong> (Zorunlu)</li>
                                            <li>TC Kimlik No, Departman, Unvan, Telefon, E-posta (Opsiyonel)</li>
                                        </ul>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center">
                                    {importResult.imported > 0 ? (
                                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                    ) : (
                                        <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                                    )}
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        Import Tamamlandı
                                    </h3>
                                    <div className="space-y-2 text-gray-600 dark:text-gray-400">
                                        <p>Toplam satır: <strong>{importResult.imported + importResult.skipped}</strong></p>
                                        <p className="text-green-600">Eklenen/Güncellenen: <strong>{importResult.imported}</strong></p>
                                        {importResult.skipped > 0 && (
                                            <p className="text-yellow-600">Atlanan: <strong>{importResult.skipped}</strong></p>
                                        )}
                                    </div>
                                    {importResult.errors.length > 0 && (
                                        <div className="mt-4 text-left bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                            <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">Hatalar:</p>
                                            {importResult.errors.map((err, i) => (
                                                <p key={i} className="text-xs text-red-600 dark:text-red-400">{err}</p>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setShowImportModal(false)}
                                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                                    >
                                        Kapat
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
