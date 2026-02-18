'use client'

import { useEffect } from 'react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <html>
            <body>
                <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg border border-gray-100">
                        <h2 className="mb-4 text-2xl font-bold text-gray-900">Kritik Hata</h2>
                        <p className="mb-6 text-gray-600">Site yüklenirken kritik bir hata oluştu.</p>
                        <button
                            onClick={() => reset()}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                        >
                            Tekrar Dene
                        </button>
                    </div>
                </div>
            </body>
        </html>
    )
}
