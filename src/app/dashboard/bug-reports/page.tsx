'use client'

import React, { useState, useEffect } from 'react'
import {
  Bug, Search, Filter, CheckCircle2, Clock,
  AlertTriangle, RefreshCw, Trash2, Eye, ExternalLink,
  MessageSquare, ShieldAlert, Monitor, ChevronRight, X,
  Save, Building, User, Calendar, Check
} from 'lucide-react'
import { useToast } from '@/components/ToastProvider'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface BugReport {
  id: string
  title: string
  description: string
  category: string
  severity: string
  status: string
  pageUrl?: string | null
  screenshotUrl?: string | null
  technicalDetails?: string | null
  userEmail?: string | null
  userName?: string | null
  userRole?: string | null
  hospitalName?: string | null
  adminNotes?: string | null
  resolvedAt?: string | null
  createdAt: string
}

export default function BugReportsPage() {
  const { data: session } = useSession()
  const { showSuccess, showError } = useToast()

  const [reports, setReports] = useState<BugReport[]>([])
  const [counts, setCounts] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 })
  const [loading, setLoading] = useState(true)

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  // Detail Modal State
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editAdminNotes, setEditAdminNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showScreenshotModal, setShowScreenshotModal] = useState(false)

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (severityFilter !== 'ALL') params.set('severity', severityFilter)
      if (search.trim()) params.set('search', search.trim())

      const res = await fetch(`/api/bug-reports?${params.toString()}`)
      const data = await res.json()

      if (res.ok && data.success) {
        setReports(data.reports || [])
        if (data.counts) {
          setCounts(data.counts)
        }
      } else {
        showError(data.error || 'Bildirimler alınamadı')
      }
    } catch {
      showError('Sunucu bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [statusFilter, severityFilter])

  const handleOpenDetail = (report: BugReport) => {
    setSelectedReport(report)
    setEditStatus(report.status)
    setEditAdminNotes(report.adminNotes || '')
  }

  const handleSaveStatus = async () => {
    if (!selectedReport) return
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/bug-reports/${selectedReport.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          adminNotes: editAdminNotes
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showSuccess('Hata durumu güncellendi!')
        setSelectedReport(data.report)
        fetchReports()
      } else {
        showError(data.error || 'Güncellenemedi')
      }
    } catch {
      showError('İşlem başarısız')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu hata kaydını silmek istediğinize emin misiniz?')) return
    try {
      const res = await fetch(`/api/bug-reports/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showSuccess('Kayıt silindi')
        if (selectedReport?.id === id) {
          setSelectedReport(null)
        }
        fetchReports()
      } else {
        showError('Silinemedi')
      }
    } catch {
      showError('Bağlantı hatası')
    }
  }

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">🔴 Kritik</span>
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">🟠 Yüksek</span>
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200">🟡 Normal</span>
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200">🟢 Düşük</span>
    }
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'OPEN':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">Açık / Bekliyor</span>
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">İnceleniyor</span>
      case 'RESOLVED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Çözüldü</span>
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{st}</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
              <Bug className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Yazılım Hata Bildirimleri & Destek
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Kullanıcılar tarafından iletilen ve otomatik yakalanan teknik arızalar
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/dashboard/settings"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            Telegram / E-Posta Ayarları
          </Link>
          <button
            onClick={fetchReports}
            className="p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Bildirim</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{counts.total}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-sm bg-rose-50/30">
          <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Bekleyen / Açık</div>
          <div className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-1">{counts.open}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-900/40 shadow-sm bg-amber-50/30">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">İncelenenler</div>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">{counts.inProgress}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 shadow-sm bg-emerald-50/30">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Çözülenler</div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{counts.resolved}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchReports()}
            placeholder="Başlık, kurum veya açıklama ara..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="OPEN">🔴 Açık / Bekliyor</option>
            <option value="IN_PROGRESS">🟡 İnceleniyor</option>
            <option value="RESOLVED">🟢 Çözüldü</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">Tüm Öncelikler</option>
            <option value="CRITICAL">🔴 Kritik</option>
            <option value="HIGH">🟠 Yüksek</option>
            <option value="MEDIUM">🟡 Normal</option>
            <option value="LOW">🟢 Düşük</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Öncelik</th>
                <th className="py-3 px-4">Hata Başlığı & Kategori</th>
                <th className="py-3 px-4">Kurum & Bildiren</th>
                <th className="py-3 px-4">Sayfa / Konum</th>
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2 opacity-60" />
                    <p className="font-medium">Kayıtlı hata bildirimi bulunmuyor.</p>
                  </td>
                </tr>
              ) : (
                reports.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetail(item)}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getSeverityBadge(item.severity)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {item.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {item.hospitalName || 'Kurum Belirtilmedi'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.userName} ({item.userEmail})
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-blue-600 dark:text-blue-400">
                      {item.pageUrl || '-'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {new Date(item.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenDetail(item)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/40 rounded-lg mr-1.5"
                      >
                        İncele
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail & Resolution Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-xl">
                  <Bug className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold line-clamp-1">{selectedReport.title}</h3>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                    <span>{selectedReport.hospitalName}</span>
                    <span>•</span>
                    <span>{new Date(selectedReport.createdAt).toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {getSeverityBadge(selectedReport.severity)}
                {getStatusBadge(selectedReport.status)}
                <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600">
                  ID: #{selectedReport.id.substring(0, 10)}
                </span>
                {selectedReport.pageUrl && (
                  <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedReport.pageUrl}
                  </span>
                )}
              </div>

              {/* Açıklama */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">Kullanıcı Açıklaması:</div>
                <p className="text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                  {selectedReport.description}
                </p>
              </div>

              {/* Ekran Görüntüsü */}
              {selectedReport.screenshotUrl && (
                <div>
                  <div className="font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Ekran Görüntüsü:</span>
                    <button
                      type="button"
                      onClick={() => setShowScreenshotModal(true)}
                      className="text-blue-600 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Tam Boyut İncele
                    </button>
                  </div>
                  <div
                    onClick={() => setShowScreenshotModal(true)}
                    className="cursor-pointer border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-48 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={selectedReport.screenshotUrl}
                      alt="Ekran Görüntüsü"
                      className="object-contain max-h-48 w-full"
                    />
                  </div>
                </div>
              )}

              {/* Teknik Teşhis Detayları */}
              {selectedReport.technicalDetails && (
                <div>
                  <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Otomatik Sistem & Tarayıcı Logu:
                  </div>
                  <pre className="bg-slate-900 text-slate-300 p-3 rounded-xl font-mono text-[10px] overflow-x-auto max-h-36">
                    {selectedReport.technicalDetails}
                  </pre>
                </div>
              )}

              {/* Yönetici Çözüm ve Durum Güncelleme Alanı */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Durumu Güncelle:
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                    >
                      <option value="OPEN">🔴 Açık / Beklemede</option>
                      <option value="IN_PROGRESS">🟡 İnceleniyor / Çözüm Aşamasında</option>
                      <option value="RESOLVED">🟢 Çözüldü / Düzeltildi</option>
                      <option value="CLOSED">⚪ Kapatıldı</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Bildiren Kullanıcı:
                    </label>
                    <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 truncate">
                      {selectedReport.userName} ({selectedReport.userEmail})
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Yönetici Çözüm Notu:
                  </label>
                  <textarea
                    value={editAdminNotes}
                    onChange={(e) => setEditAdminNotes(e.target.value)}
                    rows={2}
                    placeholder="Bu sorunla ilgili yapılan işlem, güncelleme notu veya teşhis..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDelete(selectedReport.id)}
                className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kaydı Sil</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 rounded-xl"
                >
                  Kapat
                </button>
                <button
                  type="button"
                  onClick={handleSaveStatus}
                  disabled={isUpdating}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isUpdating ? 'Kaydediliyor...' : 'Durumu Kaydet'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Screenshot Modal */}
      {showScreenshotModal && selectedReport?.screenshotUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowScreenshotModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedReport.screenshotUrl}
              alt="Tam Boyut Ekran Görüntüsü"
              className="max-h-[85vh] max-w-full rounded-lg shadow-2xl object-contain"
            />
            <button
              onClick={() => setShowScreenshotModal(false)}
              className="absolute top-2 right-2 p-2 bg-black/70 text-white rounded-full hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
