import { useState } from 'react'
import MetricCard from './charts/MetricCard'
import LineChart from './charts/LineChart'
import BarChart from './charts/BarChart'
import PieChart from './charts/PieChart'
import DataTable from './charts/DataTable'
import Filters from './Filters'
import { generatePerformanceData, subjectData, groupData, gradeDistribution, metrics, tableData } from '../data/mockData'
import { useAppData } from '../context/AppDataContext'

const Dashboard = () => {
  const { dashboardFilters, setDashboardFilters } = useAppData()
  const [dateRange, setDateRange] = useState(dashboardFilters.dateRange)
  const [selectedSubject, setSelectedSubject] = useState<string>(dashboardFilters.selectedSubject)
  const [selectedGroup, setSelectedGroup] = useState<string>(dashboardFilters.selectedGroup)

  const performanceData = generatePerformanceData(parseInt(dateRange))

  const handleDateRangeChange = (v: string) => {
    setDateRange(v)
    setDashboardFilters({ dateRange: v })
  }

  const handleSubjectChange = (v: string) => {
    setSelectedSubject(v)
    setDashboardFilters({ selectedSubject: v })
  }

  const handleGroupChange = (v: string) => {
    setSelectedGroup(v)
    setDashboardFilters({ selectedGroup: v })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-app-text">Дашборд успеваемости студентов</h2>
        </div>
      </div>

      <Filters
        dateRange={dateRange}
        selectedSubject={selectedSubject}
        selectedGroup={selectedGroup}
        onDateRangeChange={handleDateRangeChange}
        onSubjectChange={handleSubjectChange}
        onGroupChange={handleGroupChange}
      />

      {/* Метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-app-surface rounded-xl p-6 border border-app-border">
          <h3 className="text-xl font-semibold text-app-text mb-4">Динамика среднего балла</h3>
          <LineChart data={performanceData} />
        </div>

        <div className="bg-app-surface rounded-xl p-6 border border-app-border">
          <h3 className="text-xl font-semibold text-app-text mb-4">Успеваемость по предметам</h3>
          <PieChart data={subjectData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-app-surface rounded-xl p-6 border border-app-border">
          <h3 className="text-xl font-semibold text-app-text mb-4">Средний балл по группам</h3>
          <BarChart data={groupData} />
        </div>

        <div className="bg-app-surface rounded-xl p-6 border border-app-border">
          <h3 className="text-xl font-semibold text-app-text mb-4">Распределение по оценкам</h3>
          <BarChart data={gradeDistribution} />
        </div>
      </div>

      {/* Таблица данных */}
      <div className="bg-app-surface rounded-xl p-6 border border-app-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-app-text">Успеваемость студентов</h3>
        </div>
        <DataTable data={tableData} />
      </div>
    </div>
  )
}

export default Dashboard

