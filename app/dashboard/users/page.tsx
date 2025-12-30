'use client'

import { useToast } from '@/components/ToastProvider'
import { useState, useEffect } from 'react'
import { Users, Plus, Search, Filter, Mail, Phone, Shield, X } from 'lucide-react'

import { demoUsers } from '@/lib/demo-data'

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterRole, setFilterRole] = useState('ALL')
    const [showAddModal, setShowAddModal] = useState(false)
    const { showSuccess, showError } = useToast()

    const [editingUser, setEditingUser] = useState<any>(null)
    const [hospitals, setHospitals] = useState<any[]>([])

    // New User State
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        role: 'TECHNICIAN',
        department: '',
        phone: '',
        hospitalId: '',
        password: '' // Initialize as empty
    })

    useEffect(() => {
        fetchUsers()
        fetchHospitals()
    }, [])

    const fetchHospitals = async () => {
        try {
            const response = await fetch('/api/hospitals')
            if (response.ok) {
                const data = await response.json()
                setHospitals(data)
                // Set default hospital if available
                if (data.length > 0 && !newUser.hospitalId) {
                    setNewUser(prev => ({ ...prev, hospitalId: data[0].id }))
                }
            }
        } catch (error) {
            console.error('Error fetching hospitals:', error)
        }
    }

    const fetchUsers = async () => {
        try {
            setIsLoading(true)

            // Check Demo Mode
            const savedSettings = localStorage.getItem('appSettings')
            const isDemoMode = savedSettings ? JSON.parse(savedSettings).demoMode : false

            if (isDemoMode) {
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 500))
                setUsers(demoUsers as any)
                setIsLoading(false)
                return
            }

            const res = await fetch('/api/users')
            if (res.ok) {
                setUsers(await res.json())
            }
        } catch (error) {
            console.error('Error fetching users:', error)
            showError('Kullanıcılar yüklenirken hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault()

        // Check Demo Mode
        const savedSettings = localStorage.getItem('appSettings')
        const isDemoMode = savedSettings ? JSON.parse(savedSettings).demoMode : false

        if (isDemoMode) {
            const demoNewUser = {
                ...newUser,
                id: Math.random().toString(36).substr(2, 9),
                createdAt: new Date().toISOString()
            }
            setUsers([demoNewUser, ...users])
            showSuccess('Demo modunda kullanıcı oluşturuldu')
            setShowAddModal(false)
            setNewUser({
                name: '',
                email: '',
                role: 'TECHNICIAN',
                department: '',
                phone: '',
                hospitalId: hospitals.length > 0 ? hospitals[0].id : '',
                password: ''
            })
            return
        }

        try {
            const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
            const method = editingUser ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            })

            const data = await res.json()

            if (res.ok) {
                showSuccess(editingUser ? 'Kullanıcı güncellendi' : 'Kullanıcı başarıyla oluşturuldu')
                setShowAddModal(false)
                setEditingUser(null)
                setNewUser({
                    name: '',
                    email: '',
                    role: 'TECHNICIAN',
                    department: '',
                    phone: '',
                    hospitalId: hospitals.length > 0 ? hospitals[0].id : '',
                    password: ''
                })
                fetchUsers()
            } else {
                const errorMessage = data.error?.message || data.error || 'İşlem başarısız'
                showError(errorMessage)
            }
        } catch (error) {
            console.error('User action error:', error)
            showError('Bir hata oluştu')
        }
    }

    const handleEditUser = (user: any) => {
        setEditingUser(user)
        setNewUser({
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department || '',
            phone: user.phone || '',
            hospitalId: user.hospital?.id || (hospitals.length > 0 ? hospitals[0].id : ''),
            password: '' // Don't populate password
        })
        setShowAddModal(true)
    }

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return

        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                showSuccess('Kullanıcı silindi')
                fetchUsers()
            } else {
                showError('Silme işlemi başarısız')
            }
        } catch (error) {
            showError('Bir hata oluştu')
        }
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesFilter = filterRole === 'ALL' || user.role === filterRole
        return matchesSearch && matchesFilter
    })

    const stats = {
        total: users.length,
        active: users.length, // Assuming all fetched are active for now
        admins: users.filter(u => u.role === 'ADMIN').length,
        technicians: users.filter(u => u.role === 'TECHNICIAN').length,
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-64">Yükleniyor...</div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kullanıcı Yönetimi</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Sistem kullanıcılarını ve yetkilerini yönetin</p>
                </div>
                <button
                    onClick={() => {
                        setEditingUser(null)
                        setNewUser({
                            name: '',
                            email: '',
                            role: 'TECHNICIAN',
                            department: '',
                            phone: '',
                            hospitalId: hospitals.length > 0 ? hospitals[0].id : '',
                            password: ''
                        })
                        setShowAddModal(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors duration-150"
                >
                    <Plus className="h-5 w-5" />
                    <span>Yeni Kullanıcı Ekle</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <QuickStat label="Toplam Kullanıcı" value={stats.total} icon={<Users />} color="blue" />
                <QuickStat label="Aktif" value={stats.active} icon={<Users />} color="green" />
                <QuickStat label="Yöneticiler" value={stats.admins} icon={<Shield />} color="purple" />
                <QuickStat label="Teknisyenler" value={stats.technicians} icon={<Users />} color="orange" />
            </div>

            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Kullanıcı adı veya email ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        >
                            <option value="ALL">Tüm Roller</option>
                            <option value="ADMIN">Yönetici</option>
                            <option value="HOSPITAL_ADMIN">Hastane Yöneticisi</option>
                            <option value="TECHNICIAN">Teknisyen</option>
                            <option value="DOCTOR">Doktor</option>
                            <option value="NURSE">Hemşire</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Kullanıcı</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Şube</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Departman</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">İletişim</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Durum</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        Kullanıcı bulunamadı
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <RoleBadge role={user.role} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{user.hospital?.name || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{user.department || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {user.phone && (
                                                    <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                                                        <Phone className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                                        <span>{user.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="badge badge-success">Aktif</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-sm"
                                                >
                                                    Sil
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
                            </h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ad Soyad</label>
                                <input
                                    type="text"
                                    required
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-posta</label>
                                <input
                                    type="email"
                                    required
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Şifre {editingUser && <span className="text-xs text-gray-500 font-normal">(Boş bırakılırsa değişmez)</span>}</label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    placeholder={editingUser ? "Değiştirmek için yeni şifre girin" : "Şifre belirleyin"}
                                    value={newUser.password || ''}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol</label>
                                    <select
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="TECHNICIAN">Teknisyen</option>
                                        <option value="ADMIN">Yönetici</option>
                                        <option value="HOSPITAL_ADMIN">Hastane Yöneticisi</option>
                                        <option value="DOCTOR">Doktor</option>
                                        <option value="NURSE">Hemşire</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Departman</label>
                                    <input
                                        type="text"
                                        value={newUser.department}
                                        onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Şube</label>
                                <select
                                    required
                                    value={newUser.hospitalId}
                                    onChange={(e) => setNewUser({ ...newUser, hospitalId: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Şube Seçin</option>
                                    {hospitals.map((hospital) => (
                                        <option key={hospital.id} value={hospital.id}>
                                            {hospital.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefon</label>
                                <input
                                    type="tel"
                                    value={newUser.phone}
                                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
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

function RoleBadge({ role }: { role: string }) {
    const roleConfig: Record<string, { label: string; className: string }> = {
        ADMIN: { label: 'Yönetici', className: 'badge-danger' },
        HOSPITAL_ADMIN: { label: 'Hastane Yöneticisi', className: 'badge-warning' },
        TECHNICIAN: { label: 'Teknisyen', className: 'badge-info' },
        DOCTOR: { label: 'Doktor', className: 'badge-success' },
        NURSE: { label: 'Hemşire', className: 'badge-info' },
        USER: { label: 'Kullanıcı', className: 'badge-gray' },
    }

    const config = roleConfig[role] || { label: role, className: 'badge-gray' }
    return <span className={`badge ${config.className}`}>{config.label}</span>
}
