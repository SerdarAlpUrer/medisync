'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
    Activity,
    ShieldCheck,
    BarChart3,
    ArrowRight,
    Cpu
} from 'lucide-react'

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-900 text-white overflow-hidden selection:bg-blue-500 selection:text-white">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
                <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse-slow delay-2000"></div>
            </div>

            {/* Navbar */}
            <nav className="relative z-50 border-b border-white/10 backdrop-blur-md bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <div className="flex items-center space-x-3">
                            <div className="relative h-10 w-10 overflow-hidden rounded-xl shadow-lg shadow-blue-500/20">
                                <Image
                                    src="/logo.png"
                                    alt="MediSync Logo"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                    MediSync
                                </h1>
                                <p className="text-[10px] text-gray-400 font-medium tracking-wider">ENTERPRISE</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-6">
                            <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                                Destek
                            </Link>
                            <Link
                                href="/login"
                                className="group relative px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-full font-medium text-sm transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]"
                            >
                                <span className="relative z-10 flex items-center space-x-2">
                                    <span>Giriş Yap</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
                    <div className="text-center space-y-8 animate-fadeIn">
                        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
                            <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
                            <span className="text-sm text-blue-200 font-medium tracking-wide">Version 1.5 Yayında</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                            <span className="block text-white mb-2">Tıbbi Cihaz Yönetiminde</span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-teal-400 to-indigo-400">
                                Geleceğin Teknolojisi
                            </span>
                        </h1>

                        <p className="max-w-2xl mx-auto text-xl text-gray-400 leading-relaxed">
                            Biyomedikal süreçlerinizi yapay zeka destekli analizler, QR kod entegrasyonu ve
                            bulut tabanlı takip sistemi ile modernleştirin.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 pt-8">
                            <Link
                                href="/login"
                                className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-xl shadow-white/10 hover:shadow-white/20 hover:-translate-y-1"
                            >
                                Hemen Başla
                            </Link>
                            <Link
                                href="/dashboard"
                                className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-lg hover:bg-white/10 backdrop-blur-md transition-all duration-300 hover:-translate-y-1"
                            >
                                Canlı Demo
                            </Link>
                        </div>
                    </div>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32">
                        {[
                            {
                                icon: Activity,
                                title: "Akıllı Takip",
                                desc: "Cihazlarınızın bakım, kalibrasyon ve arıza durumlarını gerçek zamanlı izleyin.",
                                color: "blue"
                            },
                            {
                                icon: ShieldCheck,
                                title: "Tam Uyumluluk",
                                desc: "Sağlık Bakanlığı ve uluslararası kalite standartlarına %100 uyumlu raporlama.",
                                color: "teal"
                            },
                            {
                                icon: Cpu,
                                title: "IoT Entegrasyonu",
                                desc: "Modern tıbbi cihazlarla doğrudan iletişim kurarak otomatik veri toplama.",
                                color: "indigo"
                            }
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className="group p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-${feature.color}-500/20 to-${feature.color}-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-${feature.color}-500/30`}>
                                    <feature.icon className={`w-7 h-7 text-${feature.color}-400`} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="relative z-10 border-t border-white/5 bg-gray-900/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center space-x-3 opacity-70 hover:opacity-100 transition-opacity">
                        <div className="relative h-8 w-8 overflow-hidden rounded-lg grayscale hover:grayscale-0 transition-all">
                            <Image
                                src="/logo.png"
                                alt="MediSync Logo"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <span className="text-sm font-semibold text-gray-300">MediSync Systems Inc.</span>
                    </div>
                    <p className="text-gray-500 text-sm">
                        © 2026 MediSync. Tüm hakları saklıdır.
                    </p>
                </div>
            </footer>
        </div>
    )
}
