import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email } = body

        if (!email) {
            return errorResponse('Email adresi gereklidir', 400, 'VALIDATION_ERROR')
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, name: true }
        })

        // Security: Don't reveal if user exists or not
        if (!user) {
            // Simulate delay to prevent timing attacks
            await new Promise(resolve => setTimeout(resolve, 500))
            return NextResponse.json({
                success: true,
                message: 'Eğer bu email adresi sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderilmiştir.'
            })
        }

        // Generate secure token
        const resetToken = crypto.randomBytes(32).toString('hex')
        const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour

        // Save hash of token to database
        const tokenHash = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex')

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: tokenHash,
                resetTokenExpiry
            }
        })

        // In a real app, send email here.
        // For this implementation, we'll log the link for testing purposes.
        const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

        logger.info(`Password reset requested for ${email}. Link: ${resetLink}`)
        console.log(`\n============================================================\nPASSWORD RESET LINK: ${resetLink}\n============================================================\n`)

        return NextResponse.json({
            success: true,
            message: 'Eğer bu email adresi sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderilmiştir.'
        })

    } catch (error) {
        logger.error('Error in forgot-password', error as Error)
        return errorResponse('Bir hata oluştu', 500, 'INTERNAL_SERVER_ERROR')
    }
}
