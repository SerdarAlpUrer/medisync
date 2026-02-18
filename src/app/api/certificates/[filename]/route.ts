import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const { filename } = await params

        // Security check: prevent directory traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return new NextResponse('Invalid filename', { status: 400 })
        }

        // Define the certificate directory inside the application folder
        const certDir = path.join(process.cwd(), 'sertifikalar')

        // Create directory if it doesn't exist
        if (!fs.existsSync(certDir)) {
            fs.mkdirSync(certDir, { recursive: true })
        }

        const filePath = path.join(certDir, filename)

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return new NextResponse('Certificate not found', { status: 404 })
        }

        // Read file
        const fileBuffer = fs.readFileSync(filePath)

        // Return file with correct content type
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
            },
        })
    } catch (error) {
        console.error('Error serving certificate:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
