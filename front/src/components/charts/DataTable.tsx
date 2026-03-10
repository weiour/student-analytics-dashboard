import { useState } from 'react'
import { ChevronDown, ChevronUp, Download, Filter } from 'lucide-react'

interface TableRow {
  id: number
  student: string
  group: string
  subject: string
  grade: number
  avgScore: number
  semester: string
}

interface DataTableProps {
  data: TableRow[]
}

const DataTable = ({ data }: DataTableProps) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof TableRow; direction: 'asc' | 'desc' } | null>(null)
  const [filteredData, setFilteredData] = useState(data)

  const handleSort = (key: keyof TableRow) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })

    const sorted = [...filteredData].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1
      return 0
    })
    setFilteredData(sorted)
  }

  const getGradeColor = (grade: number) => {
    if (grade === 5) return 'text-emerald-600'
    if (grade === 4) return 'text-blue-600'
    if (grade === 3) return 'text-amber-600'
    return 'text-rose-600'
  }

  const getSortIcon = (key: keyof TableRow) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="inline ml-1" size={16} />
    ) : (
      <ChevronDown className="inline ml-1" size={16} />
    )
  }

  const handleExport = () => {
    const csv = [
      ['Студент', 'Группа', 'Предмет', 'Оценка', 'Средний балл', 'Семестр'],
      ...filteredData.map((row) => [
        row.student,
        row.group,
        row.subject,
        row.grade.toString(),
        row.avgScore.toFixed(2),
        row.semester,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 text-app-muted text-sm">
          <Filter size={16} />
          <span>Показано: {filteredData.length} записей</span>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-lg transition-colors text-sm"
        >
          <Download size={16} />
          <span>Экспорт CSV</span>
        </button>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-app-border">
            <th
              className="text-left py-3 px-4 text-app-muted/90 font-medium cursor-pointer hover:text-app-text transition-colors"
              onClick={() => handleSort('student')}
            >
              Студент {getSortIcon('student')}
            </th>
            <th
              className="text-left py-3 px-4 text-app-muted/90 font-medium cursor-pointer hover:text-app-text transition-colors"
              onClick={() => handleSort('group')}
            >
              Группа {getSortIcon('group')}
            </th>
            <th
              className="text-left py-3 px-4 text-app-muted/90 font-medium cursor-pointer hover:text-app-text transition-colors"
              onClick={() => handleSort('subject')}
            >
              Предмет {getSortIcon('subject')}
            </th>
            <th
              className="text-left py-3 px-4 text-app-muted/90 font-medium cursor-pointer hover:text-app-text transition-colors"
              onClick={() => handleSort('grade')}
            >
              Оценка {getSortIcon('grade')}
            </th>
            <th
              className="text-left py-3 px-4 text-app-muted/90 font-medium cursor-pointer hover:text-app-text transition-colors"
              onClick={() => handleSort('avgScore')}
            >
              Средний балл {getSortIcon('avgScore')}
            </th>
            <th
              className="text-left py-3 px-4 text-app-muted/90 font-medium cursor-pointer hover:text-app-text transition-colors"
              onClick={() => handleSort('semester')}
            >
              Семестр {getSortIcon('semester')}
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row) => (
            <tr
              key={row.id}
              className="border-b border-app-border hover:bg-app-surface-strong/70 transition-colors"
            >
              <td className="py-3 px-4 text-app-text">{row.student}</td>
              <td className="py-3 px-4 text-app-muted/90">{row.group}</td>
              <td className="py-3 px-4 text-app-muted/90">{row.subject}</td>
              <td className={`py-3 px-4 font-bold ${getGradeColor(row.grade)}`}>{row.grade}</td>
              <td className="py-3 px-4 text-app-text font-medium">{row.avgScore.toFixed(2)}</td>
              <td className="py-3 px-4 text-app-muted/90">{row.semester}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable

