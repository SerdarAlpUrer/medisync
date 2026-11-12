import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

/**
 * Merkezi Erişim Kontrolü
 * - /dashboard/* sayfaları: oturum yoksa /login'e yönlendirir
 * - /api/*: oturum yoksa 401 döner (aşağıdaki herkese açık uç noktalar hariç)
 * - VIEWER rolü: veri değiştiren isteklere (POST/PUT/PATCH/DELETE) 403
 * - Yönetici işlemleri (yedek, geri yükleme, sıfırlama, ayar/kullanıcı/hastane yazma): yalnızca ADMIN
 */

// Oturum gerektirmeyen API'ler (tüm metotlar)
const PUBLIC_API: RegExp[] = [
    /^\/api\/auth(\/|$)/,                       // NextAuth, kayıt, şifre sıfırlama
    /^\/api\/public\//,                          // QR ile arıza bildirimi, cihaz arama, arıza takibi
    /^\/api\/config\/(env|test-db)$/,            // İlk kurulum sihirbazı (rota kendi içinde kurulum modunu denetler)
    /^\/api\/notifications\/push\/vapid-key$/,
    /^\/api\/network-info$/,
    /^\/api\/license\/(check|activate|request-activation)$/,
]

// Oturum gerektirmeyen API'ler (yalnızca GET) — QR tarama sayfası ve arıza bildirim formu için
const PUBLIC_GET_API: RegExp[] = [
    /^\/api\/settings$/,
    /^\/api\/devices\/[^/]+$/,
    /^\/api\/devices\/[^/]+\/usage-instruction$/,
]

// Oturum gerektirmeyen API'ler (yalnızca POST) — Hata bildirim widget'ı ve çökme yakalayıcı için
const PUBLIC_POST_API: RegExp[] = [
    /^\/api\/bug-reports$/,
]

// VIEWER rolünün de yapabileceği yazma işlemleri (kendi profili / bildirimleri)
const VIEWER_WRITE_ALLOWED: RegExp[] = [
    /^\/api\/users\/me$/,
    /^\/api\/users\/change-password$/,
    /^\/api\/user\/password$/,
    /^\/api\/users\/avatar$/,
    /^\/api\/notifications(\/|$)/,
]

// Yalnızca ADMIN (tüm metotlar)
const ADMIN_ONLY_ALL: RegExp[] = [
    /^\/api\/settings\/(backup|restore|reset)$/,
    /^\/api\/license\/reset$/,
    /^\/api\/admin\//,
]

// Yalnızca ADMIN (yazma metotları)
const ADMIN_ONLY_WRITE: RegExp[] = [
    /^\/api\/settings$/,
    /^\/api\/users(\/|$)(?!me$|change-password$|avatar$)/,
    /^\/api\/hospitals(\/|$)/,
    /^\/api\/devices\/bulk-delete$/,
]

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

const matches = (list: RegExp[], path: string) => list.some((r) => r.test(path))

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl
    const method = req.method.toUpperCase()
    const isApi = pathname.startsWith("/api/")

    if (isApi) {
        if (method === "OPTIONS") return NextResponse.next()
        if (matches(PUBLIC_API, pathname)) return NextResponse.next()
        if (method === "GET" && matches(PUBLIC_GET_API, pathname)) return NextResponse.next()
        if (method === "POST" && matches(PUBLIC_POST_API, pathname)) return NextResponse.next()
    }

    // Çift port (HTTP 3000 / HTTPS 3443) ve IP erişiminde hem düz hem de güvenli çerezleri kontrol et
    const token = (await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: false }))
        || (await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: true }))

    if (!token) {
        if (isApi) {
            return NextResponse.json(
                { success: false, error: "Oturum açmanız gerekiyor", code: "UNAUTHORIZED" },
                { status: 401 }
            )
        }
        const loginUrl = new URL("/login", req.url)
        loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search)
        return NextResponse.redirect(loginUrl)
    }

    if (isApi) {
        const role = String((token as any).role || "USER")
        const isWrite = WRITE_METHODS.has(method)

        if (role === "VIEWER" && isWrite && !matches(VIEWER_WRITE_ALLOWED, pathname)) {
            return NextResponse.json(
                { success: false, error: "Görüntüleme hesabıyla değişiklik yapamazsınız", code: "FORBIDDEN" },
                { status: 403 }
            )
        }

        const adminOnly = matches(ADMIN_ONLY_ALL, pathname) || (isWrite && matches(ADMIN_ONLY_WRITE, pathname))
        if (adminOnly && role !== "ADMIN") {
            return NextResponse.json(
                { success: false, error: "Bu işlem için yönetici (ADMIN) yetkisi gereklidir", code: "FORBIDDEN" },
                { status: 403 }
            )
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/dashboard/:path*", "/api/:path*"],
}
