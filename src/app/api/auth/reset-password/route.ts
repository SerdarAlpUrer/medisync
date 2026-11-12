import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { validatePassword } from '@/lib/password-policy'
import crypto from 'crypto'
import * as bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { token, email, newPassword } = body

        if (!token || !email || !newPassword) {
            return errorResponse('Tüm alanlar gereklidir', 400, 'VALIDATION_ERROR')
        }

        // Validate password strength first
        const passwordValidation = validatePassword(newPassword, { email })
        if (!passwordValidation.valid) {
            return errorResponse(
                passwordValidation.errors.join(', '),
                400,
                'VALIDATION_ERROR',
                { errors: passwordValidation.errors }
            )
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user || !user.resetToken || !user.resetTokenExpiry) {
            return errorResponse('Geçersiz veya süresi dolmuş bağlantı', 400, 'INVALID_TOKEN')
        }

        // Verify token hash
        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex')

        // Constant time comparison to prevent timing attacks
        const isTokenValid = crypto.timingSafeEqual(
            Buffer.from(tokenHash),
            Buffer.from(user.resetToken)
        )

        if (!isTokenValid) {
            return errorResponse('Geçersiz veya süresi dolmuş bağlantı', 400, 'INVALID_TOKEN')
        }

        // Check expiry
        if (new Date() > user.resetTokenExpiry) {
            return errorResponse('Bağlantının süresi dolmuş', 400, 'EXPIRED_TOKEN')
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12)

        // Update user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        })

        logger.info(`Password reset successfully for ${email}`)

        return NextResponse.json({
            success: true,
            message: 'Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.'
        })

    } catch (error) {
        logger.error('Error in reset-password', error as Error)
        return errorResponse('Bir hata oluştu', 500, 'INTERNAL_SERVER_ERROR')
    }
}
