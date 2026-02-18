'use client'

import React from 'react'

/**
 * Skeleton Screen Components for better loading UX
 */

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-pulse">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 flex items-center space-x-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonList() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonPage() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
      <SkeletonStats />
      <SkeletonTable />
    </div>
  )
}

/**
 * Progress indicator for operations
 */
export function ProgressIndicator({ progress, label }: { progress: number; label?: string }) {
  return (
    <div className="w-full">
      {label && <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{label}</p>}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 text-right">{Math.round(progress)}%</p>
    </div>
  )
}

/**
 * Optimistic update wrapper
 */
export function OptimisticWrapper<T>({
  children,
  optimisticData,
  onUpdate,
  onError,
  isLoading
}: {
  children: (data: T) => React.ReactNode
  optimisticData?: T
  onUpdate: () => Promise<T>
  onError?: (error: Error) => void
  isLoading: boolean
}) {
  const [data, setData] = React.useState<T | null>(optimisticData || null)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (isLoading) {
      onUpdate()
        .then(setData)
        .catch((err) => {
          setError(err)
          onError?.(err)
        })
    }
  }, [isLoading, onUpdate, onError])

  if (error) {
    return <div className="text-red-600">Error: {error.message}</div>
  }

  if (!data) {
    return <SkeletonPage />
  }

  return <>{children(data)}</>
}

