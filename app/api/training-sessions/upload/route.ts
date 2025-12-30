import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// POST /api/training-sessions/upload - Upload Training Document
export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: 'Dosya yüklenmedi' },
                { status: 400 }
            )
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const originalName = file.name
        const sanitizedFilename = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
        const uniqueFilename = `${uuidv4()}-${sanitizedFilename}`
        const filesize = file.size
        const mimetype = file.type

        // Check/Create directory
        const uploadDir = path.join(process.cwd(), 'egitim-dokumanlari')
        try {
            await mkdir(uploadDir, { recursive: true })
        } catch (error) {
            // Ignore if exists
        }

        const filePath = path.join(uploadDir, uniqueFilename)
        await writeFile(filePath, buffer)

        return NextResponse.json({
            message: 'Dosya başarıyla yüklendi',
            filename: uniqueFilename,
            originalName: originalName,
            filesize: filesize,
            mimetype: mimetype,
            path: uniqueFilename // Using path as filename for consistency with other parts if needed
        })
    } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json(
            { error: 'Dosya yüklenirken hata oluştu' },
            { status: 500 }
        )
    }
}
