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
    Store,
    Calendar,
    Search,
    FolderKanban,
    ChevronDown,
    Globe,
    Bug
} from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { HospitalProvider, useHospital } from '@/contexts/HospitalContext'
import { signOut, useSession } from 'next-auth/react'
import { CommandPalette, useCommandPalette } from '@/components/CommandPalette'
import { NotificationCenter } from '@/components/NotificationCenter'
import { QuickActions } from '@/components/QuickActions'
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext'
import { AIChatBot } from '@/components/AIChatBot'
import { BugReportModal } from '@/components/BugReportModal'
import { useAppearance } from '@/contexts/AppearanceContext'
import { hasPermission } from '@/lib/rbac'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { sidebarCollapsed, setSidebarCollapsed } = useTheme()
    const { sidebarWidth, fontSizeClass } = useAppearance()
    const commandPalette = useCommandPalette()
    const [userProfile, setUserProfile] = useState<any>(null)

    const mainPaddingClass = sidebarCollapsed
        ? 'lg:pl-20'
        : sidebarWidth === 'narrow'
            ? 'lg:pl-56'
            : sidebarWidth === 'wide'
                ? 'lg:pl-72'
                : 'lg:pl-64'

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
                <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${fontSizeClass}`}>
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
                    <div className={`transition-all duration-300 ${mainPaddingClass}`}>
                        {/* Top Bar with Quick Search, Quick Actions & Notifications */}
                        <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8 py-2.5 flex items-center justify-between">
                            <button
                                onClick={commandPalette.open}
                                className="flex items-center space-x-2 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100/80 hover:bg-gray-200/80 dark:bg-gray-700/60 dark:hover:bg-gray-700 rounded-lg transition-colors border border-transparent dark:border-gray-600/30"
                                title="Arama & Hızlı Komutlar (Ctrl+K)"
                            >
                                <Search className="w-3.5 h-3.5 text-gray-400" />
                                <span className="hidden sm:inline">Hızlı Arama & Komutlar...</span>
                                <span className="sm:hidden">Ara...</span>
                                <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
                                    Ctrl+K
                                </kbd>
                            </button>

                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <Link
                                    href="/report-fault"
                                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/60 rounded-lg transition-all shadow-sm"
                                    title="Klinik personeli veya teknisyen için anında arıza bildirme formu"
                                >
                                    <Wrench className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                    <span className="hidden sm:inline">Hızlı Arıza Bildir</span>
                                    <span className="sm:hidden">Arıza</span>
                                </Link>
                                <QuickActions />
                                <NotificationCenter />
                            </div>
                        </div>
                        <main className="p-4 lg:p-8">
                            {children}
                        </main>
                    </div>
                </div>

                {/* AI Chatbot */}
                <AIChatBot />

                {/* Bug & Error Reporting Modal / Floating Trigger */}
                <BugReportModal />
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
    const { activeHospital, activeHospitalId, hospitals, setActiveHospital, clearActiveHospital } = useHospital()

    // Compute sidebar width class
    const sidebarWidthPx = sidebarWidth === 'narrow' ? 'w-56' : sidebarWidth === 'wide' ? 'w-72' : 'w-64'

    // Menu reordering state
    const [menuOrder, setMenuOrder] = useState<string[]>([])
    const [showMenuSettings, setShowMenuSettings] = useState(false)

    // Collapsible secondary modules state
    const secondaryRoutes = [
        '/dashboard/procurement',
        '/dashboard/decommissioning',
        '/dashboard/files',
        '/dashboard/uts',
        '/dashboard/compliance',
        '/dashboard/personnel',
        '/dashboard/training',
        '/dashboard/hospitals',
        '/dashboard/users'
    ]
    const [showOtherModules, setShowOtherModules] = useState(() =>
        secondaryRoutes.some(route => pathname?.startsWith(route))
    )

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
        // === TEMEL OPERASYONLAR (Ana Menü - Sık Kullanılanlar) ===
        { id: 'dashboard', name: 'Genel Bakış', href: '/dashboard', icon: LayoutDashboard, category: 'ANA MENÜ', requiredFeature: null, requiredPermission: 'dashboard:view', requiredRole: null, isSecondary: false },
        { id: 'devices', name: 'Cihaz Envanteri', href: '/dashboard/devices', icon: Package, category: 'ANA MENÜ', requiredFeature: null, requiredPermission: 'devices:view', requiredRole: null, isSecondary: false },
        { id: 'maintenance', name: 'Arıza & Bakım', href: '/dashboard/maintenance', icon: Wrench, category: 'ANA MENÜ', requiredFeature: 'maintenanceEnabled', requiredPermission: 'maintenance:view', requiredRole: null, isSecondary: false },
        { id: 'calibration', name: 'Kalibrasyon Takibi', href: '/dashboard/calibration', icon: FileBarChart, category: 'ANA MENÜ', requiredFeature: 'calibrationEnabled', requiredPermission: 'calibration:view', requiredRole: null, isSecondary: false },
        { id: 'calendar', name: 'Bakım Takvimi', href: '/dashboard/calendar', icon: Calendar, category: 'ANA MENÜ', requiredFeature: 'maintenanceEnabled', requiredPermission: 'maintenance:view', requiredRole: null, isSecondary: false },
        { id: 'contracts', name: 'Servis Sözleşmeleri', href: '/dashboard/contracts', icon: FileText, category: 'YÖNETİM & RAPORLAR', requiredFeature: 'contractsEnabled', requiredPermission: null, requiredRole: null, isSecondary: false },
        { id: 'reports', name: 'Maliyet & Analitik', href: '/dashboard/reports', icon: FileBarChart, category: 'YÖNETİM & RAPORLAR', requiredFeature: 'reportsEnabled', requiredPermission: 'reports:view', requiredRole: null, isSecondary: false },
        { id: 'bug-reports', name: 'Hata Bildirimleri', href: '/dashboard/bug-reports', icon: Bug, category: 'YÖNETİM & RAPORLAR', requiredFeature: null, requiredPermission: null, requiredRole: 'ADMIN', isSecondary: false },
        { id: 'settings', name: 'Sistem Ayarları', href: '/dashboard/settings', icon: Settings, category: 'YÖNETİM & RAPORLAR', requiredFeature: null, requiredPermission: null, requiredRole: null, isSecondary: false },

        // === EK MODÜLLER (İsteğe Bağlı & İleri Seviye) ===
        { id: 'procurement', name: 'Kabul & Muayene', href: '/dashboard/procurement', icon: PackageCheck, category: 'DİĞER MODÜLLER', requiredFeature: 'procurementEnabled', requiredPermission: null, requiredRole: null, isSecondary: true },
        { id: 'decommissioning', name: 'HEK / Hurda Süreci', href: '/dashboard/decommissioning', icon: Trash2, category: 'DİĞER MODÜLLER', requiredFeature: 'decommissioningEnabled', requiredPermission: null, requiredRole: null, isSecondary: true },
        { id: 'files', name: 'Döküman Merkezi', href: '/dashboard/files', icon: FileText, category: 'DİĞER MODÜLLER', requiredFeature: null, requiredPermission: null, requiredRole: null, isSecondary: true },
        { id: 'uts', name: 'ÜTS Bildirimleri', href: '/dashboard/uts', icon: Database, category: 'DİĞER MODÜLLER', requiredFeature: 'utsEnabled', requiredPermission: null, requiredRole: null, isSecondary: true },
        { id: 'compliance', name: 'Denetim & Uyumluluk', href: '/dashboard/compliance', icon: Shield, category: 'DİĞER MODÜLLER', requiredFeature: 'complianceEnabled', requiredPermission: null, requiredRole: null, isSecondary: true },
        { id: 'personnel', name: 'Biyomedikal Personel', href: '/dashboard/personnel', icon: Users, category: 'DİĞER MODÜLLER', requiredFeature: 'trainingEnabled', requiredPermission: null, requiredRole: null, isSecondary: true },
        { id: 'training', name: 'Eğitim Yönetimi', href: '/dashboard/training', icon: GraduationCap, category: 'DİĞER MODÜLLER', requiredFeature: 'trainingEnabled', requiredPermission: null, requiredRole: null, isSecondary: true },
        { id: 'hospitals', name: 'Şubeler & Birimler', href: '/dashboard/hospitals', icon: Building2, category: 'DİĞER MODÜLLER', requiredFeature: 'branchesEnabled', requiredPermission: null, requiredRole: null, isSecondary: true },
        { id: 'users', name: 'Kullanıcı Yönetimi', href: '/dashboard/users', icon: Users, category: 'DİĞER MODÜLLER', requiredFeature: null, requiredPermission: 'users:manage', requiredRole: null, isSecondary: true },
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
        // Check requiredPermission if it exists
        if (item.requiredPermission && !hasPermission(session?.user?.role, item.requiredPermission as any)) {
            return false
        }

        // Keep backward compatibility for requiredRole (or remove if fully migrated)
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
                                <p className="text-xs text-gray-600 dark:text-gray-400">v1.5.0</p>
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
                        {session?.user?.hospitalId ? (
                            /* Fixed Institutional Workspace for Hospital Users */
                            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <div className="flex items-center space-x-2 overflow-hidden">
                                    <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                    <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 truncate" title={activeHospital?.name}>
                                        {activeHospital?.name || 'Kurumunuz'}
                                    </span>
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                    Aktif Kurum Çalışma Alanı
                                </p>
                            </div>
                        ) : (
                            /* Global Multi-Hospital Switcher for System Supervisors */
                            <div className="relative group">
                                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2 overflow-hidden">
                                            <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 truncate">
                                                {activeHospital?.name || 'Tüm Kurumlar (Genel Konsol)'}
                                            </span>
                                        </div>
                                        <ChevronRight className="h-3 w-3 text-blue-400 transform transition-transform group-hover:rotate-90" />
                                    </div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                        {activeHospital ? 'Aktif Kurum' : 'Süpervizör / Tüm Kurumlar'}
                                    </p>
                                </div>

                                {/* Dropdown Menu */}
                                <div className="absolute left-0 right-0 mt-1 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                    <button
                                        onClick={() => clearActiveHospital()}
                                        className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors border-b border-gray-100 dark:border-gray-700 ${!activeHospitalId ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-900/10' : 'text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <Globe className="h-3 w-3 flex-shrink-0 text-indigo-500" />
                                            <span className="truncate font-semibold">Tüm Kurumlar (Genel Konsol)</span>
                                        </div>
                                    </button>
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
                        )}
                    </div>
                )}

                {/* Navigation - Scrollable Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <nav className="p-3 space-y-1">
                        {/* Primary Core Items */}
                        {(collapsed ? navigation : navigation.filter(item => !(item as any).isSecondary)).map((item, index, arr) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            const isDragging = draggedItem === item.id
                            const isDragOver = dragOverItem === item.id

                            // Show category header if category changed and user hasn't custom sorted
                            const showCategoryHeader = !collapsed && menuOrder.length === 0 && (
                                index === 0 || (arr[index - 1] as any).category !== (item as any).category
                            )

                            return (
                                <div key={item.id}>
                                    {showCategoryHeader && (item as any).category && (
                                        <div className={`px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 ${index > 0 ? 'pt-3.5 pb-1' : 'pt-1 pb-1'}`}>
                                            {(item as any).category}
                                        </div>
                                    )}
                                    <div
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
                                            prefetch={true}
                                            onClick={onClose}
                                            className={`
                                                flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg transition-colors duration-150 overflow-hidden
                                                ${isActive
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold shadow-sm'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }
                                            `}
                                            title={collapsed ? item.name : undefined}
                                        >
                                            <Icon className="h-4 w-4 flex-shrink-0" />
                                            {!collapsed && <span className="truncate text-xs font-medium">{item.name}</span>}
                                        </Link>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Collapsible Secondary Items */}
                        {!collapsed && navigation.some(item => (item as any).isSecondary) && (
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowOtherModules(!showOtherModules)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/80 dark:hover:bg-gray-700/60 border border-gray-200/80 dark:border-gray-700/60 rounded-lg transition-colors my-1.5"
                                >
                                    <span className="flex items-center space-x-2">
                                        <FolderKanban className="h-3.5 w-3.5 text-blue-500" />
                                        <span>{showOtherModules ? 'Diğer Modülleri Gizle' : `Diğer Modüller (${navigation.filter(item => (item as any).isSecondary).length})`}</span>
                                    </span>
                                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showOtherModules ? 'rotate-180' : ''}`} />
                                </button>

                                {showOtherModules && (
                                    <div className="space-y-1 pl-1 border-l-2 border-blue-500/30 ml-2 mt-1 animate-in fade-in duration-200">
                                        {navigation.filter(item => (item as any).isSecondary).map((item) => {
                                            const Icon = item.icon
                                            const isActive = pathname === item.href
                                            return (
                                                <Link
                                                    key={item.id}
                                                    href={item.href}
                                                    prefetch={true}
                                                    onClick={onClose}
                                                    className={`
                                                        flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-150 overflow-hidden text-xs
                                                        ${isActive
                                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold shadow-sm'
                                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                        }
                                                    `}
                                                >
                                                    <Icon className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 group-hover:text-blue-500" />
                                                    <span className="truncate">{item.name}</span>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
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

