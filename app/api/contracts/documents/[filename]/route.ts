import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

// GET /api/contracts/documents/[filename] - Serve Contract Document
export async function GET(
    request: Request,
    props: { params: Promise<{ filename: string }> }
) {
    try {
        const params = await props.params
        const filename = params.filename
        const filePath = path.join(process.cwd(), 'sozlesmeler', filename)

        if (!existsSync(filePath)) {
            return NextResponse.json(
                { error: 'Dosya bulunamadı' },
                { status: 404 }
            )
        }

        const fileBuffer = await readFile(filePath)

        // Dosya türüne göre content-type belirle (basitçe PDF varsayılabilir veya uzantıdan bakılabilir)
        const ext = path.extname(filename).toLowerCase()
        let contentType = 'application/octet-stream' // varsayılan

        if (ext === '.pdf') contentType = 'application/pdf'
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
        else if (ext === '.png') contentType = 'image/png'

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `inline; filename="${filename}"`,
            },
        })
    } catch (error: any) {
        console.error('Error serving document:', error)
        return NextResponse.json(
            { error: `Belge görüntülenirken hata oluştu: ${error?.message || error}` },
            { status: 500 }
        )
    }
}
