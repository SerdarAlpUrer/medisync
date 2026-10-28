'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
    Building2,
    User,
    Mail,
    Lock,
    Phone,
    MapPin,
    Loader2,
    AlertCircle,
    CheckCircle2,
    ShieldCheck,
    Check
} from 'lucide-react'

export default function RegisterPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        hospitalName: '',
        adminName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        city: 'İstanbul'
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (formData.password !== formData.confirmPassword) {
            setError('Şifreler birbiriyle eşleşmiyor.')
            return
        }

        if (formData.password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.')
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hospitalName: formData.hospitalName,
                    adminName: formData.adminName,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    city: formData.city
                })
            })

            const data = await res.json()

            if (!res.ok || !data.success) {
                setError(data.error || 'Kayıt sırasında bir hata oluştu.')
                setLoading(false)
                return
            }

            setSuccess(true)
            setTimeout(() => {
                router.push(`/login?email=${encodeURIComponent(formData.email)}&registered=true`)
            }, 1800)

        } catch (err: any) {
            setError('Sunucu bağlantı hatası. Lütfen tekrar deneyin.')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900 text-white p-4 py-12">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 -left-10 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-20 -right-10 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-10 left-1/3 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="w-full max-w-xl relative z-10">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-10">
                    <div className="text-center mb-8">
                        <div className="relative w-16 h-16 mx-auto mb-4">
                            <Image
                                src="/logo.png"
                                alt="MediSync Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-cyan-200">
                            Yeni Kurum Kaydı (SaaS Onboarding)
                        </h1>
                        <p className="text-gray-400 text-sm mt-1.5">
                            Hastaneler ve Klinikler için Biyomedikal Yönetim Çalışma Alanı
                        </p>
                    </div>

                    {success ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center space-y-3">
                            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                            <h3 className="text-lg font-bold text-emerald-200">Kurumunuz Başarıyla Oluşturuldu!</h3>
                            <p className="text-sm text-gray-300">
                                Çalışma alanınız hazırlandı. Giriş ekranına yönlendiriliyorsunuz...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-sm text-red-200">
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Kurum Bilgileri */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-xs font-medium text-gray-300 ml-1">Hastane / Kurum Adı *</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Building2 className="h-4 w-4 text-gray-500 group-focus-within:text-blue-400" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={formData.hospitalName}
                                            onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                                            placeholder="Örn: Kadıköy Tıp Merkezi"
                                            className="block w-full pl-9 pr-3 py-2 bg-gray-800/60 border border-gray-700/60 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-300 ml-1">Şehir</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <MapPin className="h-4 w-4 text-gray-500 group-focus-within:text-blue-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            placeholder="İstanbul"
                                            className="block w-full pl-9 pr-3 py-2 bg-gray-800/60 border border-gray-700/60 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-300 ml-1">Kurum Telefonu</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Phone className="h-4 w-4 text-gray-500 group-focus-within:text-blue-400" />
                                        </div>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="0212 555 0000"
                                            className="block w-full pl-9 pr-3 py-2 bg-gray-800/60 border border-gray-700/60 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Yönetici Bilgileri */}
                            <div className="border-t border-gray-700/50 pt-4 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-300 ml-1">Yönetici Ad Soyad *</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-4 w-4 text-gray-500 group-focus-within:text-blue-400" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={formData.adminName}
                                            onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                            placeholder="Ahmet Yılmaz"
                                            className="block w-full pl-9 pr-3 py-2 bg-gray-800/60 border border-gray-700/60 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-300 ml-1">Yönetici E-posta (Giriş İçin) *</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-4 w-4 text-gray-500 group-focus-within:text-blue-400" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="yonetici@hastane.com"
                                            className="block w-full pl-9 pr-3 py-2 bg-gray-800/60 border border-gray-700/60 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-300 ml-1">Şifre *</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-4 w-4 text-gray-500 group-focus-within:text-blue-400" />
                                            </div>
                                            <input
                                                type="password"
                                                required
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                placeholder="En az 6 karakter"
                                                className="block w-full pl-9 pr-3 py-2 bg-gray-800/60 border border-gray-700/60 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-300 ml-1">Şifre Tekrar *</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-4 w-4 text-gray-500 group-focus-within:text-blue-400" />
                                            </div>
                                            <input
                                                type="password"
                                                required
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                placeholder="Şifreyi onaylayın"
                                                className="block w-full pl-9 pr-3 py-2 bg-gray-800/60 border border-gray-700/60 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Avantaj Rozetleri */}
                            <div className="grid grid-cols-3 gap-2 py-2 text-center text-[11px] text-gray-400">
                                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                    <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                                    TİTCK & ÜTS Uyumlu
                                </div>
                                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                    <Check className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                                    FDA 21 CFR Part 11
                                </div>
                                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                    <Building2 className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                                    Çoklu Şube & Depo
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/20 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:opacity-50 transition-all"
                            >
                                {loading ? (
                                    <div className="flex items-center space-x-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Kurum Alanı Hazırlanıyor...</span>
                                    </div>
                                ) : (
                                    "Kurum Hesabı Oluştur ve Başla"
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-700/50 pt-4">
                        Zaten bir hesabınız var mı?{' '}
                        <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                            Giriş Yap
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
