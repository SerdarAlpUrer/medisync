'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  QrCode,
  Search,
  ArrowRight,
  AlertCircle,
  Loader2,
  Camera,
  Shield,
  ArrowLeft,
  Activity
} from 'lucide-react'

export default function ScanLandingPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) {
      setError('Lütfen bir künye no, barkod veya seri numarası girin.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Clean query if full URL was scanned
      let cleanQuery = trimmed
      if (trimmed.includes('/scan/')) {
        const parts = trimmed.split('/scan/')
        if (parts[1]) {
          router.push(`/scan/${parts[1]}`)
          return
        }
      }

      const res = await fetch(`/api/public/device-lookup?query=${encodeURIComponent(cleanQuery)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.id) {
          router.push(`/scan/${data.id}`)
          return
        }
      }
      setError('Cihaz bulunamadı. Lütfen künye, barkod veya seri numarasını kontrol edin.')
    } catch (err) {
      setError('Bağlantı hatası oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col justify-between p-4 sm:p-6">
      {/* Üst Bar */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between pb-6 border-b border-gray-700/60">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Dashboard'a Dön
        </Link>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span className="font-semibold text-sm tracking-wide text-gray-200">MediSync Passport</span>
        </div>
      </div>

      {/* Ana Gövde */}
      <div className="max-w-md mx-auto w-full py-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto text-blue-400 shadow-lg shadow-blue-500/10">
            <QrCode className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-cyan-300 to-white bg-clip-text text-transparent">
            Cihaz Pasaportu Sorgula
          </h1>
          <p className="text-sm text-gray-400">
            Cihazın üzerindeki QR kodu okutun veya künye / barkod / seri numarasını girin.
          </p>
        </div>

        {/* Sorgulama Formu */}
        <form onSubmit={handleLookup} className="space-y-4 bg-gray-800/60 border border-gray-700/70 p-6 rounded-2xl shadow-xl backdrop-blur-md">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Künye No / Barkod / Seri No
            </label>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  if (error) setError('')
                }}
                placeholder="Örn: KUNYE-2026-0001 veya SN-VENT-99881"
                className="w-full pl-4 pr-11 py-3 bg-gray-900/90 border border-gray-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-xl text-white placeholder-gray-500 text-sm transition-all outline-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-40 disabled:hover:from-blue-600 disabled:hover:to-cyan-600 text-white rounded-lg transition-all"
                title="Sorgula"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sorgulanıyor...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Cihaz Pasaportunu Getir
              </>
            )}
          </button>
        </form>

        {/* Hızlı Kısayollar & Bilgilendirme */}
        <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-4 text-xs space-y-2 text-gray-400">
          <div className="flex items-center gap-2 text-gray-300 font-medium">
            <Shield className="w-4 h-4 text-green-400" />
            TİTCK & SKS Uyumlu Dijital Pasaport
          </div>
          <p>
            Cihaz pasaportu üzerinden teknik kullanım kılavuzunu, acil servis talimatlarını inceleyebilir ve tek tıkla arıza kaydı açabilirsiniz.
          </p>
        </div>
      </div>

      {/* Alt Bilgi */}
      <div className="max-w-2xl mx-auto w-full pt-6 border-t border-gray-700/60 text-center text-xs text-gray-500">
        <p>© 2026 MediSync. FDA 21 CFR Part 11 & TİTCK Standartları.</p>
      </div>
    </div>
  )
}
