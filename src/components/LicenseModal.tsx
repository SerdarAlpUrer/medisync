"use client"

import { useState } from "react"
import { useLicense } from "@/contexts/LicenseContext"
import { Lock, Key, CheckCircle, AlertOctagon } from "lucide-react"

export function LicenseModal() {
    const { isExpired, checkLicense, isActive, deviceFingerprint } = useLicense()
    const [key, setKey] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    // Sadece süre dolduysa veya pasife alındıysa göster
    if (!isExpired && isActive) return null

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        setSuccess(false)

        try {
            const res = await fetch('/api/license/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ licenseKey: key })
            })

            const data = await res.json()

            if (data.success) {
                setSuccess(true)
                await checkLicense() // Durumu güncelle
                // Modal otomatik kapanacak çünkü isActive=true olacak
            } else {
                setError(data.message || "Aktivasyon başarısız")
            }
        } catch (err) {
            setError("Sunucuya bağlanılamadı")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                <div className="bg-red-600 p-6 text-white text-center">
                    <Lock className="h-12 w-12 mx-auto mb-4 opacity-90" />
                    <h2 className="text-2xl font-bold">Lisans Süresi Doldu</h2>
                    <p className="opacity-90 mt-2">MediSync'i kullanmaya devam etmek için lütfen lisans anahtarı girin.</p>
                </div>

                <div className="p-8">
                    {success ? (
                        <div className="text-center text-green-600 py-8">
                            <CheckCircle className="h-16 w-16 mx-auto mb-4" />
                            <h3 className="text-xl font-bold">Aktivasyon Başarılı!</h3>
                            <p className="text-gray-600 mt-2">Yönlendiriliyorsunuz...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleActivate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lisans Anahtarı</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={key}
                                        onChange={(e) => setKey(e.target.value)}
                                        placeholder="MEDISYNC-XXXX-XXXX-..."
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all font-mono text-sm uppercase"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                                    <AlertOctagon className="h-4 w-4" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !key}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? "Doğrulanıyor..." : "Lisansı Etkinleştir"}
                            </button>

                            <div className="text-center text-xs text-gray-500 mt-4">
                                <p>Destek için: destek@medisync.com</p>
                                <p>Cihaz Kodu: <span className="font-mono font-bold select-all bg-gray-100 px-1 rounded">{deviceFingerprint || 'Yükleniyor...'}</span></p>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
