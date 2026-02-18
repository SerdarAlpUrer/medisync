
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Testing connecting to database...')
        await prisma.$connect()
        console.log('Successfully connected to database')

        // Try a simple query
        const userCount = await prisma.user.count()
        console.log(`Found ${userCount} users`)
    } catch (e) {
        console.error('Error connecting to database:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
