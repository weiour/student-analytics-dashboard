import { createContext, useContext, useMemo, useState, ReactNode } from 'react'
import { ContingentSpecialty } from '../types'

type DashboardFilters = {
  dateRange: string
  selectedSubject: string
  selectedGroup: string
}

type AppDataContextType = {
  dashboardFilters: DashboardFilters
  setDashboardFilters: (next: Partial<DashboardFilters>) => void
  contingentData: ContingentSpecialty[]
  setContingentData: (data: ContingentSpecialty[]) => void
}

const AppDataContext = createContext<AppDataContextType | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [dashboardFilters, setDashboardFiltersState] = useState<DashboardFilters>({
    dateRange: '30',
    selectedSubject: 'all',
    selectedGroup: 'all',
  })
  const [contingentData, setContingentData] = useState<ContingentSpecialty[]>([])

  const value = useMemo<AppDataContextType>(() => ({
    dashboardFilters,
    setDashboardFilters: (next) => setDashboardFiltersState((prev) => ({ ...prev, ...next })),
    contingentData,
    setContingentData,
  }), [dashboardFilters, contingentData])

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider')
  return ctx
}
