'use client'

import { Suspense, useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, User, Eye, EyeOff, Loader2, AlertCircle, Wrench, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

function LoginContent() {
    const router = useRouter()
    const { status } = useSession()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Redirect if already authenticated
    useEffect(() => {
        if (status === 'authenticated') {
            router.replace(callbackUrl)
        }
    }, [status, router, callbackUrl])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const result = await signIn('credentials', {
                email: email.trim(),
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('Kullanıcı adı, e-posta veya şifre hatalı')
                setLoading(false)
            } else {
                window.location.href = callbackUrl
            }
        } catch {
            setError('Sunucu ile iletişim kurulamadı. Lütfen tekrar deneyin.')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white">
            <div className="w-full max-w-md">
                {/* Ana Giriş Kartı */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
                    {/* Kurumsal Başlık ve Logo */}
                    <div className="text-center mb-6">
                        <div className="relative w-16 h-16 mx-auto mb-3">
                            <Image
                                src="/logo.png"
                                alt="Kurum Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Tıbbi Cihaz Yönetim Portalı
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                            Klinik Biyomedikal & Metroloji Takip Sistemi
                        </p>
                    </div>

                    {/* Hata Mesajı */}
                    {error && (
                        <div className="mb-5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl p-3 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Giriş Formu */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Kullanıcı Adı veya E-posta
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <User className="h-4 w-4" />
                                </div>
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                    placeholder="kullanıcı adı veya e-posta"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Şifre
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                >
                                    Şifremi unuttum
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                    tabIndex={-1}
                                    title={showPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 flex items-center justify-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/20"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Giriş Yap"
                            )}
                        </button>
                    </form>

                    {/* Hızlı Şifresiz Arıza Bildirimi (Klinik Personeli & Hemşireler İçin) */}
                    <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700">
                        <Link
                            href="/report-fault"
                            className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 rounded-xl transition-all border border-slate-200 dark:border-slate-600"
                        >
                            <Wrench className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span>Klinik Arıza Bildir (Şifresiz)</span>
                        </Link>
                    </div>
                </div>

                {/* Resmi Alt Bilgi */}
                <div className="mt-4 text-center space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <p className="flex items-center justify-center gap-1 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>T.C. Sağlık Bakanlığı SKS ve Biyomedikal Yönetmelik Uyumlu</span>
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        Tüm oturum ve işlemler dijital denetim iziyle kayıt altına alınmaktadır.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 text-sm">Yükleniyor...</div>}>
            <LoginContent />
        </Suspense>
    )
}
