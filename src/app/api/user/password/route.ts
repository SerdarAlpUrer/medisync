import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { validatePassword, passwordSchema } from '@/lib/password-policy'
import { errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { handleError } from '@/lib/errors'

export async function PUT(request: Request) {
    const session = await getServerSession()

    if (!session || !session.user?.email) {
        return errorResponse('Unauthorized', 401, 'AUTHENTICATION_ERROR')
    }

    try {
        const body = await request.json()
        const { currentPassword, newPassword } = body

        if (!currentPassword || !newPassword) {
            return errorResponse('Mevcut ve yeni şifre gereklidir', 400, 'VALIDATION_ERROR')
        }

        // Validate new password strength
        const userValidationData = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { email: true, name: true }
        })

        const passwordValidation = validatePassword(newPassword, {
            email: userValidationData?.email,
            name: userValidationData?.name,
        })

        if (!passwordValidation.valid) {
            return errorResponse(
                passwordValidation.errors.join(', '),
                400,
                'VALIDATION_ERROR',
                { errors: passwordValidation.errors }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return errorResponse('Kullanıcı bulunamadı', 404, 'NOT_FOUND')
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password)

        if (!isValid) {
            return errorResponse('Mevcut şifre hatalı', 400, 'VALIDATION_ERROR')
        }

        // Check if new password is same as current
        const isSamePassword = await bcrypt.compare(newPassword, user.password)
        if (isSamePassword) {
            return errorResponse('Yeni şifre mevcut şifre ile aynı olamaz', 400, 'VALIDATION_ERROR')
        }

        // Hash new password with higher rounds for better security
        const hashedPassword = await bcrypt.hash(newPassword, 12)

        // Update user
        await prisma.user.update({
            where: { email: session.user.email },
            data: { password: hashedPassword }
        })

        logger.info('Password updated successfully', { userId: user.id })
        return NextResponse.json({
            success: true,
            message: 'Şifre başarıyla güncellendi'
        })

    } catch (error) {
        logger.error('Password update error', error as Error)
        const errorInfo = handleError(error)
        return errorResponse(errorInfo.message, errorInfo.statusCode, errorInfo.code)
    }
}
