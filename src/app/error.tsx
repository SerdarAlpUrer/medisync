'use client'

import { useEffect } from 'react'

export default function Error({
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
        <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg border border-gray-100">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <svg
                        className="h-6 w-6 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                        />
                    </svg>
                </div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">Bir şeyler yanlış gitti</h2>
                <p className="mb-6 text-gray-600">
                    Uygulama çalışırken beklenmedik bir hata oluştu.
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => reset()}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        Tekrar Dene
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                        Ana Sayfaya Dön
                    </button>
                </div>
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-8 text-left">
                        <details className="cursor-pointer">
                            <summary className="text-sm font-medium text-red-600">Hata Detayı</summary>
                            <pre className="mt-2 max-h-40 overflow-auto rounded bg-gray-100 p-2 text-xs text-red-800">
                                {error.message}
                                {error.stack}
                            </pre>
                        </details>
                    </div>
                )}
            </div>
        </div>
    )
}
