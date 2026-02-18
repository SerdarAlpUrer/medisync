
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Checking for admin user...')
        const admin = await prisma.user.findUnique({
            where: { email: 'admin@biomedicapp.com' }
        })

        if (admin) {
            console.log('✅ Admin user found:')
            console.log(`- ID: ${admin.id}`)
            console.log(`- Email: ${admin.email}`)
            console.log(`- Role: ${admin.role}`)
            console.log(`- Active: ${admin.isActive}`)
            console.log(`- 2FA: ${admin.twoFactorEnabled}`)
            console.log(`- HospitalID: ${admin.hospitalId}`)
        } else {
            console.error('❌ Admin user NOT found!')
        }

        const count = await prisma.user.count()
        console.log(`Total users in DB: ${count}`)

        const allUsers = await prisma.user.findMany({
            select: { email: true, role: true }
        })
        console.log('All Users:', allUsers)

    } catch (e) {
        console.error('Error querying database:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
