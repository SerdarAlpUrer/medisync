import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import * as bcrypt from "bcryptjs"
import { getEnv } from "@/lib/env"
import { logger } from "@/lib/logger"

const env = getEnv()

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "admin@example.com" },
                password: { label: "Şifre", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    logger.warn('Login attempt with missing credentials')
                    return null
                }

                try {
                    const user = await prisma.user.findUnique({
                        where: {
                            email: credentials.email
                        }
                    })

                    if (!user) {
                        logger.warn('Login attempt with non-existent email', { email: credentials.email })
                        return null
                    }

                    if (!user.isActive) {
                        logger.warn('Login attempt with inactive account', { userId: user.id })
                        return null
                    }

                    // Check account lockout
                    const { isAccountLocked, incrementFailedAttempts, resetFailedAttempts } = await import('@/lib/account-lockout')
                    const lockoutStatus = await isAccountLocked(user.id)

                    if (lockoutStatus.locked) {
                        logger.warn('Login attempt on locked account', {
                            userId: user.id,
                            unlockTime: lockoutStatus.unlockTime,
                        })
                        return null
                    }

                    // Eşleşme kontrolü (bcrypt ile)
                    const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

                    if (!isPasswordValid) {
                        await incrementFailedAttempts(user.id)
                        const remainingAttempts = lockoutStatus.remainingAttempts || 0
                        if (remainingAttempts > 0) {
                            logger.warn('Login attempt with invalid password', {
                                userId: user.id,
                                remainingAttempts: remainingAttempts - 1,
                            })
                        }
                        return null
                    }

                    // Reset failed login attempts on successful login
                    await resetFailedAttempts(user.id)
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            lastLoginAt: new Date(),
                            lastLoginIp: undefined // Could be extracted from request headers
                        }
                    })

                    logger.info('User logged in successfully', { userId: user.id, email: user.email })

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        hospitalId: user.hospitalId
                    }
                } catch (error) {
                    logger.error('Error during authentication', error as Error)
                    return null
                }
            }
        })
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.hospitalId = user.hospitalId
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role
                session.user.hospitalId = token.hospitalId
            }
            return session
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
        updateAge: 2 * 60 * 60, // 2 hours -- Session refreshes if user is active
    },
    secret: env.NEXTAUTH_SECRET,
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === 'production'
                ? `__Secure-next-auth.session-token`
                : `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
}
