/**
 * Predictive Maintenance - Health Score Algorithm
 * 
 * Calculates a 0-100 health score for medical devices based on:
 * - Device age
 * - Days since last maintenance
 * - Calibration status
 * - Historical failure count
 */

export interface DeviceHealthInput {
    id: string
    name: string
    purchaseDate?: Date | string | null
    lastMaintenanceDate?: Date | string | null
    lastCalibrationDate?: Date | string | null
    calibrationDueDate?: Date | string | null
    status?: string
    failureCount?: number
    usageHoursPerDay?: number
}

export interface HealthScoreResult {
    score: number
    status: 'critical' | 'warning' | 'good' | 'excellent'
    factors: {
        ageScore: number
        maintenanceScore: number
        calibrationScore: number
        reliabilityScore: number
    }
    recommendations: string[]
}

/**
 * Calculate health score for a device
 */
export function calculateHealthScore(device: DeviceHealthInput): HealthScoreResult {
    const now = new Date()

    // 1. Age Score (max 25 points)
    // Newer devices score higher
    let ageScore = 25
    if (device.purchaseDate) {
        const purchaseDate = new Date(device.purchaseDate)
        const ageInYears = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365)

        if (ageInYears < 1) ageScore = 25
        else if (ageInYears < 3) ageScore = 22
        else if (ageInYears < 5) ageScore = 18
        else if (ageInYears < 7) ageScore = 14
        else if (ageInYears < 10) ageScore = 10
        else ageScore = 5
    }

    // 2. Maintenance Score (max 30 points)
    // Recently maintained devices score higher
    let maintenanceScore = 15 // Default if no data
    if (device.lastMaintenanceDate) {
        const lastMaintenance = new Date(device.lastMaintenanceDate)
        const daysSinceMaintenance = (now.getTime() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24)

        if (daysSinceMaintenance < 30) maintenanceScore = 30
        else if (daysSinceMaintenance < 60) maintenanceScore = 25
        else if (daysSinceMaintenance < 90) maintenanceScore = 20
        else if (daysSinceMaintenance < 180) maintenanceScore = 15
        else if (daysSinceMaintenance < 365) maintenanceScore = 10
        else maintenanceScore = 5
    }

    // 3. Calibration Score (max 25 points)
    let calibrationScore = 15 // Default if no data
    if (device.calibrationDueDate) {
        const dueDate = new Date(device.calibrationDueDate)
        const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

        if (daysUntilDue > 90) calibrationScore = 25
        else if (daysUntilDue > 30) calibrationScore = 20
        else if (daysUntilDue > 7) calibrationScore = 15
        else if (daysUntilDue > 0) calibrationScore = 10
        else calibrationScore = 0 // Overdue!
    }

    // 4. Reliability Score (max 20 points)
    // Based on historical failures
    let reliabilityScore = 20
    const failureCount = device.failureCount || 0
    if (failureCount === 0) reliabilityScore = 20
    else if (failureCount === 1) reliabilityScore = 16
    else if (failureCount === 2) reliabilityScore = 12
    else if (failureCount <= 4) reliabilityScore = 8
    else reliabilityScore = 4

    // Calculate total score
    const score = ageScore + maintenanceScore + calibrationScore + reliabilityScore

    // Determine status
    let status: HealthScoreResult['status']
    if (score >= 85) status = 'excellent'
    else if (score >= 65) status = 'good'
    else if (score >= 45) status = 'warning'
    else status = 'critical'

    // Generate recommendations
    const recommendations: string[] = []
    if (maintenanceScore < 15) {
        recommendations.push('Bakım planlaması yapılması önerilir')
    }
    if (calibrationScore < 15) {
        recommendations.push('Kalibrasyon tarihi yaklaşıyor veya geçmiş')
    }
    if (ageScore < 10) {
        recommendations.push('Cihaz yaşlanmış, yenileme değerlendirmesi yapın')
    }
    if (reliabilityScore < 12) {
        recommendations.push('Sık arıza kaydı var, detaylı inceleme önerilir')
    }

    return {
        score,
        status,
        factors: {
            ageScore,
            maintenanceScore,
            calibrationScore,
            reliabilityScore
        },
        recommendations
    }
}

/**
 * Get color class for health status
 */
export function getHealthStatusColor(status: HealthScoreResult['status']): string {
    switch (status) {
        case 'excellent': return 'text-green-500 bg-green-100 dark:bg-green-900/30'
        case 'good': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
        case 'warning': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30'
        case 'critical': return 'text-red-500 bg-red-100 dark:bg-red-900/30'
    }
}

/**
 * Get Turkish label for health status
 */
export function getHealthStatusLabel(status: HealthScoreResult['status']): string {
    switch (status) {
        case 'excellent': return 'Mükemmel'
        case 'good': return 'İyi'
        case 'warning': return 'Dikkat'
        case 'critical': return 'Kritik'
    }
}
