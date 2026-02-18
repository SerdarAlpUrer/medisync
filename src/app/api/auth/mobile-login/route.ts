
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getEnv } from '@/lib/env'

const env = getEnv()
const JWT_SECRET = env.NEXTAUTH_SECRET || 'fallback-secret-change-me'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ error: 'Email ve şifre gereklidir' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user || !user.isActive) {
            return NextResponse.json({ error: 'Geçersiz kullanıcı veya hesap aktif değil' }, { status: 401 })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Hatalı şifre' }, { status: 401 })
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
                hospitalId: user.hospitalId
            },
            JWT_SECRET,
            { expiresIn: '30d' } // Long lived token for mobile
        )

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                hospitalId: user.hospitalId
            }
        })

    } catch (error) {
        console.error('Mobile login error:', error)
        return NextResponse.json({ error: 'Giriş işlemi başarısız' }, { status: 500 })
    }
}
