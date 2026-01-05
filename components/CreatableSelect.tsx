'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react'

interface Option {
    label: string
    value: string
    group?: string
}

interface CreatableSelectProps {
    options: Option[]
    value?: string
    onChange: (value: string) => void
    onCreate: (value: string) => void
    placeholder?: string
    label?: string
    className?: string
    required?: boolean
}

export default function CreatableSelect({
    options,
    value,
    onChange,
    onCreate,
    placeholder = 'Seçiniz...',
    label,
    className = '',
    required = false
}: CreatableSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Find selected option label
    const selectedOption = options.find(opt => opt.value === value)

    // If value is set but not in options, it might be a newly created value (handled by parent logic usually)
    // But for display purposes, if parents passes a value that is NOT in options, 
    // and we assume it's the "new" value text if it doesn't match any ID. 
    // However, usually parent handles logic. 
    // Let's rely on searchTerm mirroring the display value when open, 
    // and a display box when closed.

    // Effect to handle clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                // Reset search term if no selection was made? 
                // Or keep it? Let's reset to valid state.
                setSearchTerm('')
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Filter options
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Grouping logic if needed (simple version first)
    // We'll flatten groups for search, but could display them nicely. 
    // For now, let's stick to flat list or simple grouping support if simple.

    const handleSelect = (optValue: string) => {
        onChange(optValue)
        setIsOpen(false)
        setSearchTerm('')
    }

    const handleCreate = () => {
        if (searchTerm.trim()) {
            onCreate(searchTerm.trim())
            setIsOpen(false)
            setSearchTerm('')
        }
    }

    // Determine display text
    // If value matches an option, show label. 
    // If value is something else (like "NEW" logic in parent), parent should maybe pass the custom text?
    // The prop `value` is the ID. 
    // If the parent is in "NEW" mode, `value` might be 'NEW' or the actual text.
    // Let's assume parent manages the display via `value` being the ID for existing, 
    // OR if it's a new item, maybe we need a `displayValue` prop?
    // Actually, looking at page.tsx:
    // value={newDevice.locationId === 'NEW' ? newDevice.newLocationName : newDevice.locationId}
    // So `value` passed here IS the text if it's new (and not in options ID list).

    const displayValue = selectedOption ? selectedOption.label : (value || '')

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Trigger Area */}
            <div
                onClick={() => {
                    setIsOpen(!isOpen)
                    if (!isOpen) {
                        setTimeout(() => inputRef.current?.focus(), 10)
                    }
                }}
                className={`
                    w-full px-3 py-2 border rounded-lg cursor-pointer flex items-center justify-between
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    focus-within:ring-2 focus-within:ring-blue-500
                    ${isOpen ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300 dark:border-gray-600'}
                `}
            >
                {isOpen ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-sm placeholder-gray-400"
                        placeholder="Ara veya ekle..."
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                // If exact match, select it
                                const exactMatch = filteredOptions.find(o => o.label.toLowerCase() === searchTerm.toLowerCase())
                                if (exactMatch) {
                                    handleSelect(exactMatch.value)
                                } else {
                                    handleCreate()
                                }
                            }
                        }}
                    />
                ) : (
                    <span className={`text-sm ${!displayValue ? 'text-gray-400' : ''} truncate`}>
                        {displayValue || placeholder}
                    </span>
                )}
                <ChevronsUpDown className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-100">
                    <ul className="py-1">
                        {/* Filtered Options */}
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <li
                                    key={opt.value}
                                    onClick={() => handleSelect(opt.value)}
                                    className={`
                                        px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between
                                        ${value === opt.value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
                                    `}
                                >
                                    <span>{opt.label}</span>
                                    {value === opt.value && <Check className="h-4 w-4" />}
                                </li>
                            ))
                        ) : (
                            <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center italic">
                                Sonuç bulunamadı
                            </li>
                        )}

                        {/* Create New Option */}
                        {searchTerm.trim() && !filteredOptions.some(o => o.label.toLowerCase() === searchTerm.trim().toLowerCase()) && (
                            <li
                                onClick={handleCreate}
                                className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="font-semibold">"{searchTerm}" ekle</span>
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    )
}
