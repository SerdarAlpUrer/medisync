import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { getAbsoluteFilePath } from '@/lib/storage'
import mime from 'mime'

// GET /api/contracts/documents/[...path] - Serve Contract Document
export async function GET(
    request: Request,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: pathSegments } = await params

        // Reconstruct the full path
        const filename = pathSegments.join('/')

        if (!filename) {
            return NextResponse.json(
                { error: 'Dosya adı belirtilmedi' },
                { status: 400 }
            )
        }

        // Get absolute file path using utility for 'sozlesmeler' module
        const filePath = getAbsoluteFilePath(filename, 'sozlesmeler')

        try {
            const fileBuffer = await readFile(filePath)

            // Determine mime type
            const mimeType = mime.getType(filePath) || 'application/octet-stream'

            // Set headers
            const headers = new Headers()
            headers.set('Content-Type', mimeType)
            headers.set('Content-Disposition', `inline; filename="${path.basename(filePath)}"`)

            return new NextResponse(fileBuffer, {
                status: 200,
                headers
            })
        } catch (error) {
            console.error('File not found:', filePath)
            return NextResponse.json(
                { error: 'Dosya bulunamadı' },
                { status: 404 }
            )
        }
    } catch (error) {
        console.error('Error serving file:', error)
        return NextResponse.json(
            { error: 'Dosya sunulurken hata oluştu' },
            { status: 500 }
        )
    }
}
