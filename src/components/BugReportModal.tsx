'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Bug, X, Send, Image as ImageIcon, CheckCircle2,
  AlertCircle, Loader2, Sparkles, HelpCircle, Monitor,
  ChevronDown, ChevronUp, Trash2
} from 'lucide-react'
import { useToast } from '@/components/ToastProvider'
import { useSession } from 'next-auth/react'

interface BugReportModalProps {
  isOpen?: boolean
  onClose?: () => void
  initialData?: {
    title?: string
    description?: string
    technicalDetails?: string
    pageUrl?: string
    severity?: string
    category?: string
  }
}

export function BugReportModal({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  initialData
}: BugReportModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isModalOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose()
    } else {
      setInternalIsOpen(false)
    }
  }

  const { data: session } = useSession()
  const { showSuccess, showError } = useToast()

  const [category, setCategory] = useState(initialData?.category || 'BUG')
  const [severity, setSeverity] = useState(initialData?.severity || 'MEDIUM')
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [showTechDetails, setShowTechDetails] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [techInfo, setTechInfo] = useState<any>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Listen for global open-bug-report custom event (e.g. from ErrorBoundary)
  useEffect(() => {
    const handleGlobalOpen = (e: any) => {
      const detail = e.detail || {}
      if (detail.title) setTitle(detail.title)
      if (detail.description) setDescription(detail.description)
      if (detail.severity) setSeverity(detail.severity)
      if (detail.category) setCategory(detail.category)
      setInternalIsOpen(true)
    }

    window.addEventListener('open-bug-report', handleGlobalOpen)
    return () => window.removeEventListener('open-bug-report', handleGlobalOpen)
  }, [])

  // Populate technical details on open
  useEffect(() => {
    if (isModalOpen && typeof window !== 'undefined') {
      setTechInfo({
        url: window.location.href,
        pathname: window.location.pathname,
        userAgent: navigator.userAgent,
        screen: `${window.innerWidth}x${window.innerHeight}`,
        time: new Date().toISOString()
      })
    }
  }, [isModalOpen])

  // Support Ctrl+V to paste screenshot directly from clipboard
  useEffect(() => {
    if (!isModalOpen) return

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            const reader = new FileReader()
            reader.onload = (loadEvent) => {
              setScreenshot(loadEvent.target?.result as string)
              showSuccess('Ekran görüntüsü panodan yapıştırıldı!')
            }
            reader.readAsDataURL(file)
            e.preventDefault()
            break
          }
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [isModalOpen, showSuccess])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      showError('Görsel boyutu 5 MB\'tan küçük olmalıdır.')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      setScreenshot(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      showError('Lütfen hata başlığı ve açıklamasını girin.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        pageUrl: techInfo.pathname || (typeof window !== 'undefined' ? window.location.pathname : ''),
        screenshotUrl: screenshot,
        technicalDetails: JSON.stringify(techInfo, null, 2),
        userEmail: session?.user?.email || '',
        userName: session?.user?.name || ''
      }

      const res = await fetch('/api/bug-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (res.ok && data.success) {
        showSuccess('Hata bildiriminiz iletildi! Teşekkür ederiz.')
        setTitle('')
        setDescription('')
        setScreenshot(null)
        handleClose()
      } else {
        showError(data.error || 'Bildirim iletilemedi.')
      }
    } catch {
      showError('Sunucu ile iletişim kurulamadı.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating Support & Bug Report Trigger Button (Always visible on dashboard) */}
      {!controlledIsOpen && (
        <button
          type="button"
          onClick={() => setInternalIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center space-x-2 px-3.5 py-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 group border border-slate-700/60 active:scale-95 print:hidden"
          title="Yazılım Hatası veya Destek Talebi Bildir"
        >
          <Bug className="w-4 h-4 text-rose-400 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-semibold tracking-wide pr-1">Sorun / Hata Bildir</span>
        </button>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 font-sans">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                  <Bug className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">Yazılım Hatası & Sorun Bildir</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Bildiriminiz anında geliştiriciye (Telegram & E-posta) ulaşacaktır.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Category & Severity Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sorun Türü
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BUG">🐛 Yazılım Hatası (Hata Verdi)</option>
                    <option value="UI">🎨 Ekran / Görsel Bozukluk</option>
                    <option value="PERFORMANCE">⚡ Yavaşlık / Donma</option>
                    <option value="FEATURE">💡 Yeni İstek / Öneri</option>
                    <option value="OTHER">❓ Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Aciliyet Derecesi
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="LOW">🟢 Düşük (Kozmetik / Önemsiz)</option>
                    <option value="MEDIUM">🟡 Normal (İşlemi engellemiyor)</option>
                    <option value="HIGH">🟠 Yüksek (İşlem yapılamıyor)</option>
                    <option value="CRITICAL">🔴 Kritik (Sistem Kilitlendi)</option>
                  </select>
                </div>
              </div>

              {/* Hata Başlığı */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kısa Başlık <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Cihaz Excel'i yüklerken tarih hatası veriyor"
                  required
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Detaylı Açıklama */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Detaylı Açıklama <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Hata nasıl meydana geldi? Hangi butona tıkladınız? Ekranda ne yazdı?"
                  required
                  className="w-full text-xs px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Ekran Görüntüsü Yükleme / Ctrl+V */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ekran Görüntüsü (İsteğe Bağlı)
                </label>
                {screenshot ? (
                  <div className="relative border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden p-2 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                    <img
                      src={screenshot}
                      alt="Ekran Görüntüsü"
                      className="max-h-24 max-w-[200px] object-contain rounded border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => setScreenshot(null)}
                      className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Kaldır</span>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <ImageIcon className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                    <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Görsel Yüklemek İçin Tıklayın veya <strong>Ctrl + V</strong> ile Yapıştırın
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WebP (Maks. 5 MB)</p>
                  </div>
                )}
              </div>

              {/* Katlanabilir Teknik Bilgiler */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowTechDetails(!showTechDetails)}
                  className="w-full px-3 py-2 text-left bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400"
                >
                  <span className="flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Otomatik Algılanan Sistem Bilgileri</span>
                  </span>
                  {showTechDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showTechDetails && (
                  <div className="p-2.5 bg-slate-900 text-slate-300 font-mono text-[10px] space-y-1 overflow-x-auto">
                    <div><strong>Sayfa:</strong> {techInfo.pathname || '-'}</div>
                    <div><strong>Çözünürlük:</strong> {techInfo.screen || '-'}</div>
                    <div className="truncate"><strong>Tarayıcı:</strong> {techInfo.userAgent || '-'}</div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>İletiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Geliştiriciye Gönder</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
