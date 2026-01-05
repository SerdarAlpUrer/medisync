'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  GraduationCap,
  Plus,
  Search,
  X,
  Calendar,
  Clock,
  Users,
  Building2,
  CheckCircle,
  Eye,
  Filter,
  UserPlus,
  CheckSquare,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Upload,
  FileText,
  Download
} from 'lucide-react'
import { useToast } from '@/components/ToastProvider'
import { useHospital } from '@/contexts/HospitalContext'
import { useAppearance } from '@/contexts/AppearanceContext'

interface Staff {
  id: string
  registrationNumber: string
  name: string
  department: string | null
}

interface TrainingSession {
  id: string
  sessionNumber: string
  title: string
  trainer: string | null
  trainerOrg: string | null
  durationMinutes: number
  content: string | null
  trainingDate: string
  attendees: {
    id: string
    staff: Staff
  }[]
  documents: {
    id: string
    filename: string
    filepath: string
    filesize: number
    mimetype: string
  }[]
}

export default function TrainingPage() {
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null)
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const { itemsPerPage } = useAppearance()
  const { showSuccess, showError } = useToast()
  const { activeHospitalId } = useHospital()

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    trainer: '',
    trainerOrg: '',
    durationMinutes: 60,
    content: '',
    trainingDate: new Date().toISOString().split('T')[0],
    validityMonths: 12
  })
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
  const [staffSearchTerm, setStaffSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('ALL')
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  useEffect(() => {
    fetchSessions()
    fetchStaff()
  }, [activeHospitalId])

  const fetchSessions = async () => {
    setIsLoading(true)
    try {
      const url = activeHospitalId
        ? `/api/training-sessions?hospitalId=${activeHospitalId}`
        : '/api/training-sessions'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
      showError('Eğitimler yüklenemedi')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStaff = async () => {
    try {
      const url = activeHospitalId
        ? `/api/staff?hospitalId=${activeHospitalId}`
        : '/api/staff'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setStaffList(data.staff || [])
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  const departments = useMemo(() => {
    const depts = new Set(staffList.map(s => s.department).filter(Boolean) as string[])
    return Array.from(depts)
  }, [staffList])

  const filteredStaffForSelection = useMemo(() => {
    return staffList.filter(staff => {
      const matchesSearch = staff.name.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
        staff.registrationNumber.toLowerCase().includes(staffSearchTerm.toLowerCase())
      const matchesDept = filterDepartment === 'ALL' || staff.department === filterDepartment
      return matchesSearch && matchesDept
    })
  }, [staffList, staffSearchTerm, filterDepartment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedStaffIds.length === 0) {
      showError('En az bir katılımcı seçmelisiniz')
      return
    }

    try {
      let uploadedDocs = []
      if (uploadFile) {
        const requestData = new FormData()
        requestData.append('file', uploadFile)
        requestData.append('trainingTitle', formData.title || 'Genel')

        const uploadRes = await fetch('/api/training-sessions/upload', {
          method: 'POST',
          body: requestData
        })

        if (!uploadRes.ok) throw new Error('Dosya yüklenemedi')
        uploadedDocs.push(await uploadRes.json())
      }

      const url = editingSession
        ? `/api/training-sessions/${editingSession.id}`
        : '/api/training-sessions'
      const method = editingSession ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          hospitalId: activeHospitalId,
          staffIds: selectedStaffIds,
          documents: uploadedDocs
        })
      })

      if (response.ok) {
        showSuccess(editingSession
          ? 'Eğitim güncellendi'
          : `Eğitim kaydedildi (${selectedStaffIds.length} katılımcı)`)
        setShowAddModal(false)
        resetForm()
        fetchSessions()
      } else {
        const error = await response.json()
        showError(error.error || (editingSession ? 'Eğitim güncellenemedi' : 'Eğitim oluşturulamadı'))
      }
    } catch (error) {
      showError('Bir hata oluştu')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      trainer: '',
      trainerOrg: '',
      durationMinutes: 60,
      content: '',
      trainingDate: new Date().toISOString().split('T')[0],
      validityMonths: 12
    })
    setSelectedStaffIds([])
    setUploadFile(null)
    setStaffSearchTerm('')
    setFilterDepartment('ALL')
    setEditingSession(null)
  }

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Bu eğitimi silmek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/training-sessions/${id}`, { method: 'DELETE' })
      if (response.ok) {
        showSuccess('Eğitim silindi')
        fetchSessions()
      } else {
        showError('Eğitim silinemedi')
      }
    } catch (error) {
      showError('Bir hata oluştu')
    }
  }

  const openEditModal = (session: TrainingSession) => {
    setEditingSession(session)
    setFormData({
      title: session.title,
      trainer: session.trainer || '',
      trainerOrg: session.trainerOrg || '',
      durationMinutes: session.durationMinutes,
      content: session.content || '',
      trainingDate: session.trainingDate.split('T')[0],
      validityMonths: 12
    })
    setSelectedStaffIds(session.attendees.map(a => a.staff.id))
    setShowAddModal(true)
  }

  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaffIds(prev =>
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    )
  }

  const selectAllFiltered = () => {
    const filteredIds = filteredStaffForSelection.map(s => s.id)
    setSelectedStaffIds(prev => {
      const newIds = new Set([...prev, ...filteredIds])
      return Array.from(newIds)
    })
  }

  const selectDepartment = (dept: string) => {
    const deptStaff = staffList.filter(s => s.department === dept)
    const deptIds = deptStaff.map(s => s.id)
    setSelectedStaffIds(prev => {
      const newIds = new Set([...prev, ...deptIds])
      return Array.from(newIds)
    })
  }

  const clearSelection = () => {
    setSelectedStaffIds([])
  }

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.sessionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (session.trainer && session.trainer.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage)
  const paginatedSessions = filteredSessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Reset page when filtering
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, activeHospitalId])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <GraduationCap className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
            Eğitim Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Personel eğitim kayıtları ve sertifikaları</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Hızlı Eğitim Kaydı</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Eğitim</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{sessions.length}</p>
            </div>
            <GraduationCap className="h-10 w-10 text-blue-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Katılımcı</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {sessions.reduce((acc, s) => acc + s.attendees.length, 0)}
              </p>
            </div>
            <Users className="h-10 w-10 text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Bu Ay</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {sessions.filter(s => {
                  const d = new Date(s.trainingDate)
                  const now = new Date()
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
                }).length}
              </p>
            </div>
            <Calendar className="h-10 w-10 text-purple-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Eğitim konusu, numara veya eğitmen ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-16">
            <GraduationCap className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Henüz eğitim kaydı yok</h3>
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              İlk Eğitimi Oluştur
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Eğitim No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Konu</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Eğitmen</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Tarih</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Belge</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Katılımcı</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900 dark:text-white">
                        {session.sessionNumber}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{session.title}</span>
                          {session.documents && session.documents.length > 0 && (
                            <div title={`${session.documents.length} dosya ekli`}>
                              <FileText className="h-4 w-4 text-blue-500" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {session.trainer || '-'}
                        {session.trainerOrg && (
                          <span className="text-xs text-gray-500 block">{session.trainerOrg}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {new Date(session.trainingDate).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {session.documents && session.documents.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={`/api/training-sessions/documents/${session.documents[0].filepath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                              title={session.documents[0].filename}
                            >
                              <Download className="h-4 w-4" />
                              <span className="truncate max-w-[100px]">{session.documents[0].filename}</span>
                            </a>
                            {session.documents.length > 1 && (
                              <button
                                onClick={() => { setSelectedSession(session); setShowDetailModal(true); }}
                                className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                title="Tüm dosyaları görmek için detaylara bakın"
                              >
                                +{session.documents.length - 1}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
                          {session.attendees.length} kişi
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => { setSelectedSession(session); setShowDetailModal(true); }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Detay"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => openEditModal(session)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 className="h-4 w-4 text-yellow-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
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
                      Toplam <span className="font-medium">{filteredSessions.length}</span> sonuçtan{' '}
                      <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> -{' '}
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredSessions.length)}</span> arası gösteriliyor
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

      {/* Quick Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingSession ? 'Eğitimi Düzenle' : 'Hızlı Eğitim Kaydı'}
              </h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Training Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Eğitim Bilgileri</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Eğitim Konusu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                      placeholder="Örn: Defibrilatör Kullanımı"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Eğitmen</label>
                      <input
                        type="text"
                        value={formData.trainer}
                        onChange={(e) => setFormData({ ...formData, trainer: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                        placeholder="Eğitimi veren kişi"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Firma/Kurum</label>
                      <input
                        type="text"
                        value={formData.trainerOrg}
                        onChange={(e) => setFormData({ ...formData, trainerOrg: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                        placeholder="Eğitimi veren firma"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tarih <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.trainingDate}
                        onChange={(e) => setFormData({ ...formData, trainingDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Süre (dk)</label>
                      <input
                        type="number"
                        value={formData.durationMinutes}
                        onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Eğitim İçeriği</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                      rows={4}
                      placeholder="Eğitimde işlenen konular..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Eğitim Dosyası (İsteğe Bağlı)
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
                              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                            />
                          </label>
                          <p className="pl-1">veya sürükleyip bırakın</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          PDF, Görsel, Excel, Word (Max 10MB)
                        </p>
                        {uploadFile && (
                          <p className="text-sm text-green-600 font-medium">
                            Seçilen: {uploadFile.name}
                          </p>
                        )}
                        {!uploadFile && editingSession && editingSession.documents && editingSession.documents.length > 0 && (
                          <div className="mt-2 text-left bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg border border-gray-100 dark:border-gray-600">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Mevcut Dosyalar:</p>
                            {editingSession.documents.map((doc, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 py-0.5">
                                <FileText className="h-3 w-3" />
                                <a
                                  href={`/api/training-sessions/documents/${doc.filepath}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline truncate max-w-[200px]"
                                  title={doc.filename}
                                >
                                  {doc.filename}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Attendees */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Katılımcılar
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs">
                        {selectedStaffIds.length} seçili
                      </span>
                    </h3>
                    {selectedStaffIds.length > 0 && (
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Temizle
                      </button>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={selectAllFiltered}
                      className="px-3 py-1.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-200 flex items-center gap-1"
                    >
                      <CheckSquare className="h-3 w-3" />
                      Tümünü Seç
                    </button>
                    {departments.map(dept => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => selectDepartment(dept)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-200"
                      >
                        + {dept}
                      </button>
                    ))}
                  </div>

                  {/* Search & Filter */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Personel ara..."
                        value={staffSearchTerm}
                        onChange={(e) => setStaffSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                      />
                    </div>
                    <select
                      value={filterDepartment}
                      onChange={(e) => setFilterDepartment(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                    >
                      <option value="ALL">Tüm Dept.</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  {/* Staff List */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg h-64 overflow-y-auto">
                    {filteredStaffForSelection.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">
                        Personel bulunamadı
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredStaffForSelection.map(staff => (
                          <label
                            key={staff.id}
                            className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedStaffIds.includes(staff.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedStaffIds.includes(staff.id)}
                              onChange={() => toggleStaffSelection(staff.id)}
                              className="h-4 w-4 text-blue-600 rounded border-gray-300"
                            />
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{staff.name}</p>
                              <p className="text-xs text-gray-500">{staff.registrationNumber} • {staff.department || 'Departman yok'}</p>
                            </div>
                            {selectedStaffIds.includes(staff.id) && (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={selectedStaffIds.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <GraduationCap className="h-4 w-4" />
                  Eğitim Kaydet ({selectedStaffIds.length} kişi)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Eğitim Detayı</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedSession.title}</h3>
                <p className="text-sm text-gray-500">{selectedSession.sessionNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(selectedSession.trainingDate).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Clock className="h-4 w-4" />
                  <span>{selectedSession.durationMinutes} dakika</span>
                </div>
                {selectedSession.trainer && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Users className="h-4 w-4" />
                    <span>{selectedSession.trainer}</span>
                  </div>
                )}
                {selectedSession.trainerOrg && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Building2 className="h-4 w-4" />
                    <span>{selectedSession.trainerOrg}</span>
                  </div>
                )}
              </div>

              {selectedSession.content && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Eğitim İçeriği</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{selectedSession.content}</p>
                </div>
              )}

              {selectedSession.documents && selectedSession.documents.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Eğitim Dokümanları</h4>
                  <div className="flex flex-col gap-2">
                    {selectedSession.documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={`/api/training-sessions/documents/${doc.filepath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                      >
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {doc.filename}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(doc.filesize / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Download className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Katılımcılar ({selectedSession.attendees.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSession.attendees.map(a => (
                    <span key={a.id} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                      {a.staff.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
