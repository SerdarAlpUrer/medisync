'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Hospital {
    id: string
    name: string
    code: string
}

interface HospitalContextType {
    activeHospitalId: string | null
    activeHospital: Hospital | null
    hospitals: Hospital[]
    setActiveHospital: (id: string, name: string, code: string) => void
    clearActiveHospital: () => void
    refreshHospitals: () => Promise<void>
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined)

export function HospitalProvider({ children }: { children: ReactNode }) {
    const [activeHospitalId, setActiveHospitalId] = useState<string | null>(null)
    const [activeHospital, setActiveHospitalState] = useState<Hospital | null>(null)
    const [hospitals, setHospitals] = useState<Hospital[]>([])

    const fetchHospitals = async () => {
        try {
            const response = await fetch('/api/hospitals')
            if (response.ok) {
                const data = await response.json()
                setHospitals(data)
            }
        } catch (error) {
            console.error('Error fetching hospitals:', error)
        }
    }

    // Load active hospital from localStorage and fetch all hospitals on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedId = localStorage.getItem('activeHospitalId')
            const savedName = localStorage.getItem('activeHospitalName')
            const savedCode = localStorage.getItem('activeHospitalCode')

            if (savedId && savedName && savedCode) {
                setActiveHospitalId(savedId)
                setActiveHospitalState({ id: savedId, name: savedName, code: savedCode })
            }
        }
        fetchHospitals()
    }, [])

    const setActiveHospital = (id: string, name: string, code: string) => {
        setActiveHospitalId(id)
        setActiveHospitalState({ id, name, code })

        if (typeof window !== 'undefined') {
            localStorage.setItem('activeHospitalId', id)
            localStorage.setItem('activeHospitalName', name)
            localStorage.setItem('activeHospitalCode', code)
        }
    }

    const clearActiveHospital = () => {
        setActiveHospitalId(null)
        setActiveHospitalState(null)

        if (typeof window !== 'undefined') {
            localStorage.removeItem('activeHospitalId')
            localStorage.removeItem('activeHospitalName')
            localStorage.removeItem('activeHospitalCode')
        }
    }

    return (
        <HospitalContext.Provider
            value={{
                activeHospitalId,
                activeHospital,
                hospitals,
                setActiveHospital,
                clearActiveHospital,
                refreshHospitals: fetchHospitals
            }}
        >
            {children}
        </HospitalContext.Provider>
    )
}

export function useHospital() {
    const context = useContext(HospitalContext)
    if (context === undefined) {
        throw new Error('useHospital must be used within a HospitalProvider')
    }
    return context
}
