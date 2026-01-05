'use client'

import { useState, useEffect } from 'react'
import { Building2, Plus, Search, MapPin, Phone, Mail, X } from 'lucide-react'
import { useToast } from '@/components/ToastProvider'
import { useHospital } from '@/contexts/HospitalContext'

interface Hospital {
    id: string
    name: string
    code: string
    address: string
    phone: string
    email: string
    _count: {
        devices: number
        users: number
    }
}

export default function HospitalsPage() {
    const [hospitals, setHospitals] = useState<Hospital[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const { showSuccess, showError } = useToast()
    const { activeHospitalId, setActiveHospital } = useHospital()

    const [editingHospital, setEditingHospital] = useState<any>(null)

    const [newHospital, setNewHospital] = useState({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        city: '',
        country: 'Türkiye'
    })

    useEffect(() => {
        fetchHospitals()
    }, [])

    const fetchHospitals = async () => {
        try {
            const response = await fetch('/api/hospitals')
            if (response.ok) {
                const data = await response.json()
                setHospitals(data)
            }
        } catch (error) {
            console.error('Error fetching hospitals:', error)
            showError('Şubeler yüklenirken hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddHospital = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = editingHospital ? `/api/hospitals/${editingHospital.id}` : '/api/hospitals'
            const method = editingHospital ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newHospital),
            })

            if (response.ok) {
                showSuccess(editingHospital ? 'Şube güncellendi' : 'Şube başarıyla eklendi')
                setShowAddModal(false)
                setEditingHospital(null)
                setNewHospital({
                    name: '',
                    code: '',
                    address: '',
                    phone: '',
                    email: '',
                    city: '',
                    country: 'Türkiye'
                })
                fetchHospitals()
            } else {
                showError('İşlem başarısız')
            }
        } catch (error) {
            console.error('Error adding hospital:', error)
            showError('Bir hata oluştu')
        }
    }

    const handleEditHospital = (hospital: Hospital) => {
        setEditingHospital(hospital)
        setNewHospital({
            name: hospital.name,
            code: hospital.code,
            address: hospital.address,
            phone: hospital.phone,
            email: hospital.email,
            city: '',
            country: 'Türkiye'
        })
        setShowAddModal(true)
    }

    const handleDeleteHospital = async (id: string) => {
        console.log('Delete button clicked for hospital:', id)

        if (!confirm('Bu şubeyi silmek istediğinize emin misiniz?')) {
            console.log('User cancelled deletion')
            return
        }

        console.log('User confirmed deletion, sending request...')

        try {
            const res = await fetch(`/api/hospitals/${id}`, {
                method: 'DELETE'
            })

            console.log('Delete response status:', res.status)
            const data = await res.json()
            console.log('Delete response data:', data)

            if (res.ok) {
                showSuccess('Şube silindi')
                fetchHospitals()
            } else {
                showError(data.error || 'Silme işlemi başarısız')
            }
        } catch (error) {
            console.error('Delete error:', error)
            showError('Bir hata oluştu')
        }
    }

    const filteredHospitals = hospitals.filter(hospital =>
        hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.code.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalDevices = hospitals.reduce((sum, h) => sum + (h._count?.devices || 0), 0)
    const totalUsers = hospitals.reduce((sum, h) => sum + (h._count?.users || 0), 0)

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Şube Yönetimi</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Tüm şubeleri ve detaylarını yönetin</p>
                </div>
                <button
                    onClick={() => {
                        setEditingHospital(null)
                        setNewHospital({
                            name: '',
                            code: '',
                            address: '',
                            phone: '',
                            email: '',
                            city: '',
                            country: 'Türkiye'
                        })
                        setShowAddModal(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors duration-150"
                >
                    <Plus className="h-5 w-5" />
                    <span>Yeni Şube Ekle</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <QuickStat label="Toplam Şube" value={hospitals.length} icon={<Building2 />} color="blue" />
                <QuickStat label="Toplam Cihaz" value={totalDevices} icon={<Building2 />} color="green" />
                <QuickStat label="Toplam Kullanıcı" value={totalUsers} icon={<Building2 />} color="purple" />
                <QuickStat label="Aktif Şubeler" value={hospitals.length} icon={<Building2 />} color="orange" />
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Şube adı veya kodu ile ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
                    />
                </div>
            </div>

            {/* Hospitals Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredHospitals.length === 0 ? (
                    <div className="col-span-2 text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow transition-colors">
                        <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Şube Bulunamadı</h3>
                        <p className="text-gray-500 dark:text-gray-400">Henüz kayıtlı şube yok veya arama kriterlerine uygun sonuç bulunamadı.</p>
                    </div>
                ) : (
                    filteredHospitals.map((hospital) => {
                        const isActive = activeHospitalId === hospital.id

                        return (
                            <div
                                key={hospital.id}
                                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all ${isActive ? 'ring-2 ring-green-500 border-2 border-green-200 dark:border-green-800' : 'border border-transparent dark:border-gray-700'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`bg-gradient-to-br p-3 rounded-lg ${isActive ? 'from-green-500 to-emerald-500' : 'from-blue-500 to-cyan-500'
                                            }`}>
                                            <Building2 className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{hospital.name}</h3>
                                                {isActive && (
                                                    <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded-full text-xs font-semibold">
                                                        ✓ Aktif
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{hospital.code}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                                        <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                        <span>{hospital.address}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                                        <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                        <span>{hospital.phone}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                                        <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                        <span>{hospital.email}</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Cihaz Sayısı</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{hospital._count?.devices || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Kullanıcı Sayısı</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{hospital._count?.users || 0}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between space-x-2">
                                    <div className="flex items-center space-x-2">
                                        {!isActive && (
                                            <button
                                                onClick={() => {
                                                    setActiveHospital(hospital.id, hospital.name, hospital.code)
                                                    showSuccess(`${hospital.name} aktif şube olarak ayarlandı`)
                                                }}
                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                                            >
                                                Aktif Et
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => handleEditHospital(hospital)}
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
                                        >
                                            Düzenle
                                        </button>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteHospital(hospital.id)}
                                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-sm"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Add Hospital Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingHospital ? 'Şube Düzenle' : 'Yeni Şube Ekle'}
                            </h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddHospital} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Şube Adı</label>
                                <input
                                    required
                                    type="text"
                                    value={newHospital.name}
                                    onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="Örn: Merkez Şube"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Şube Kodu</label>
                                    <input
                                        required
                                        type="text"
                                        value={newHospital.code}
                                        onChange={(e) => setNewHospital({ ...newHospital, code: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                                        placeholder="Örn: SUB001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefon</label>
                                    <input
                                        required
                                        type="tel"
                                        value={newHospital.phone}
                                        onChange={(e) => setNewHospital({ ...newHospital, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                                        placeholder="+90..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-posta</label>
                                <input
                                    required
                                    type="email"
                                    value={newHospital.email}
                                    onChange={(e) => setNewHospital({ ...newHospital, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="info@hastane.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adres</label>
                                <textarea
                                    required
                                    value={newHospital.address}
                                    onChange={(e) => setNewHospital({ ...newHospital, address: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="Açık adres..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Şehir</label>
                                    <input
                                        type="text"
                                        value={newHospital.city}
                                        onChange={(e) => setNewHospital({ ...newHospital, city: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                                        placeholder="İstanbul"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ülke</label>
                                    <input
                                        type="text"
                                        value={newHospital.country}
                                        onChange={(e) => setNewHospital({ ...newHospital, country: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                                        placeholder="Türkiye"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

function QuickStat({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        orange: 'from-orange-500 to-orange-600',
        purple: 'from-purple-500 to-purple-600',
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between transition-colors">
            <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
            <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} w-10 h-10 rounded-lg flex items-center justify-center text-white`}>
                {icon}
            </div>
        </div>
    )
}
