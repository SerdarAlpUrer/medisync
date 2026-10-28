'use client'

import { Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { HealthScoreResult, getHealthStatusColor, getHealthStatusLabel } from '@/lib/ai/health-score'

interface HealthScoreBadgeProps {
    score: number
    status: HealthScoreResult['status']
    showScore?: boolean
    size?: 'sm' | 'md' | 'lg'
}

export function HealthScoreBadge({ score, status, showScore = true, size = 'md' }: HealthScoreBadgeProps) {
    const colorClass = getHealthStatusColor(status)
    const label = getHealthStatusLabel(status)

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5'
    }

    const iconSize = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    }

    const StatusIcon = {
        excellent: CheckCircle,
        good: Activity,
        warning: AlertTriangle,
        critical: XCircle
    }[status]

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${colorClass} ${sizeClasses[size]}`}>
            <StatusIcon className={iconSize[size]} />
            {showScore && <span>{score}</span>}
            <span className="hidden sm:inline">• {label}</span>
        </span>
    )
}

interface HealthScoreCardProps {
    result: HealthScoreResult
    deviceName: string
}

export function HealthScoreCard({ result, deviceName }: HealthScoreCardProps) {
    const { score, status, factors, recommendations } = result
    const colorClass = getHealthStatusColor(status)

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{deviceName}</h3>
                <HealthScoreBadge score={score} status={status} size="lg" />
            </div>

            {/* Score Breakdown */}
            <div className="space-y-2 mb-4">
                <ScoreBar label="Yaş" value={factors.ageScore} max={25} />
                <ScoreBar label="Bakım" value={factors.maintenanceScore} max={30} />
                <ScoreBar label="Kalibrasyon" value={factors.calibrationScore} max={25} />
                <ScoreBar label="Güvenilirlik" value={factors.reliabilityScore} max={20} />
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Öneriler:</p>
                    <ul className="space-y-1">
                        {recommendations.map((rec, idx) => (
                            <li key={idx} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-1.5">
                                <span className="text-yellow-500 mt-0.5">•</span>
                                {rec}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
    const percentage = (value / max) * 100

    let barColor = 'bg-green-500'
    if (percentage < 40) barColor = 'bg-red-500'
    else if (percentage < 70) barColor = 'bg-yellow-500'

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 w-20">{label}</span>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full ${barColor} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-10 text-right">
                {value}/{max}
            </span>
        </div>
    )
}
