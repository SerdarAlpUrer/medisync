'use client'

import { useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS, tr } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Loader2, AlertCircle } from 'lucide-react'

const locales = {
    'tr': tr,
    'en-US': enUS,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

interface MaintenanceEvent {
    id: string
    title: string
    start: Date
    end: Date
    resource: any
}

export default function MaintenanceCalendar() {
    const [events, setEvents] = useState<MaintenanceEvent[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchMaintenances()
    }, [])

    const fetchMaintenances = async () => {
        try {
            setIsLoading(true)
            const res = await fetch('/api/maintenance?status=ALL') // Fetch all to show on calendar
            const data = await res.json()

            // Handle different data structures depending on API response format
            const maintenanceList = Array.isArray(data) ? data : (data.data || [])

            const calendarEvents = maintenanceList.map((m: any) => {
                const startDate = new Date(m.scheduledDate)
                const endDate = new Date(startDate)
                endDate.setHours(startDate.getHours() + 1) // Default duration 1 hour

                return {
                    id: m.id,
                    title: `${m.device?.name || 'Cihaz'} - ${m.type}`,
                    start: startDate,
                    end: endDate,
                    resource: m
                }
            })
            setEvents(calendarEvents)
        } catch (err) {
            console.error('Error fetching calendar events:', err)
            setError('Takvim verileri yüklenirken hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    const eventStyleGetter = (event: MaintenanceEvent) => {
        const priority = event.resource.priority
        let backgroundColor = '#3b82f6' // blue default

        if (priority === 'HIGH' || priority === 'CRITICAL') {
            backgroundColor = '#ef4444' // red
        } else if (priority === 'MEDIUM') {
            backgroundColor = '#f97316' // orange
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[600px] items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-500">Takvim yükleniyor...</span>
            </div>
        )
    }

    return (
        <div className="h-[700px] bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-3 rounded-lg flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {error}
                </div>
            )}

            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month', 'week', 'day', 'agenda']}
                defaultView={Views.MONTH}
                culture='tr'
                messages={{
                    next: "İleri",
                    previous: "Geri",
                    today: "Bugün",
                    month: "Ay",
                    week: "Hafta",
                    day: "Gün",
                    agenda: "Ajanda",
                    date: "Tarih",
                    time: "Saat",
                    event: "Olay",
                    noEventsInRange: "Bu aralıkta etkinlik yok."
                }}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(event) => alert(`Detaylar: ${event.title}\nTeknisyen: ${event.resource.technician?.name || 'Atanmamış'}\nDurum: ${event.resource.status}`)}
            />
        </div>
    )
}
