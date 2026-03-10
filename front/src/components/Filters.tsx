import { Calendar, Filter } from 'lucide-react'

interface FiltersProps {
  dateRange: string
  selectedSubject: string
  selectedGroup: string
  onDateRangeChange: (value: string) => void
  onSubjectChange: (value: string) => void
  onGroupChange: (value: string) => void
}

const Filters = ({
  dateRange,
  selectedSubject,
  selectedGroup,
  onDateRangeChange,
  onSubjectChange,
  onGroupChange,
}: FiltersProps) => {
  const dateRangeOptions = [
    { value: '7', label: '7 дней' },
    { value: '30', label: '30 дней' },
    { value: '90', label: '90 дней' },
    { value: '180', label: 'Семестр' },
  ]

  const subjects = [
    { value: 'all', label: 'Все предметы' },
    { value: 'math', label: 'Математика' },
    { value: 'physics', label: 'Информационные системы' },
    { value: 'informatics', label: 'Разработка програмных приложений' },
    { value: 'chemistry', label: 'Базы данных' },
    { value: 'english', label: 'Английский' },
  ]

  const groups = [
    { value: 'all', label: 'Все группы' },
    { value: 'it-21-01', label: 'ПИ-22' },
    { value: 'it-21-02', label: 'ПИ-23' },
    { value: 'it-22-01', label: 'ПИ-24' },
    { value: 'it-22-02', label: 'ПИ-25' },
  ]

  return (
    <div className="bg-app-surface rounded-xl p-4 border border-app-border">
      <div className="flex items-center space-x-4 flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="text-app-muted" size={18} />
          <span className="text-app-muted/90 text-sm font-medium">Фильтры:</span>
        </div>

        <div className="flex items-center space-x-2">
          <Calendar className="text-app-muted" size={18} />
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="bg-app-surface-strong border border-app-border-strong rounded-lg px-3 py-2 text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className="bg-app-surface-strong border border-app-border-strong rounded-lg px-3 py-2 text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {subjects.map((subject) => (
            <option key={subject.value} value={subject.value}>
              {subject.label}
            </option>
          ))}
        </select>

        <select
          value={selectedGroup}
          onChange={(e) => onGroupChange(e.target.value)}
          className="bg-app-surface-strong border border-app-border-strong rounded-lg px-3 py-2 text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {groups.map((group) => (
            <option key={group.value} value={group.value}>
              {group.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default Filters

