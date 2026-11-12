import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'
import { validatePassword } from '@/lib/password-policy'
import { errorResponse } from '@/lib/api-response'
import { handleError } from '@/lib/errors'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const role = searchParams.get('role')
        let hospitalId = searchParams.get('hospitalId')

        const session = await getServerSession(authOptions)
        const sessionHospitalId = (session?.user as any)?.hospitalId
        if (sessionHospitalId) {
            hospitalId = sessionHospitalId
        }

        const where: any = {}

        if (role) {
            where.role = role as any
        }
        if (hospitalId) {
            where.hospitalId = hospitalId
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                role: true,
                email: true,
                department: true,
                phone: true,
                hospital: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })

        return NextResponse.json(users)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching users' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        // Check if user is authenticated and is admin
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return errorResponse('Yetkilendirme gerekli', 401, 'UNAUTHORIZED')
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email! }
        })

        if (currentUser?.role !== 'ADMIN') {
            return errorResponse('Bu işlem için admin yetkisi gerekli', 403, 'FORBIDDEN')
        }

        const body = await request.json()
        const { name, email, role, department, phone, hospital, password } = body

        // Basic validation
        if (!name || !email || !role) {
            return errorResponse('Name, email and role are required', 400, 'VALIDATION_ERROR')
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return errorResponse('User with this email already exists', 400, 'CONFLICT')
        }

        // Find or create hospital
        let hospitalIdToUse = currentUser.hospitalId || body.hospitalId || null

        if (!hospitalIdToUse && hospital) {
            const existingHospital = await prisma.hospital.findFirst({
                where: { name: hospital }
            })

            if (existingHospital) {
                hospitalIdToUse = existingHospital.id
            } else {
                // Create default hospital if not exists
                const newHospital = await prisma.hospital.create({
                    data: {
                        name: hospital,
                        code: 'HOSP-' + Math.random().toString(36).substring(7).toUpperCase()
                    }
                })
                hospitalIdToUse = newHospital.id
            }
        }

        // If still no hospitalId, find ANY hospital or create a default one
        if (!hospitalIdToUse) {
            const defaultHospital = await prisma.hospital.findFirst()
            if (defaultHospital) {
                hospitalIdToUse = defaultHospital.id
            } else {
                const newHospital = await prisma.hospital.create({
                    data: {
                        name: 'Ana Hastane',
                        code: 'MERKEZ'
                    }
                })
                hospitalIdToUse = newHospital.id
            }
        }

        // Validate password if provided
        if (password) {
            const passwordValidation = validatePassword(password, { email, name })
            if (!passwordValidation.valid) {
                return errorResponse(
                    passwordValidation.errors.join(', '),
                    400,
                    'VALIDATION_ERROR',
                    { errors: passwordValidation.errors }
                )
            }
        }

        const user = await prisma.user.create({
            data: {
                name,
                email,
                role,
                department,
                phone,
                password: password
                    ? await bcrypt.hash(password, 12)
                    : await bcrypt.hash('TempPassword123!@#', 12), // Temporary password - user must change on first login
                hospitalId: hospitalIdToUse
            }
        })

        logger.info('User created', { userId: user.id, email: user.email, role: user.role })

        return NextResponse.json({
            success: true,
            data: {
                ...user,
                password: undefined // Never return password
            }
        })
    } catch (error) {
        logger.error('Error creating user', error as Error)
        const errorInfo = handleError(error)
        return errorResponse(errorInfo.message, errorInfo.statusCode, errorInfo.code, errorInfo.details)
    }
}
