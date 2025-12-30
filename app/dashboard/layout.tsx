'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Package,
    Wrench,
    FileBarChart,
    Settings,
    Users,
    Building2,
    LogOut,
    Menu,
    X,
    Database,
    ChevronLeft,
    ChevronRight,
    Shield,
    GraduationCap,
    PackageCheck,
    Trash2,
    FileText,
    GripVertical,
    ArrowUp,
    ArrowDown,
    Store
} from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { HospitalProvider, useHospital } from '@/contexts/HospitalContext'
import { signOut, useSession } from 'next-auth/react'
import { CommandPalette, useCommandPalette } from '@/components/CommandPalette'
import { NotificationCenter } from '@/components/NotificationCenter'
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext'
import { AIChatBot } from '@/components/AIChatBot'
import { useAppearance } from '@/contexts/AppearanceContext'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { sidebarCollapsed, setSidebarCollapsed } = useTheme()
    const commandPalette = useCommandPalette()
    const [userProfile, setUserProfile] = useState<any>(null)

    const fetchUserProfile = () => {
        fetch('/api/users/me')
            .then(res => res.ok ? res.json() : null)
            .then(data => setUserProfile(data))
            .catch(() => { })
    }

    // Fetch user profile for avatar
    useEffect(() => {
        fetchUserProfile()

        // Listen for avatar update events
        const handleAvatarUpdate = () => fetchUserProfile()
        window.addEventListener('avatar-updated', handleAvatarUpdate)
        return () => window.removeEventListener('avatar-updated', handleAvatarUpdate)
    }, [])

    return (
        <SettingsProvider>
            <HospitalProvider>
                <CommandPalette isOpen={commandPalette.isOpen} onClose={commandPalette.close} />
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                    {/* Mobile menu button */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
                    >
                        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {/* Sidebar */}
                    <Sidebar
                        isOpen={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                        collapsed={sidebarCollapsed}
                        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                        userProfile={userProfile}
                    />

                    {/* Main Content */}
                    <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
                        {/* Top Bar with Notifications */}
                        <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8 py-3 flex justify-end">
                            <NotificationCenter />
                        </div>
                        <main className="p-4 lg:p-8">
                            {children}
                        </main>
                    </div>
                </div>

                {/* AI Chatbot */}
                <AIChatBot />
            </HospitalProvider>
        </SettingsProvider>
    )
}

function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse, userProfile }: {
    isOpen: boolean;
    onClose: () => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
    userProfile: any;
}) {
    const pathname = usePathname()
    // const { activeHospital } = require('@/contexts/HospitalContext').useHospital() // Safe require if context might be missing, but typically import is fine
    // Using loose import to avoid circular dep issues in some setups, but modifying to standard import if possible.
    // Keeping logic similar to original but with settings check.

    // We need to fetch settings
    const { settings } = useSettings()
    const { data: session } = useSession()
    const { sidebarWidth } = useAppearance()
    const { activeHospital, activeHospitalId, hospitals, setActiveHospital } = useHospital()

    // Compute sidebar width class
    const sidebarWidthPx = sidebarWidth === 'narrow' ? 'w-56' : sidebarWidth === 'wide' ? 'w-72' : 'w-64'

    // Menu reordering state
    const [menuOrder, setMenuOrder] = useState<string[]>([])
    const [showMenuSettings, setShowMenuSettings] = useState(false)

    // Load menu order from localStorage
    useEffect(() => {
        const savedOrder = localStorage.getItem('sidebarMenuOrder')
        if (savedOrder) {
            try {
                setMenuOrder(JSON.parse(savedOrder))
            } catch (e) { }
        }
    }, [])

    // Save menu order
    const saveMenuOrder = (newOrder: string[]) => {
        setMenuOrder(newOrder)
        localStorage.setItem('sidebarMenuOrder', JSON.stringify(newOrder))
    }

    // Drag and drop state
    const [draggedItem, setDraggedItem] = useState<string | null>(null)
    const [dragOverItem, setDragOverItem] = useState<string | null>(null)

    // Handle drag start
    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedItem(id)
        e.dataTransfer.effectAllowed = 'move'
    }

    // Handle drag over
    const handleDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault()
        if (draggedItem && draggedItem !== id) {
            setDragOverItem(id)
        }
    }

    // Handle drop
    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault()
        if (!draggedItem || draggedItem === targetId) {
            setDraggedItem(null)
            setDragOverItem(null)
            return
        }

        const currentOrder = menuOrder.length > 0 ? [...menuOrder] : baseNavigation.map(n => n.id)
        const draggedIndex = currentOrder.indexOf(draggedItem)
        const targetIndex = currentOrder.indexOf(targetId)

        if (draggedIndex !== -1 && targetIndex !== -1) {
            // Remove dragged item and insert at target position
            currentOrder.splice(draggedIndex, 1)
            currentOrder.splice(targetIndex, 0, draggedItem)
            saveMenuOrder(currentOrder)
        }

        setDraggedItem(null)
        setDragOverItem(null)
    }

    // Handle drag end
    const handleDragEnd = () => {
        setDraggedItem(null)
        setDragOverItem(null)
    }

    const baseNavigation = [
        { id: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, requiredFeature: null, requiredRole: null },
        { id: 'devices', name: 'Cihazlar', href: '/dashboard/devices', icon: Package, requiredFeature: null, requiredRole: null },
        { id: 'personnel', name: 'Personel', href: '/dashboard/personnel', icon: Users, requiredFeature: 'trainingEnabled', requiredRole: null },
        { id: 'training', name: 'Eğitimler', href: '/dashboard/training', icon: GraduationCap, requiredFeature: 'trainingEnabled', requiredRole: null },
        { id: 'procurement', name: 'Teslim Alma', href: '/dashboard/procurement', icon: PackageCheck, requiredFeature: 'procurementEnabled', requiredRole: null },
        { id: 'decommissioning', name: 'Kullanım Dışı Bırakma', href: '/dashboard/decommissioning', icon: Trash2, requiredFeature: 'decommissioningEnabled', requiredRole: null },
        { id: 'maintenance', name: 'Bakım Yönetimi', href: '/dashboard/maintenance', icon: Wrench, requiredFeature: 'maintenanceEnabled', requiredRole: null },
        { id: 'calibration', name: 'Kalibrasyon', href: '/dashboard/calibration', icon: FileBarChart, requiredFeature: 'calibrationEnabled', requiredRole: null },
        { id: 'contracts', name: 'Sözleşmeler', href: '/dashboard/contracts', icon: FileText, requiredFeature: 'contractsEnabled', requiredRole: null },
        { id: 'uts', name: 'UTS', href: '/dashboard/uts', icon: Database, requiredFeature: 'utsEnabled', requiredRole: null },
        { id: 'compliance', name: 'Uyumluluk', href: '/dashboard/compliance', icon: Shield, requiredFeature: 'complianceEnabled', requiredRole: null },
        { id: 'reports', name: 'Raporlar', href: '/dashboard/reports', icon: FileBarChart, requiredFeature: 'reportsEnabled', requiredRole: null },
        { id: 'hospitals', name: 'Şubeler', href: '/dashboard/hospitals', icon: Building2, requiredFeature: 'branchesEnabled', requiredRole: null },
        { id: 'users', name: 'Kullanıcılar', href: '/dashboard/users', icon: Users, requiredFeature: null, requiredRole: 'ADMIN' },
        { id: 'settings', name: 'Ayarlar', href: '/dashboard/settings', icon: Settings, requiredFeature: null, requiredRole: null },
    ]

    // Sort navigation based on saved order
    const sortedBaseNavigation = menuOrder.length > 0
        ? [...baseNavigation].sort((a, b) => {
            const indexA = menuOrder.indexOf(a.id)
            const indexB = menuOrder.indexOf(b.id)
            if (indexA === -1 && indexB === -1) return 0
            if (indexA === -1) return 1
            if (indexB === -1) return -1
            return indexA - indexB
        })
        : baseNavigation

    const navigation = sortedBaseNavigation.filter(item => {
        // Check requiredRole first (e.g., ADMIN only menus)
        if (item.requiredRole && session?.user?.role !== item.requiredRole) {
            return false
        }
        // Then check requiredFeature
        if (!item.requiredFeature) return true
        if (!settings) return false
        return settings[item.requiredFeature] === true
    })

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`
          fixed top-0 left-0 z-40 h-full bg-white dark:bg-gray-800 shadow-xl transform transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'w-20' : sidebarWidthPx}
          lg:translate-x-0 flex flex-col
          max-w-[85vw]
        `}
            >
                {/* Logo & Toggle */}
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-6 border-b border-gray-200 dark:border-gray-700`}>
                    {!collapsed && (
                        <div className="flex items-center space-x-3">
                            <div className="relative w-10 h-10 flex-shrink-0">
                                <Image
                                    src="/logo.png"
                                    alt="MediSync"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">MediSync</h1>
                                <p className="text-xs text-gray-600 dark:text-gray-400">1.0</p>
                            </div>
                        </div>
                    )}
                    {collapsed && (
                        <div className="relative w-8 h-8 mx-auto">
                            <Image
                                src="/logo.png"
                                alt="MediSync"
                                fill
                                className="object-contain"
                            />
                        </div>
                    )}
                    <button
                        onClick={onToggleCollapse}
                        className="hidden lg:block p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title={collapsed ? 'Genişlet' : 'Daralt'}
                    >
                        {collapsed ? (
                            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        ) : (
                            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        )}
                    </button>
                </div>

                {/* Active Hospital Switcher */}
                {!collapsed && (
                    <div className="mx-4 mt-4 mb-2">
                        <div className="relative group">
                            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 overflow-hidden">
                                        <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                        <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 truncate">
                                            {activeHospital?.name || 'Şube Seçilmedi'}
                                        </span>
                                    </div>
                                    <ChevronRight className="h-3 w-3 text-blue-400 transform transition-transform group-hover:rotate-90" />
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                    {activeHospital ? 'Aktif Birim' : 'Lütfen Birim Seçin'}
                                </p>
                            </div>

                            {/* Dropdown Menu */}
                            <div className="absolute left-0 right-0 mt-1 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                {hospitals.length > 0 ? (
                                    hospitals.map((h) => (
                                        <button
                                            key={h.id}
                                            onClick={() => setActiveHospital(h.id, h.name, h.code)}
                                            className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors ${activeHospitalId === h.id ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-900/10' : 'text-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <Building2 className="h-3 w-3 flex-shrink-0" />
                                                <span className="truncate">{h.name}</span>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-3 py-2 text-[10px] text-gray-500 italic text-center">
                                        Şube bulunamadı
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation - Scrollable Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <nav className="p-4 space-y-1">
                        {navigation.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            const isDragging = draggedItem === item.id
                            const isDragOver = dragOverItem === item.id

                            return (
                                <div
                                    key={item.id}
                                    draggable={!collapsed}
                                    onDragStart={(e) => handleDragStart(e, item.id)}
                                    onDragOver={(e) => handleDragOver(e, item.id)}
                                    onDrop={(e) => handleDrop(e, item.id)}
                                    onDragEnd={handleDragEnd}
                                    className={`
                                        ${isDragging ? 'opacity-50' : ''}
                                        ${isDragOver ? 'border-t-2 border-blue-500' : ''}
                                        ${!collapsed ? 'cursor-grab active:cursor-grabbing' : ''}
                                    `}
                                >
                                    <Link
                                        href={item.href}
                                        onClick={onClose}
                                        className={`
                                            flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-3 py-3 rounded-lg transition-colors duration-150 overflow-hidden
                                            ${isActive
                                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }
                                        `}
                                        title={collapsed ? item.name : undefined}
                                    >
                                        <Icon className="h-5 w-5 flex-shrink-0" />
                                        {!collapsed && <span className="truncate">{item.name}</span>}
                                    </Link>
                                </div>
                            )
                        })}
                    </nav>
                </div>

                {/* User section - Fixed at bottom of flex container */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    {!collapsed ? (
                        <>
                            <Link href="/dashboard/profile" className="flex items-center space-x-3 mb-3 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors">
                                {userProfile?.avatarUrl ? (
                                    <img
                                        src={userProfile.avatarUrl}
                                        alt="Profile"
                                        className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                                    />
                                ) : (
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {session?.user?.name?.[0] || 'A'}
                                    </div>
                                )}
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{session?.user?.name || 'Kullanıcı'}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{session?.user?.email || 'Giriş yapılmadı'}</p>
                                </div>
                            </Link>
                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-150"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="text-xs">Çıkış Yap</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/dashboard/profile" className="flex justify-center mb-3 hover:opacity-80 transition-opacity">
                                {userProfile?.avatarUrl ? (
                                    <img
                                        src={userProfile.avatarUrl}
                                        alt="Profile"
                                        className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                                    />
                                ) : (
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {session?.user?.name?.[0] || 'A'}
                                    </div>
                                )}
                            </Link>
                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="w-full flex items-center justify-center px-2 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-150"
                                title="Çıkış Yap"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}

