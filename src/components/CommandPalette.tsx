'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Package,
  Wrench,
  FileBarChart,
  Settings,
  Users,
  Building2,
  LayoutDashboard,
  Database,
  Shield,
  X,
  ArrowRight,
  Command
} from 'lucide-react'

interface CommandItem {
  id: string
  title: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  keywords?: string[]
  category: string
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Define commands
  const commands: CommandItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Ana sayfaya git',
      icon: LayoutDashboard,
      action: () => router.push('/dashboard'),
      category: 'Navigation'
    },
    {
      id: 'devices',
      title: 'Cihazlar',
      description: 'Cihaz yönetimi sayfası',
      icon: Package,
      action: () => router.push('/dashboard/devices'),
      keywords: ['cihaz', 'device', 'ekipman'],
      category: 'Navigation'
    },
    {
      id: 'maintenance',
      title: 'Bakım Yönetimi',
      description: 'Bakım kayıtları ve planları',
      icon: Wrench,
      action: () => router.push('/dashboard/maintenance'),
      keywords: ['bakım', 'maintenance', 'onarım'],
      category: 'Navigation'
    },
    {
      id: 'calibration',
      title: 'Kalibrasyon',
      description: 'Kalibrasyon yönetimi',
      icon: FileBarChart,
      action: () => router.push('/dashboard/calibration'),
      keywords: ['kalibrasyon', 'calibration'],
      category: 'Navigation'
    },
    {
      id: 'reports',
      title: 'Raporlar',
      description: 'Raporlar ve analizler',
      icon: FileBarChart,
      action: () => router.push('/dashboard/reports'),
      keywords: ['rapor', 'report', 'analiz'],
      category: 'Navigation'
    },
    {
      id: 'users',
      title: 'Kullanıcılar',
      description: 'Kullanıcı yönetimi',
      icon: Users,
      action: () => router.push('/dashboard/users'),
      keywords: ['kullanıcı', 'user', 'kullanici'],
      category: 'Navigation'
    },
    {
      id: 'hospitals',
      title: 'Şubeler',
      description: 'Şube ve hastane yönetimi',
      icon: Building2,
      action: () => router.push('/dashboard/hospitals'),
      keywords: ['şube', 'hastane', 'hospital', 'branch'],
      category: 'Navigation'
    },
    {
      id: 'uts',
      title: 'UTS',
      description: 'UTS entegrasyonu',
      icon: Database,
      action: () => router.push('/dashboard/uts'),
      keywords: ['uts', 'tıbbi cihaz'],
      category: 'Navigation'
    },
    {
      id: 'compliance',
      title: 'Uyumluluk',
      description: 'Uyumluluk yönetimi',
      icon: Shield,
      action: () => router.push('/dashboard/compliance'),
      keywords: ['uyumluluk', 'compliance', 'uyum'],
      category: 'Navigation'
    },
    {
      id: 'settings',
      title: 'Ayarlar',
      description: 'Uygulama ayarları',
      icon: Settings,
      action: () => router.push('/dashboard/settings'),
      keywords: ['ayar', 'setting', 'config'],
      category: 'Navigation'
    }
  ]

  // Filter commands based on search
  const filteredCommands = commands.filter((cmd) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      cmd.title.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some((kw) => kw.toLowerCase().includes(searchLower))
    )
  })

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = []
    }
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, CommandItem[]>)

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1))
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
        return
      }

      if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault()
        filteredCommands[selectedIndex].action()
        onClose()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands, onClose])

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setSearch('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Command Palette */}
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="h-5 w-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Komut ara veya sayfa bul..."
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
          />
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd>
            <span>navigate</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">↵</kbd>
            <span>select</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">esc</kbd>
            <span>close</span>
          </div>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-96 overflow-y-auto p-2"
        >
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              <p>Sonuç bulunamadı</p>
              <p className="text-sm mt-2">Farklı bir arama terimi deneyin</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category} className="mb-4">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {category}
                </div>
                {items.map((cmd, index) => {
                  const globalIndex = filteredCommands.indexOf(cmd)
                  const Icon = cmd.icon
                  const isSelected = globalIndex === selectedIndex

                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action()
                        onClose()
                      }}
                      className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{cmd.title}</div>
                        {cmd.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {cmd.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-between">
            <span>{filteredCommands.length} sonuç</span>
            <div className="flex items-center space-x-4">
              <span>⌘K ile aç</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook to use Command Palette with keyboard shortcut
 */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev)
  }
}

