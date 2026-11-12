"use client"

import React, { useState } from 'react'
import { useLicense } from '@/contexts/LicenseContext'
import { Key, Send, Copy, Check, ShieldCheck, AlertCircle, Loader2, Hospital, User, Phone, ExternalLink } from 'lucide-react'

export function LicenseModal() {
    const { isActive, isLoading, deviceFingerprint, checkLicense } = useLicense()

    const [copied, setCopied] = useState(false)
    const [activationKey, setActivationKey] = useState('')
    const [isActivating, setIsActivating] = useState(false)
    const [activateError, setActivateError] = useState('')
    const [activateSuccess, setActivateSuccess] = useState('')

    // Telegram Request Form State
    const [hospitalName, setHospitalName] = useState('')
    const [contactName, setContactName] = useState('')
    const [contactPhone, setContactPhone] = useState('')
    const [isRequesting, setIsRequesting] = useState(false)
    const [requestSuccess, setRequestSuccess] = useState('')
    const [requestError, setRequestError] = useState('')

    // If loading or already active, do not render modal
    if (isLoading || isActive) {
        return null
    }

    const copyHwid = () => {
        if (deviceFingerprint) {
            navigator.clipboard.writeText(deviceFingerprint)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleSendTelegramRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        setRequestError('')
        setRequestSuccess('')
        setIsRequesting(true)

        try {
            const res = await fetch('/api/license/request-activation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    machineId: deviceFingerprint,
                    hospitalName,
                    contactName,
                    contactPhone
                })
            })

            const data = await res.json()
            if (res.ok && data.success) {
                setRequestSuccess('Aktivasyon talebiniz geliştiriciye Telegram üzerinden iletildi! Kod tarafınıza ulaştığında aşağıdaki alana girerek sistemi başlatabilirsiniz.')
            } else {
                setRequestError(data.message || 'Telegram bildirimi gönderilemedi. Lütfen doğrudan Telegram linkini kullanın.')
            }
        } catch (err: any) {
            setRequestError('İstek gönderilemedi: ' + (err.message || 'Bağlantı hatası'))
        } finally {
            setIsRequesting(false)
        }
    }

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activationKey.trim()) return

        setActivateError('')
        setActivateSuccess('')
        setIsActivating(true)

        try {
            const res = await fetch('/api/license/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ licenseKey: activationKey.trim() })
            })

            const data = await res.json()
            if (res.ok && data.success) {
                setActivateSuccess('Tebrikler! Kurulumunuz başarıyla aktive edildi.')
                setTimeout(async () => {
                    await checkLicense()
                    window.location.reload()
                }, 1000)
            } else {
                setActivateError(data.message || 'Aktivasyon kodu geçersiz!')
            }
        } catch (err: any) {
            setActivateError('Aktivasyon hatası: ' + (err.message || 'Sunucu hatası'))
        } finally {
            setIsActivating(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[99999] p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-gray-700 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white text-center relative">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner backdrop-blur-sm border border-white/20">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">MediSync Kurulum & Kullanım Onayı</h2>
                    <p className="text-xs text-blue-100 mt-1 max-w-sm mx-auto">
                        Bu açık kaynak kurulumu kullanmaya başlamak için geliştiriciden bir defaya mahsus aktivasyon onay kodu almanız gerekmektedir.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Machine Hardware ID Display */}
                    <div className="bg-gray-50 dark:bg-gray-900/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                            <span>Bu Cihazın Donanım Kodu (HWID):</span>
                            {copied && <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Kopyalandı</span>}
                        </div>
                        <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
                            <span className="font-mono text-lg font-black text-blue-600 dark:text-blue-400 tracking-widest">
                                {deviceFingerprint || 'YÜKLENİYOR...'}
                            </span>
                            <button
                                type="button"
                                onClick={copyHwid}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Kopyala</span>
                            </button>
                        </div>
                    </div>

                    {/* Step 1: Request Code via Telegram */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                <Send className="w-4 h-4 text-blue-600" />
                                1. Telegram ile Aktivasyon Kodu Talep Et
                            </h3>
                            <a
                                href="https://t.me/SerdarAlpUrer"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                            >
                                <span>Doğrudan İletişim</span>
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>

                        {requestSuccess && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-xs leading-relaxed">
                                {requestSuccess}
                            </div>
                        )}

                        {requestError && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-xs">
                                {requestError}
                            </div>
                        )}

                        <form onSubmit={handleSendTelegramRequest} className="space-y-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <input
                                        type="text"
                                        required
                                        value={hospitalName}
                                        onChange={(e) => setHospitalName(e.target.value)}
                                        placeholder="Kurum / Hastane Adı"
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        required
                                        value={contactName}
                                        onChange={(e) => setContactName(e.target.value)}
                                        placeholder="Yetkili Adı Soyadı"
                                        className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    placeholder="İletişim Telefon / Telegram (Örn: 05xx xxx xx xx)"
                                    className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="submit"
                                    disabled={isRequesting}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                                >
                                    {isRequesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                    <span>Kodu Talep Et</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700"></div>

                    {/* Step 2: Enter Key */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                            <Key className="w-4 h-4 text-emerald-600" />
                            2. Aktivasyon Anahtarını Girin
                        </h3>

                        {activateError && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-xs">
                                {activateError}
                            </div>
                        )}

                        {activateSuccess && (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold">
                                {activateSuccess}
                            </div>
                        )}

                        <form onSubmit={handleActivate} className="space-y-2.5">
                            <input
                                type="text"
                                required
                                value={activationKey}
                                onChange={(e) => setActivationKey(e.target.value)}
                                placeholder="Örn: MEDISYNC-ACTIVE-BE7DF55A-XXXXXXXX"
                                className="w-full text-xs font-mono px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 uppercase"
                            />
                            <button
                                type="submit"
                                disabled={isActivating || !activationKey.trim()}
                                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isActivating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                <span>Sistemi Aktive Et ve Kullanıma Başla</span>
                            </button>
                        </form>
                    </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-200 dark:border-gray-700 text-center text-[11px] text-gray-500 dark:text-gray-400">
                    MediSync Biyomedikal Yönetim Sistemi &copy; 2026 Serdar Alp Ürer
                </div>
            </div>
        </div>
    )
}
