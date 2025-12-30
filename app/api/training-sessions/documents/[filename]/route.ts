import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

// GET /api/training-sessions/documents/[filename] - Serve Training Document
export async function GET(
    request: Request,
    props: { params: Promise<{ filename: string }> }
) {
    try {
        const params = await props.params
        const filename = params.filename
        // Basic path traversal protection
        if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return NextResponse.json(
                { error: 'Geçersiz dosya adı' },
                { status: 400 }
            )
        }

        const filePath = path.join(process.cwd(), 'egitim-dokumanlari', filename)

        if (!existsSync(filePath)) {
            return NextResponse.json(
                { error: 'Dosya bulunamadı' },
                { status: 404 }
            )
        }

        const fileBuffer = await readFile(filePath)

        const ext = path.extname(filename).toLowerCase()
        let contentType = 'application/octet-stream'

        if (ext === '.pdf') contentType = 'application/pdf'
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
        else if (ext === '.png') contentType = 'image/png'
        else if (ext === '.xls' || ext === '.xlsx') contentType = 'application/vnd.ms-excel'
        else if (ext === '.doc' || ext === '.docx') contentType = 'application/msword'

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `inline; filename="${filename}"`,
            },
        })
    } catch (error: any) {
        console.error('Error serving document:', error)
        return NextResponse.json(
            { error: `Belge görüntülenirken hata oluştu: ${error.message || error}` },
            { status: 500 }
        )
    }
}
