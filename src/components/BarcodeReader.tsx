'use client'

import { useState, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { QrCode, X, Camera } from 'lucide-react'

interface BarcodeReaderProps {
    onScan: (result: string) => void
    onClose: () => void
}

export default function BarcodeReader({ onScan, onClose }: BarcodeReaderProps) {
    const [scanning, setScanning] = useState(false)
    const [manualInput, setManualInput] = useState('')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let scanner: Html5Qrcode | null = null

        const startScanning = async () => {
            try {
                scanner = new Html5Qrcode('barcode-reader')

                await scanner.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                    },
                    (decodedText) => {
                        onScan(decodedText)
                        stopScanning()
                    },
                    (errorMessage) => {
                        // Ignore scanning errors (continuous scanning)
                    }
                )

                setScanning(true)
                setError(null)
            } catch (err) {
                console.error('Error starting scanner:', err)
                setError('Kamera erişimi reddedildi veya kamera bulunamadı')
                setScanning(false)
            }
        }

        const stopScanning = () => {
            if (scanner) {
                scanner.stop().then(() => {
                    scanner?.clear()
                }).catch(console.error)
            }
            setScanning(false)
        }

        // Start scanning when component mounts
        startScanning()

        return () => {
            stopScanning()
        }
    }, [onScan])

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (manualInput.trim()) {
            onScan(manualInput.trim())
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <QrCode className="h-6 w-6 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Barkod/QR Kod Okuyucu</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-6 w-6 text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Camera Scanner */}
                    <div className="mb-6">
                        <div className="bg-gray-900 rounded-lg overflow-hidden">
                            <div id="barcode-reader" className="w-full" />
                            {!scanning && !error && (
                                <div className="flex items-center justify-center h-64 text-white">
                                    <div className="text-center">
                                        <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>Kamera başlatılıyor...</p>
                                    </div>
                                </div>
                            )}
                            {error && (
                                <div className="flex items-center justify-center h-64 text-white">
                                    <div className="text-center">
                                        <Camera className="h-12 w-12 mx-auto mb-3 text-red-400" />
                                        <p className="text-red-400">{error}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {scanning && (
                            <p className="text-center text-sm text-gray-600 mt-3">
                                Barkod veya QR kodu kameraya tutun
                            </p>
                        )}
                    </div>

                    {/* Manual Input */}
                    <div className="border-t border-gray-200 pt-6">
                        <p className="text-sm font-semibold text-gray-700 mb-3">
                            veya Manuel Giriş:
                        </p>
                        <form onSubmit={handleManualSubmit} className="flex space-x-2">
                            <input
                                type="text"
                                value={manualInput}
                                onChange={(e) => setManualInput(e.target.value)}
                                placeholder="Barkod veya seri numarasını girin..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                type="submit"
                                disabled={!manualInput.trim()}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                Ara
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
