import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// POST /api/contracts/upload - Upload Contract Document
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
        const filename = file.name.replaceAll(' ', '_')
        const uniqueFilename = `${uuidv4()}-${filename}`

        // Klasör kontrolü ve oluşturma
        const uploadDir = path.join(process.cwd(), 'sozlesmeler')
        try {
            await mkdir(uploadDir, { recursive: true })
        } catch (error) {
            // Klasör zaten varsa hata verme
        }

        const filePath = path.join(uploadDir, uniqueFilename)
        await writeFile(filePath, buffer)

        return NextResponse.json({
            message: 'Dosya başarıyla yüklendi',
            path: uniqueFilename
        })
    } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json(
            { error: 'Dosya yüklenirken hata oluştu' },
            { status: 500 }
        )
    }
}
