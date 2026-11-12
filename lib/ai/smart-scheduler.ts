/**
 * Smart Scheduler - AI-powered maintenance scheduling
 * 
 * Optimizes technician assignments based on:
 * - Device location (hospital branch)
 * - Task urgency/priority
 * - Technician workload and expertise
 */

export interface MaintenanceTask {
    id: string
    deviceId: string
    deviceName: string
    hospitalId: string
    hospitalName: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    estimatedDuration: number // minutes
    dueDate: Date
    requiredSkills?: string[]
}

export interface Technician {
    id: string
    name: string
    hospitalId: string // Primary location
    skills: string[]
    currentLoad: number // number of assigned tasks
    maxDailyTasks: number
}

export interface ScheduleResult {
    taskId: string
    technicianId: string
    technicianName: string
    scheduledDate: Date
    score: number
    reasoning: string[]
}

/**
 * Get priority weight for scoring
 */
function getPriorityWeight(priority: MaintenanceTask['priority']): number {
    switch (priority) {
        case 'critical': return 4
        case 'high': return 3
        case 'medium': return 2
        case 'low': return 1
    }
}

/**
 * Calculate days until due date
 */
function getDaysUntilDue(dueDate: Date): number {
    const now = new Date()
    return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Score a technician for a specific task
 */
function scoreTechnicianForTask(tech: Technician, task: MaintenanceTask): { score: number; reasons: string[] } {
    let score = 0
    const reasons: string[] = []

    // 1. Location match (40 points max)
    if (tech.hospitalId === task.hospitalId) {
        score += 40
        reasons.push('Aynı lokasyonda')
    } else {
        score += 10
        reasons.push('Farklı lokasyon (-30)')
    }

    // 2. Workload (30 points max)
    const workloadRatio = tech.currentLoad / tech.maxDailyTasks
    if (workloadRatio < 0.5) {
        score += 30
        reasons.push('Düşük iş yükü')
    } else if (workloadRatio < 0.75) {
        score += 20
        reasons.push('Orta iş yükü')
    } else if (workloadRatio < 1) {
        score += 10
        reasons.push('Yüksek iş yükü')
    } else {
        reasons.push('Kapasite dolu')
    }

    // 3. Skill match (30 points max)
    if (task.requiredSkills && task.requiredSkills.length > 0) {
        const matchedSkills = task.requiredSkills.filter(skill =>
            tech.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
        )
        const skillMatchRatio = matchedSkills.length / task.requiredSkills.length
        score += Math.round(skillMatchRatio * 30)
        if (skillMatchRatio === 1) {
            reasons.push('Tüm yetenekler uygun')
        } else if (skillMatchRatio > 0) {
            reasons.push(`${matchedSkills.length}/${task.requiredSkills.length} yetenek uygun`)
        }
    } else {
        score += 30 // No specific skills required
    }

    return { score, reasons }
}

/**
 * Auto-schedule tasks to available technicians
 */
export function autoScheduleTasks(
    tasks: MaintenanceTask[],
    technicians: Technician[]
): ScheduleResult[] {
    const results: ScheduleResult[] = []

    // Sort tasks by urgency (priority * days until due)
    const sortedTasks = [...tasks].sort((a, b) => {
        const urgencyA = getPriorityWeight(a.priority) / Math.max(1, getDaysUntilDue(a.dueDate))
        const urgencyB = getPriorityWeight(b.priority) / Math.max(1, getDaysUntilDue(b.dueDate))
        return urgencyB - urgencyA
    })

    // Track technician loads during scheduling
    const techLoads = new Map<string, number>()
    technicians.forEach(t => techLoads.set(t.id, t.currentLoad))

    for (const task of sortedTasks) {
        // Score all technicians for this task
        const scoredTechs = technicians.map(tech => {
            const currentLoad = techLoads.get(tech.id) || 0
            const adjustedTech = { ...tech, currentLoad }
            const { score, reasons } = scoreTechnicianForTask(adjustedTech, task)
            return { tech, score, reasons }
        })

        // Find best match
        const bestMatch = scoredTechs
            .filter(st => (techLoads.get(st.tech.id) || 0) < st.tech.maxDailyTasks)
            .sort((a, b) => b.score - a.score)[0]

        if (bestMatch) {
            results.push({
                taskId: task.id,
                technicianId: bestMatch.tech.id,
                technicianName: bestMatch.tech.name,
                scheduledDate: task.dueDate,
                score: bestMatch.score,
                reasoning: bestMatch.reasons
            })

            // Update load
            techLoads.set(bestMatch.tech.id, (techLoads.get(bestMatch.tech.id) || 0) + 1)
        }
    }

    return results
}

/**
 * Get scheduling suggestions for a single task
 */
export function getSuggestionsForTask(
    task: MaintenanceTask,
    technicians: Technician[]
): { tech: Technician; score: number; reasons: string[] }[] {
    return technicians
        .map(tech => {
            const { score, reasons } = scoreTechnicianForTask(tech, task)
            return { tech, score, reasons }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
}
