'use client'

import MaintenanceCalendar from '@/components/MaintenanceCalendar'
import { Calendar as CalendarIcon } from 'lucide-react'

export default function CalendarPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                    <CalendarIcon className="mr-3 h-8 w-8 text-blue-600" />
                    Bakım Takvimi
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Tüm bakım ve onarım planlarını takvim üzerinde görüntüleyin.
                </p>
            </div>

            <MaintenanceCalendar />
        </div>
    )
}
