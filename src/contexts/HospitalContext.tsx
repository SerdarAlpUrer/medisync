'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

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

export const HospitalContext = createContext<HospitalContextType | undefined>(undefined)

export function HospitalProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession()
    const [activeHospitalId, setActiveHospitalId] = useState<string | null>(null)
    const [activeHospital, setActiveHospitalState] = useState<Hospital | null>(null)
    const [hospitals, setHospitals] = useState<Hospital[]>([])

    const fetchHospitals = async () => {
        try {
            const response = await fetch('/api/hospitals')
            if (response.ok) {
                const data: Hospital[] = await response.json()
                // Strict Multi-Tenant isolation:
                // Only regular clinical staff/viewers are locked to a single hospital.
                // Technical staff (ADMIN, ENGINEER, TECHNICIAN) can switch between hospitals.
                const userRole = (session?.user?.role || '').toUpperCase()
                const isTechnicalStaff = userRole === 'ADMIN' || userRole === 'ENGINEER' || userRole === 'TECHNICIAN' || userRole === 'SUPERVISOR'
                const userHospId = session?.user?.hospitalId
                const filtered = (!isTechnicalStaff && userHospId) ? data.filter(h => h.id === userHospId) : data
                setHospitals(filtered)
                return filtered
            }
        } catch (error) {
            console.error('Error fetching hospitals:', error)
        }
        return []
    }

    // Load active hospital and enforce multi-tenant isolation
    useEffect(() => {
        if (status === 'loading') return

        const init = async () => {
            const userHospitalId = session?.user?.hospitalId
            const userRole = (session?.user?.role || '').toUpperCase()
            const isTechnicalStaff = userRole === 'ADMIN' || userRole === 'ENGINEER' || userRole === 'TECHNICIAN' || userRole === 'SUPERVISOR'

            // If regular staff has a fixed hospital constraint (Doctor, Nurse, Viewer)
            if (userHospitalId && !isTechnicalStaff) {
                // Clear any stale hospital stored in localStorage from other tenants
                if (typeof window !== 'undefined') {
                    const savedId = localStorage.getItem('activeHospitalId')
                    if (savedId && savedId !== userHospitalId) {
                        localStorage.removeItem('activeHospitalId')
                        localStorage.removeItem('activeHospitalName')
                        localStorage.removeItem('activeHospitalCode')
                    }
                }

                const fetchedHospitals = await fetchHospitals()
                const match = fetchedHospitals.find(h => h.id === userHospitalId)
                if (match) {
                    setActiveHospitalState(match)
                    setActiveHospitalId(match.id)
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('activeHospitalId', match.id)
                        localStorage.setItem('activeHospitalName', match.name)
                        localStorage.setItem('activeHospitalCode', match.code)
                    }
                } else if (fetchedHospitals.length > 0) {
                    const first = fetchedHospitals[0]
                    setActiveHospitalState(first)
                    setActiveHospitalId(first.id)
                }
                return
            }

            // For Technical staff (ADMIN, ENGINEER, TECHNICIAN) and global supervisors:
            const fetchedHospitals = await fetchHospitals()
            if (typeof window !== 'undefined') {
                const savedId = localStorage.getItem('activeHospitalId')
                const savedName = localStorage.getItem('activeHospitalName')
                const savedCode = localStorage.getItem('activeHospitalCode')

                if (savedId === 'ALL') {
                    setActiveHospitalId(null)
                    setActiveHospitalState(null)
                } else if (savedId && savedName && savedCode && fetchedHospitals.some(h => h.id === savedId)) {
                    setActiveHospitalId(savedId)
                    setActiveHospitalState({ id: savedId, name: savedName, code: savedCode })
                } else if (userHospitalId && fetchedHospitals.some(h => h.id === userHospitalId)) {
                    // Default to assigned hospital if available
                    const match = fetchedHospitals.find(h => h.id === userHospitalId)!
                    setActiveHospitalId(match.id)
                    setActiveHospitalState(match)
                } else if (fetchedHospitals.length > 0) {
                    // Default to first hospital if none is selected
                    const first = fetchedHospitals[0]
                    setActiveHospitalState(first)
                    setActiveHospitalId(first.id)
                }
            }
        }

        init()
    }, [session?.user?.hospitalId, session?.user?.role, status])

    const setActiveHospital = (id: string, name: string, code: string) => {
        // Multi-tenant protection: If user is bound to a hospital, ignore switching to other hospitals
        if (session?.user?.hospitalId && id !== session.user.hospitalId) {
            return
        }

        setActiveHospitalId(id)
        setActiveHospitalState({ id, name, code })

        if (typeof window !== 'undefined') {
            localStorage.setItem('activeHospitalId', id)
            localStorage.setItem('activeHospitalName', name)
            localStorage.setItem('activeHospitalCode', code)
        }
    }

    const clearActiveHospital = () => {
        // Multi-tenant protection: Tenant users cannot clear to "All Hospitals"
        if (session?.user?.hospitalId) {
            return
        }

        setActiveHospitalId(null)
        setActiveHospitalState(null)

        if (typeof window !== 'undefined') {
            localStorage.setItem('activeHospitalId', 'ALL')
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
                refreshHospitals: async () => {
                    await fetchHospitals()
                }
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
