import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const registerSchema = z.object({
    hospitalName: z.string().min(2, 'Kurum adı en az 2 karakter olmalıdır'),
    hospitalCode: z.string().optional(),
    adminName: z.string().min(2, 'Ad ve soyad en az 2 karakter olmalıdır'),
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
    phone: z.string().optional(),
    city: z.string().optional(),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const validated = registerSchema.parse(body)

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validated.email.toLowerCase().trim() }
        })

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Bu e-posta adresi ile kayıtlı bir kullanıcı zaten mevcut.' },
                { status: 400 }
            )
        }

        // Generate clean hospital code if not provided
        let code = (validated.hospitalCode || validated.hospitalName)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 20)

        if (!code || code.length < 2) {
            code = `hosp-${Math.floor(1000 + Math.random() * 9000)}`
        }

        // Check if hospital code exists, append random if needed
        const existingHospital = await prisma.hospital.findUnique({
            where: { code }
        })

        if (existingHospital) {
            code = `${code}-${Math.floor(100 + Math.random() * 900)}`
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(validated.password, 10)

        // Create tenant hospital & admin user in transaction
        const result = await prisma.$transaction(async (tx) => {
            const hospital = await tx.hospital.create({
                data: {
                    name: validated.hospitalName.trim(),
                    code,
                    city: validated.city || 'İstanbul',
                    phone: validated.phone || null,
                    email: validated.email.toLowerCase().trim(),
                    country: 'TR',
                    isActive: true,
                }
            })

            const user = await tx.user.create({
                data: {
                    name: validated.adminName.trim(),
                    email: validated.email.toLowerCase().trim(),
                    password: hashedPassword,
                    role: 'ADMIN',
                    hospitalId: hospital.id,
                    phone: validated.phone || null,
                    department: 'Yönetim / Biyomedikal',
                    isActive: true,
                }
            })

            // Audit log
            await tx.auditLog.create({
                data: {
                    userId: user.id,
                    userName: user.name,
                    action: 'REGISTER_ORGANIZATION',
                    afterValue: JSON.stringify({
                        hospitalId: hospital.id,
                        hospitalName: hospital.name,
                        hospitalCode: hospital.code,
                        adminEmail: user.email
                    }),
                    entity: 'Hospital',
                    entityId: hospital.id,
                }
            })

            return { hospital, user }
        })

        logger.info('New SaaS organization registered', {
            hospitalId: result.hospital.id,
            hospitalName: result.hospital.name,
            adminEmail: result.user.email
        })

        return NextResponse.json({
            success: true,
            message: 'Kurum ve yönetici hesabı başarıyla oluşturuldu. Giriş yapabilirsiniz.',
            data: {
                hospital: {
                    id: result.hospital.id,
                    name: result.hospital.name,
                    code: result.hospital.code,
                },
                user: {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                }
            }
        }, { status: 201 })

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: error.errors[0]?.message || 'Doğrulama hatası' },
                { status: 400 }
            )
        }

        logger.error('Registration failed', error)
        return NextResponse.json(
            { success: false, error: 'Kayıt işlemi sırasında bir hata oluştu. Lütfen tekrar deneyiniz.' },
            { status: 500 }
        )
    }
}
