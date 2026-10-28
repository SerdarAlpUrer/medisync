'use client'

import { useState, useEffect } from 'react'
import {
    Shield, FileText, AlertTriangle, ClipboardCheck,
    Plus, RefreshCw, X, Save
} from 'lucide-react'
import toast from 'react-hot-toast'

interface AuditLog {
    id: string
    userName: string
    action: string
    entity: string
    entityId: string | null
    timestamp: string
    ipAddress: string | null
}

interface CAPA {
    id: string
    capaNumber: string
    title: string
    description: string
    type: string
    status: string
    source: string | null
    rootCause: string | null
    correctiveAction: string | null
    preventiveAction: string | null
    dueDate: string | null
    createdAt: string
}

interface AdverseEvent {
    id: string
    reportNumber: string
    description: string
    severity: string
    status: string
    eventDate: string
    deviceId: string
    reportedToTitck?: boolean
    titckReferenceNo?: string | null
    device: { id: string; name: string; tagNumber: string } | null
}

interface DataSubjectRequest {
    id: string
    requesterName: string
    requesterEmail: string
    requesterPhone?: string | null
    requestType: string
    description: string
    status: string
    responseNotes?: string | null
    createdAt: string
}

interface Device {
    id: string
    name: string
    tagNumber: string
}

type TabType = 'audit' | 'capa' | 'adverse' | 'kvkk'

const ACTION_LABELS: Record<string, string> = {
    CREATE: 'Oluşturma',
    UPDATE: 'Güncelleme',
    DELETE: 'Silme',
    LOGIN: 'Giriş',
    LOGOUT: 'Çıkış',
    VIEW: 'Görüntüleme',
    EXPORT: 'Dışa Aktarım',
    SIGN: 'İmzalama'
}

const SEVERITY_COLORS: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800'
}

export default function CompliancePage() {
    const [activeTab, setActiveTab] = useState<TabType>('audit')
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
    const [capas, setCAPAs] = useState<CAPA[]>([])
    const [adverseEvents, setAdverseEvents] = useState<AdverseEvent[]>([])
    const [kvkkRequests, setKvkkRequests] = useState<DataSubjectRequest[]>([])
    const [devices, setDevices] = useState<Device[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCAPAModal, setShowCAPAModal] = useState(false)
    const [showAdverseModal, setShowAdverseModal] = useState(false)
    const [showKVKKModal, setShowKVKKModal] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // KVKK Form
    const [kvkkForm, setKvkkForm] = useState({
        requesterName: '',
        requesterEmail: '',
        requesterPhone: '',
        requestType: 'ACCESS',
        description: ''
    })

    // CAPA Form
    const [capaForm, setCAPAForm] = useState({
        title: '',
        description: '',
        type: 'CORRECTIVE',
        source: '',
        rootCause: '',
        correctiveAction: '',
        preventiveAction: '',
        assignedTo: '',
        dueDate: ''
    })

    // Adverse Event Form
    const [adverseForm, setAdverseForm] = useState({
        deviceId: '',
        eventDate: '',
        description: '',
        severity: 'MEDIUM',
        investigationFindings: '',
        correctiveActions: '',
        preventiveActions: ''
    })

    useEffect(() => {
        fetchData()
        fetchDevices()
    }, [activeTab])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [auditRes, capaRes, adverseRes, kvkkRes] = await Promise.all([
                fetch('/api/audit-logs'),
                fetch('/api/capas'),
                fetch('/api/adverse-events'),
                fetch('/api/kvkk')
            ])
            if (auditRes.ok) {
                const data = await auditRes.json()
                setAuditLogs(data.logs || [])
            }
            if (capaRes.ok) setCAPAs(await capaRes.json())
            if (adverseRes.ok) setAdverseEvents(await adverseRes.json())
            if (kvkkRes.ok) setKvkkRequests(await kvkkRes.json())
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchDevices = async () => {
        try {
            const res = await fetch('/api/devices')
            if (res.ok) {
                const raw = await res.json()
                const list = Array.isArray(raw) ? raw : (raw.data?.devices || raw.devices || raw.data || [])
                setDevices(Array.isArray(list) ? list : [])
            }
        } catch (error) {
            console.error('Error fetching devices:', error)
        }
    }

    const handleUpdateCAPAStatus = async (id: string, status: string) => {
        try {
            const res = await fetch('/api/capas', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            })
            if (res.ok) {
                toast.success('CAPA durumu güncellendi')
                fetchData()
            } else {
                toast.error('Güncelleme başarısız')
            }
        } catch {
            toast.error('Bir hata oluştu')
        }
    }

    const handleUpdateAdverseStatus = async (id: string, updates: Record<string, any>) => {
        try {
            const res = await fetch('/api/adverse-events', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...updates })
            })
            if (res.ok) {
                toast.success('Olumsuz olay kaydı güncellendi')
                fetchData()
            } else {
                toast.error('Güncelleme başarısız')
            }
        } catch {
            toast.error('Bir hata oluştu')
        }
    }

    const handleKVKKSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            const res = await fetch('/api/kvkk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kvkkForm)
            })
            if (res.ok) {
                toast.success('KVKK veri sahibi başvurusu kaydedildi')
                setShowKVKKModal(false)
                setKvkkForm({
                    requesterName: '',
                    requesterEmail: '',
                    requesterPhone: '',
                    requestType: 'ACCESS',
                    description: ''
                })
                fetchData()
            } else {
                const err = await res.json()
                toast.error(err.error || 'Başvuru kaydedilemedi')
            }
        } catch {
            toast.error('Bir hata oluştu')
        } finally {
            setIsSaving(false)
        }
    }

    const handleUpdateKVKKStatus = async (id: string, status: string) => {
        try {
            const res = await fetch('/api/kvkk', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            })
            if (res.ok) {
                toast.success('KVKK başvuru durumu güncellendi')
                fetchData()
            } else {
                toast.error('Güncellenemedi')
            }
        } catch {
            toast.error('Bir hata oluştu')
        }
    }

    const resetCAPAForm = () => {
        setCAPAForm({
            title: '',
            description: '',
            type: 'CORRECTIVE',
            source: '',
            rootCause: '',
            correctiveAction: '',
            preventiveAction: '',
            assignedTo: '',
            dueDate: ''
        })
    }

    const resetAdverseForm = () => {
        setAdverseForm({
            deviceId: '',
            eventDate: '',
            description: '',
            severity: 'MEDIUM',
            investigationFindings: '',
            correctiveActions: '',
            preventiveActions: ''
        })
    }

    const handleCAPASubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!capaForm.title || !capaForm.description || !capaForm.type) {
            toast.error('Lütfen zorunlu alanları doldurun')
            return
        }

        setIsSaving(true)
        try {
            const res = await fetch('/api/capas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...capaForm,
                    dueDate: capaForm.dueDate || null
                })
            })

            if (res.ok) {
                const newCAPA = await res.json()
                toast.success(`CAPA oluşturuldu: ${newCAPA.capaNumber}`)
                setShowCAPAModal(false)
                resetCAPAForm()
                fetchData()
            } else {
                const error = await res.json()
                toast.error(error.error || 'CAPA oluşturulamadı')
            }
        } catch (error) {
            console.error('Error creating CAPA:', error)
            toast.error('Bir hata oluştu')
        } finally {
            setIsSaving(false)
        }
    }

    const handleAdverseSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!adverseForm.deviceId || !adverseForm.eventDate || !adverseForm.description || !adverseForm.severity) {
            toast.error('Lütfen zorunlu alanları doldurun')
            return
        }

        setIsSaving(true)
        try {
            const res = await fetch('/api/adverse-events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adverseForm)
            })

            if (res.ok) {
                const newEvent = await res.json()
                toast.success(`Olumsuz olay raporlandı: ${newEvent.reportNumber}`)
                setShowAdverseModal(false)
                resetAdverseForm()
                fetchData()
            } else {
                const error = await res.json()
                toast.error(error.error || 'Rapor oluşturulamadı')
            }
        } catch (error) {
            console.error('Error creating adverse event:', error)
            toast.error('Bir hata oluştu')
        } finally {
            setIsSaving(false)
        }
    }

    const tabs = [
        { id: 'audit' as TabType, label: 'Denetim Logları', icon: FileText, count: auditLogs.length },
        { id: 'capa' as TabType, label: 'CAPA', icon: ClipboardCheck, count: capas.length },
        { id: 'adverse' as TabType, label: 'Olumsuz Olaylar', icon: AlertTriangle, count: adverseEvents.length },
        { id: 'kvkk' as TabType, label: 'KVKK Talepleri', icon: Shield, count: kvkkRequests.length }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Shield className="h-8 w-8 mr-3 text-purple-600 dark:text-purple-400" />
                        Uyumluluk Merkezi
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">FDA 21 CFR Part 11, EU MDR, TİTCK ve KVKK uyumluluğu</p>
                </div>
                <div className="flex space-x-3">
                    {activeTab === 'capa' && (
                        <button
                            onClick={() => setShowCAPAModal(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Yeni CAPA</span>
                        </button>
                    )}
                    {activeTab === 'adverse' && (
                        <button
                            onClick={() => setShowAdverseModal(true)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Olay Raporla</span>
                        </button>
                    )}
                    {activeTab === 'kvkk' && (
                        <button
                            onClick={() => setShowKVKKModal(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Yeni KVKK Başvurusu</span>
                        </button>
                    )}
                    <button
                        onClick={fetchData}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span>Yenile</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Denetim Kayıtları</p>
                            <p className="text-3xl font-bold">{auditLogs.length}</p>
                        </div>
                        <FileText className="h-10 w-10 text-purple-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Aktif CAPA</p>
                            <p className="text-3xl font-bold">{capas.filter(c => c.status !== 'CLOSED').length}</p>
                        </div>
                        <ClipboardCheck className="h-10 w-10 text-blue-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm">Açık Olaylar</p>
                            <p className="text-3xl font-bold">{adverseEvents.filter(e => e.status === 'OPEN').length}</p>
                        </div>
                        <AlertTriangle className="h-10 w-10 text-orange-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Uyumluluk</p>
                            <p className="text-xl font-bold">Aktif ✓</p>
                        </div>
                        <Shield className="h-10 w-10 text-green-200" />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-1 p-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <tab.icon className="h-5 w-5" />
                                <span>{tab.label}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* Audit Tab */}
                            {activeTab === 'audit' && (
                                <div>
                                    {auditLogs.length === 0 ? (
                                        <div className="text-center py-16">
                                            <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Henüz denetim kaydı yok</h3>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Zaman</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Kullanıcı</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">İşlem</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Kaynak</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">IP</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                    {auditLogs.map((log) => (
                                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                                {new Date(log.timestamp).toLocaleString('tr-TR')}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{log.userName}</td>
                                                            <td className="px-4 py-3">
                                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-medium">
                                                                    {ACTION_LABELS[log.action] || log.action}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{log.entity}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">{log.ipAddress || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* CAPA Tab */}
                            {activeTab === 'capa' && (
                                <div>
                                    {capas.length === 0 ? (
                                        <div className="text-center py-16">
                                            <ClipboardCheck className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Henüz CAPA kaydı yok</h3>
                                            <button
                                                onClick={() => setShowCAPAModal(true)}
                                                className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                                            >
                                                İlk CAPA'yı Oluştur
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {capas.map((capa) => (
                                                <div key={capa.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div>
                                                            <div className="flex items-center space-x-3">
                                                                <span className="text-purple-600 dark:text-purple-400 font-mono font-semibold">{capa.capaNumber}</span>
                                                                <span className={`px-2 py-1 rounded text-xs font-medium ${capa.type === 'CORRECTIVE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                                    }`}>
                                                                    {capa.type === 'CORRECTIVE' ? 'Düzeltici' : 'Önleyici'}
                                                                </span>
                                                            </div>
                                                            <h3 className="font-semibold text-gray-900 dark:text-white mt-1">{capa.title}</h3>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{capa.description}</p>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${capa.status === 'OPEN' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                                capa.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                                                                capa.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                                }`}>
                                                                {capa.status === 'OPEN' ? 'Açık' : capa.status === 'IN_PROGRESS' ? 'Devam Ediyor' : capa.status === 'COMPLETED' ? 'Tamamlandı' : capa.status === 'CLOSED' ? 'Kapatıldı (Doğrulandı)' : capa.status}
                                                            </span>
                                                            {capa.status !== 'CLOSED' && (
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {capa.status === 'OPEN' && (
                                                                        <button
                                                                            onClick={() => handleUpdateCAPAStatus(capa.id, 'IN_PROGRESS')}
                                                                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium"
                                                                        >
                                                                            İşleme Al
                                                                        </button>
                                                                    )}
                                                                    {capa.status !== 'COMPLETED' && (
                                                                        <button
                                                                            onClick={() => handleUpdateCAPAStatus(capa.id, 'COMPLETED')}
                                                                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                                                                        >
                                                                            Tamamla
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleUpdateCAPAStatus(capa.id, 'CLOSED')}
                                                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium"
                                                                    >
                                                                        Etkinlik Doğrula & Kapat
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Adverse Events Tab */}
                            {activeTab === 'adverse' && (
                                <div>
                                    {adverseEvents.length === 0 ? (
                                        <div className="text-center py-16">
                                            <AlertTriangle className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Henüz olumsuz olay kaydı yok</h3>
                                            <button
                                                onClick={() => setShowAdverseModal(true)}
                                                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                            >
                                                Olay Raporla
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {adverseEvents.map((event) => (
                                                <div key={event.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div>
                                                            <div className="flex items-center space-x-3">
                                                                <span className="text-red-600 dark:text-red-400 font-mono font-semibold">{event.reportNumber}</span>
                                                                <span className={`px-2 py-1 rounded text-xs font-medium ${SEVERITY_COLORS[event.severity]}`}>
                                                                    {event.severity}
                                                                </span>
                                                                {(event.reportedToTitck || (event as any).reportedToAuthority) && (
                                                                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs font-semibold">
                                                                        TİTCK Bildirildi ✓
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300 mt-1">{event.description}</p>
                                                            {event.device && (
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                                    Cihaz: {event.device.name} ({event.device.tagNumber})
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                                Olay Tarihi: {new Date(event.eventDate).toLocaleDateString('tr-TR')}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${event.status === 'OPEN' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                                }`}>
                                                                {event.status === 'OPEN' ? 'Açık / İnceleniyor' : event.status === 'UNDER_INVESTIGATION' ? 'Teknik İncelemede' : event.status === 'RESOLVED' ? 'Çözüldü' : event.status === 'CLOSED' ? 'Kapatıldı' : event.status}
                                                            </span>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {!(event.reportedToTitck || (event as any).reportedToAuthority) && (
                                                                    <button
                                                                        onClick={() => handleUpdateAdverseStatus(event.id, { reportedToTitck: true })}
                                                                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium"
                                                                    >
                                                                        TİTCK Bildirildi İşaretle
                                                                    </button>
                                                                )}
                                                                {event.status !== 'CLOSED' && (
                                                                    <button
                                                                        onClick={() => handleUpdateAdverseStatus(event.id, { status: 'CLOSED' })}
                                                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium"
                                                                    >
                                                                        Çözüldü & Kapat
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* KVKK Tab */}
                            {activeTab === 'kvkk' && (
                                <div>
                                    {kvkkRequests.length === 0 ? (
                                        <div className="text-center py-16">
                                            <Shield className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Henüz KVKK veri sahibi başvurusu yok</h3>
                                            <button
                                                onClick={() => setShowKVKKModal(true)}
                                                className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                                            >
                                                İlk KVKK Başvurusunu Oluştur
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {kvkkRequests.map((req) => (
                                                <div key={req.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div>
                                                            <div className="flex items-center space-x-3">
                                                                <span className="font-semibold text-gray-900 dark:text-white">{req.requesterName}</span>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">({req.requesterEmail})</span>
                                                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-medium">
                                                                    {req.requestType === 'ACCESS' ? 'Bilgi Erişim Talebi' :
                                                                     req.requestType === 'RECTIFICATION' ? 'Veri Düzeltme' :
                                                                     req.requestType === 'ERASURE' ? 'Unutulma / Silme Talebi' :
                                                                     req.requestType === 'PORTABILITY' ? 'Veri Taşınabilirliği' : req.requestType}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{req.description}</p>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                Başvuru Tarihi: {new Date(req.createdAt).toLocaleDateString('tr-TR')}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                                req.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                                                                req.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                                req.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                                            }`}>
                                                                {req.status === 'PENDING' ? 'Beklemede' :
                                                                 req.status === 'IN_PROGRESS' ? 'İnceleniyor' :
                                                                 req.status === 'COMPLETED' ? 'Yanıtlandı / Tamamlandı' :
                                                                 req.status === 'REJECTED' ? 'Reddedildi' : req.status}
                                                            </span>
                                                            {req.status !== 'COMPLETED' && req.status !== 'REJECTED' && (
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    <button
                                                                        onClick={() => handleUpdateKVKKStatus(req.id, 'IN_PROGRESS')}
                                                                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                                                                    >
                                                                        İncelemeye Al
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateKVKKStatus(req.id, 'COMPLETED')}
                                                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium"
                                                                    >
                                                                        Tamamla
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateKVKKStatus(req.id, 'REJECTED')}
                                                                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
                                                                    >
                                                                        Reddet
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* CAPA Modal */}
            {showCAPAModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Yeni CAPA Oluştur</h2>
                            <button onClick={() => setShowCAPAModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCAPASubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Başlık <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={capaForm.title}
                                    onChange={(e) => setCAPAForm({ ...capaForm, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="CAPA başlığı"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Açıklama <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={capaForm.description}
                                    onChange={(e) => setCAPAForm({ ...capaForm, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                                    rows={3}
                                    placeholder="Sorun veya iyileştirme detayları"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tip</label>
                                    <select
                                        value={capaForm.type}
                                        onChange={(e) => setCAPAForm({ ...capaForm, type: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="CORRECTIVE">Düzeltici</option>
                                        <option value="PREVENTIVE">Önleyici</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kaynak</label>
                                    <select
                                        value={capaForm.source}
                                        onChange={(e) => setCAPAForm({ ...capaForm, source: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">Seçin</option>
                                        <option value="AUDIT">Denetim</option>
                                        <option value="COMPLAINT">Şikayet</option>
                                        <option value="ADVERSE_EVENT">Olumsuz Olay</option>
                                        <option value="INTERNAL">İç Tespit</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kök Neden Analizi</label>
                                <textarea
                                    value={capaForm.rootCause}
                                    onChange={(e) => setCAPAForm({ ...capaForm, rootCause: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                                    rows={2}
                                    placeholder="Sorunun kök nedeni"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Düzeltici Faaliyet</label>
                                <textarea
                                    value={capaForm.correctiveAction}
                                    onChange={(e) => setCAPAForm({ ...capaForm, correctiveAction: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                                    rows={2}
                                    placeholder="Yapılacak düzeltici işlemler"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Önleyici Faaliyet</label>
                                <textarea
                                    value={capaForm.preventiveAction}
                                    onChange={(e) => setCAPAForm({ ...capaForm, preventiveAction: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                                    rows={2}
                                    placeholder="Tekrarını önleyecek işlemler"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Son Tarih</label>
                                <input
                                    type="date"
                                    value={capaForm.dueDate}
                                    onChange={(e) => setCAPAForm({ ...capaForm, dueDate: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => { setShowCAPAModal(false); resetCAPAForm(); }}
                                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <Save className="h-5 w-5" />
                                    )}
                                    <span>CAPA Oluştur</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Adverse Event Modal */}
            {showAdverseModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Olumsuz Olay Bildirimi</h2>
                            <button onClick={() => setShowAdverseModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAdverseSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Cihaz <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={adverseForm.deviceId}
                                    onChange={(e) => setAdverseForm({ ...adverseForm, deviceId: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500"
                                    required
                                >
                                    <option value="">Cihaz Seçin</option>
                                    {devices.map((device) => (
                                        <option key={device.id} value={device.id}>
                                            {device.name} - {device.tagNumber}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Olay Tarihi <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={adverseForm.eventDate}
                                        onChange={(e) => setAdverseForm({ ...adverseForm, eventDate: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Ciddiyet <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={adverseForm.severity}
                                        onChange={(e) => setAdverseForm({ ...adverseForm, severity: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500"
                                    >
                                        <option value="LOW">Düşük</option>
                                        <option value="MEDIUM">Orta</option>
                                        <option value="HIGH">Yüksek</option>
                                        <option value="CRITICAL">Kritik</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Olay Açıklaması <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={adverseForm.description}
                                    onChange={(e) => setAdverseForm({ ...adverseForm, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500"
                                    rows={3}
                                    placeholder="Olayın detaylı açıklaması"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Araştırma Bulguları</label>
                                <textarea
                                    value={adverseForm.investigationFindings}
                                    onChange={(e) => setAdverseForm({ ...adverseForm, investigationFindings: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500"
                                    rows={2}
                                    placeholder="Araştırma sonuçları"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Düzeltici Önlemler</label>
                                <textarea
                                    value={adverseForm.correctiveActions}
                                    onChange={(e) => setAdverseForm({ ...adverseForm, correctiveActions: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500"
                                    rows={2}
                                    placeholder="Alınan düzeltici önlemler"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => { setShowAdverseModal(false); resetAdverseForm(); }}
                                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <AlertTriangle className="h-5 w-5" />
                                    )}
                                    <span>Olayı Raporla</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* KVKK Modal */}
            {showKVKKModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Yeni KVKK Veri Sahibi Başvurusu</h2>
                            <button onClick={() => setShowKVKKModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleKVKKSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Başvuru Sahibi Ad Soyad <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={kvkkForm.requesterName}
                                    onChange={(e) => setKvkkForm({ ...kvkkForm, requesterName: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        E-posta <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={kvkkForm.requesterEmail}
                                        onChange={(e) => setKvkkForm({ ...kvkkForm, requesterEmail: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Telefon
                                    </label>
                                    <input
                                        type="text"
                                        value={kvkkForm.requesterPhone}
                                        onChange={(e) => setKvkkForm({ ...kvkkForm, requesterPhone: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    KVKK Madde 11 Talep Türü <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={kvkkForm.requestType}
                                    onChange={(e) => setKvkkForm({ ...kvkkForm, requestType: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                >
                                    <option value="ACCESS">Kişisel Veri Bilgi / Erişim Talebi</option>
                                    <option value="RECTIFICATION">Kişisel Veri Düzeltme Talebi</option>
                                    <option value="ERASURE">Kişisel Veri Silme / Yok Etme Talebi</option>
                                    <option value="PORTABILITY">Veri Aktarımı / Taşınabilirlik Talebi</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Talep Detayı <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={kvkkForm.description}
                                    onChange={(e) => setKvkkForm({ ...kvkkForm, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowKVKKModal(false)}
                                    className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
                                >
                                    Başvuruyu Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
