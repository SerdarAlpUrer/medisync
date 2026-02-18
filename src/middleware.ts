import { withAuth } from "next-auth/middleware"

export default withAuth({
    callbacks: {
        authorized({ req, token }) {
            // Sadece oturum açmış kullanıcılar dashboard'a erişebilir
            if (req.nextUrl.pathname.startsWith('/dashboard')) {
                return !!token
            }
            return true
        },
    },
})

export const config = {
    matcher: ['/dashboard/:path*']
}
