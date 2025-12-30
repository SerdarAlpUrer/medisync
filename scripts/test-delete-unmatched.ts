
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        // 1. Create a dummy record
        const record = await prisma.unmatchedCalibration.create({
            data: {
                deviceSerialNumber: 'TEST-DELETE-1',
                deviceName: 'Test Device',
                status: 'PENDING',
                scheduledDate: new Date()
            }
        })
        console.log('Created dummy record:', record.id)

        // 2. Try to delete it using Prisma directly (to verify DB constraint)
        await prisma.unmatchedCalibration.delete({
            where: { id: record.id }
        })
        console.log('Successfully deleted record via Prisma')

    } catch (error) {
        console.error('Error in test script:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
