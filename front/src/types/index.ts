export interface DataPoint {
  date: string
  value: number
  category?: string
  region?: string
  product?: string
}

export interface ChartData {
  name: string
  value: number
  color?: string
}

export interface FilterOption {
  id: string
  label: string
  value: string
}

export interface Metric {
  id: string
  label: string
  value: number | string
  change?: number
  trend?: 'up' | 'down' | 'neutral'
}

export interface DashboardWidget {
  id: string
  type: 'line' | 'bar' | 'pie' | 'area' | 'table' | 'metric'
  title: string
  data: DataPoint[] | ChartData[]
  config?: Record<string, unknown>
}

// Типы для данных контингента
export interface ContingentGroup {
  id: string
  specialty: string
  group: string
  total: number
  budgetRF: number
  contract: number
  rsYa: number
  rsYaAGIKI: number
  academicLeave: number
}

export interface ContingentSpecialty {
  specialty: string
  code: string
  groups: ContingentGroup[]
  totals: {
    total: number
    budgetRF: number
    contract: number
    rsYa: number
    rsYaAGIKI: number
    academicLeave: number
  }
}


