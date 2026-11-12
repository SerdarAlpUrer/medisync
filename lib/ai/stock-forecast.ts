/**
 * Stock Forecast - AI-powered inventory optimization
 * 
 * Predicts spare part demand using simple moving average
 * and generates reorder alerts
 */

export interface SparePartUsage {
    partId: string
    partName: string
    usageHistory: { date: Date; quantity: number }[] // Last N months
    currentStock: number
    reorderPoint: number
    leadTimeDays: number
}

export interface ForecastResult {
    partId: string
    partName: string
    currentStock: number
    predictedDemand: number // Next 30 days
    daysUntilStockout: number
    reorderRecommended: boolean
    urgency: 'none' | 'low' | 'medium' | 'high' | 'critical'
    recommendedOrderQty: number
}

/**
 * Calculate moving average from usage history
 */
function calculateMovingAverage(usageHistory: SparePartUsage['usageHistory'], periods: number = 3): number {
    if (usageHistory.length === 0) return 0

    const recentUsage = usageHistory
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, periods)

    const totalUsage = recentUsage.reduce((sum, u) => sum + u.quantity, 0)
    return totalUsage / recentUsage.length
}

/**
 * Forecast stock levels for a spare part
 */
export function forecastStockLevel(part: SparePartUsage): ForecastResult {
    // Calculate average monthly usage
    const avgMonthlyUsage = calculateMovingAverage(part.usageHistory)

    // Predict demand for next 30 days
    const predictedDemand = Math.round(avgMonthlyUsage)

    // Calculate days until stockout
    const dailyUsage = avgMonthlyUsage / 30
    const daysUntilStockout = dailyUsage > 0
        ? Math.floor(part.currentStock / dailyUsage)
        : 999 // No usage = no stockout

    // Determine if reorder is needed (considering lead time)
    const reorderRecommended = daysUntilStockout <= (part.leadTimeDays + 7) // 7 days safety buffer

    // Calculate urgency
    let urgency: ForecastResult['urgency'] = 'none'
    if (daysUntilStockout <= 0) urgency = 'critical'
    else if (daysUntilStockout <= 7) urgency = 'high'
    else if (daysUntilStockout <= 14) urgency = 'medium'
    else if (daysUntilStockout <= 30) urgency = 'low'

    // Recommended order quantity (cover 60 days + safety stock)
    const recommendedOrderQty = Math.max(
        Math.ceil(avgMonthlyUsage * 2), // 2 months supply
        part.reorderPoint - part.currentStock + Math.ceil(avgMonthlyUsage)
    )

    return {
        partId: part.partId,
        partName: part.partName,
        currentStock: part.currentStock,
        predictedDemand,
        daysUntilStockout,
        reorderRecommended,
        urgency,
        recommendedOrderQty: reorderRecommended ? recommendedOrderQty : 0
    }
}

/**
 * Analyze all spare parts and return those needing attention
 */
export function analyzeInventory(parts: SparePartUsage[]): {
    forecasts: ForecastResult[]
    criticalItems: ForecastResult[]
    totalReorderCost?: number
} {
    const forecasts = parts.map(forecastStockLevel)

    const criticalItems = forecasts.filter(f =>
        f.urgency === 'critical' || f.urgency === 'high'
    )

    return {
        forecasts,
        criticalItems
    }
}

/**
 * Get stock status color
 */
export function getStockStatusColor(urgency: ForecastResult['urgency']): string {
    switch (urgency) {
        case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/30'
        case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
        case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
        case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
        case 'none': return 'text-green-600 bg-green-100 dark:bg-green-900/30'
    }
}

/**
 * Get Turkish label for urgency
 */
export function getUrgencyLabel(urgency: ForecastResult['urgency']): string {
    switch (urgency) {
        case 'critical': return 'Kritik'
        case 'high': return 'Yüksek'
        case 'medium': return 'Orta'
        case 'low': return 'Düşük'
        case 'none': return 'Normal'
    }
}
