'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { QrCode, X, Camera, Lock, Image as ImageIcon, Loader2, AlertTriangle } from 'lucide-react'

interface BarcodeReaderProps {
    onScan: (result: string) => void
    onClose: () => void
}

export default function BarcodeReader({ onScan, onClose }: BarcodeReaderProps) {
    const [scanning, setScanning] = useState(false)
    const [manualInput, setManualInput] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isHttpsRequired, setIsHttpsRequired] = useState(false)
    const [scanningFile, setScanningFile] = useState(false)
    const onScanRef = useRef(onScan)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        onScanRef.current = onScan
    }, [onScan])

    useEffect(() => {
        let scanner: Html5Qrcode | null = null
        let isRunning = false
        let isMounted = true

        const safeStop = async () => {
            const currentScanner = scanner
            scanner = null
            if (currentScanner && isRunning) {
                isRunning = false
                try {
                    await currentScanner.stop()
                } catch {
                    // Ignore stop error
                }
                try {
                    currentScanner.clear()
                } catch {
                    // Ignore clear error
                }
            }
            if (isMounted) {
                setScanning(false)
            }
        }

        const startScanning = async () => {
            try {
                // Check if running on an insecure LAN context (e.g. http://192.168.x.x)
                if (typeof window !== 'undefined') {
                    const isSecure = window.isSecureContext
                    const hostname = window.location.hostname
                    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'

                    if (!isSecure && !isLocal) {
                        if (isMounted) {
                            setIsHttpsRequired(true)
                            setError('Mobil cihazlarda ve yerel ağda kamera erişimi için tarayıcılar güvenli HTTPS bağlantısı zorunlu tutar.')
                            setScanning(false)
                        }
                        return
                    }
                }

                // Pre-check if browser supports mediaDevices and has at least one video input camera
                if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                    if (isMounted) {
                        setError('Kamera erişimi desteklenmiyor. Lütfen aşağıdaki butonla fotoğraf yükleyin veya manuel giriş yapın.')
                        setScanning(false)
                    }
                    return
                }

                const devices = await navigator.mediaDevices.enumerateDevices()
                const hasCamera = devices.some(d => d.kind === 'videoinput')
                if (!hasCamera) {
                    if (isMounted) {
                        setError('Kamera bulunamadı. Lütfen aşağıdaki alandan manuel barkod/künye no girişi yapın.')
                        setScanning(false)
                    }
                    return
                }

                if (!isMounted) return
                const element = document.getElementById('barcode-reader')
                if (!element) return

                scanner = new Html5Qrcode('barcode-reader')

                await scanner.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                    },
                    (decodedText) => {
                        onScanRef.current(decodedText)
                        safeStop()
                        onClose()
                    },
                    () => {
                        // Ignore frame scan errors
                    }
                )

                isRunning = true
                if (isMounted) {
                    setScanning(true)
                    setError(null)
                } else {
                    await safeStop()
                }
            } catch (err: any) {
                isRunning = false
                if (isMounted) {
                    const errMsg = err?.message || ''
                    if (errMsg.includes('Permission') || errMsg.includes('denied') || errMsg.includes('NotAllowedError')) {
                        setError('Kamera erişim izni verilmedi. Lütfen tarayıcı ayarlarından kameraya izin verin.')
                    } else {
                        setError('Kamera başlatılamadı. Lütfen fotoğraf yükleyerek okutun veya manuel giriş yapın.')
                    }
                    setScanning(false)
                }
            }
        }

        startScanning()

        return () => {
            isMounted = false
            safeStop()
        }
    }, [onClose])

    const handleSwitchToHttps = () => {
        if (typeof window === 'undefined') return
        const httpsPort = '3443'
        const targetUrl = `https://${window.location.hostname}:${httpsPort}${window.location.pathname}${window.location.search}`
        window.location.href = targetUrl
    }

    const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setScanningFile(true)
        setError(null)

        try {
            const html5QrCode = new Html5Qrcode('barcode-reader-file-temp')
            const decodedText = await html5QrCode.scanFile(file, false)
            try {
                await html5QrCode.clear()
            } catch {
                // Ignore clear error
            }
            onScanRef.current(decodedText)
            onClose()
        } catch (err) {
            setError('Seçilen fotoğrafta geçerli bir barkod veya QR kod bulunamadı. Lütfen daha net bir fotoğraf deneyin.')
        } finally {
            setScanningFile(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (manualInput.trim()) {
            onScanRef.current(manualInput.trim())
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
                {/* Hidden container for image file scanning */}
                <div id="barcode-reader-file-temp" className="hidden" />

                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileScan}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                />

                {/* Header */}
                <div className="flex items-center justify-between p-5 lg:p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 dark:bg-blue-900/40 p-2.5 rounded-xl">
                            <QrCode className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Barkod / QR Kod Okuyucu</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Kamera veya fotoğraftan anında cihaz bulun</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 lg:p-6 space-y-5">
                    {/* Camera Scanner Viewport */}
                    <div>
                        <div className="bg-gray-950 rounded-xl overflow-hidden relative border border-gray-800 shadow-inner">
                            <div id="barcode-reader" className="w-full" />
                            {!scanning && !error && (
                                <div className="flex items-center justify-center h-64 text-white">
                                    <div className="text-center">
                                        <Camera className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
                                        <p className="text-sm text-gray-300">Kamera başlatılıyor...</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="flex flex-col items-center justify-center min-h-[16rem] p-6 text-white text-center space-y-4">
                                    <div className="bg-amber-500/20 p-3 rounded-full text-amber-400">
                                        <AlertTriangle className="h-8 w-8" />
                                    </div>
                                    <div className="max-w-md">
                                        <p className="text-amber-300 text-sm font-medium leading-relaxed">{error}</p>
                                    </div>

                                    {/* Action Buttons for Insecure Context */}
                                    <div className="flex flex-wrap gap-2 justify-center pt-2">
                                        {isHttpsRequired && (
                                            <button
                                                type="button"
                                                onClick={handleSwitchToHttps}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                                            >
                                                <Lock className="h-3.5 w-3.5" />
                                                <span>🔒 HTTPS ile Aç (Port 3443)</span>
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={scanningFile}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm disabled:opacity-50"
                                        >
                                            {scanningFile ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <ImageIcon className="h-3.5 w-3.5" />
                                            )}
                                            <span>Fotoğraftan QR Oku</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {scanning && (
                            <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
                                <span>Barkod veya QR kodu kameraya tutun</span>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 font-medium"
                                >
                                    <ImageIcon className="h-3.5 w-3.5" />
                                    <span>Fotoğraftan Yükle</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Fallback Options: Gallery Upload and Manual Input */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                        {/* Photo/Gallery Fallback Button */}
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl border border-gray-200 dark:border-gray-700/60">
                            <div className="flex items-center space-x-2.5">
                                <ImageIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                <div>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                        Fotoğraf veya Ekran Görüntüsü ile Tara
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                        Kamera çalışmıyorsa galeriden veya kamerayla çekip yükleyin
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={scanningFile}
                                className="px-3.5 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 shrink-0 shadow-sm disabled:opacity-50"
                            >
                                {scanningFile ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        <span>Okunuyor...</span>
                                    </>
                                ) : (
                                    <>
                                        <Camera className="h-3.5 w-3.5" />
                                        <span>Fotoğraf Seç</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Manual Input Form */}
                        <div>
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                veya Manuel Künye / Seri No Girişi:
                            </p>
                            <form onSubmit={handleManualSubmit} className="flex space-x-2">
                                <input
                                    type="text"
                                    value={manualInput}
                                    onChange={(e) => setManualInput(e.target.value)}
                                    placeholder="Barkod, künye (örn: PH2026-0001) veya seri no girin..."
                                    className="flex-1 px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!manualInput.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                                >
                                    Ara
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
