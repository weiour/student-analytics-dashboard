import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { ChartData } from '../../types'

interface PieChartProps {
  data: ChartData[]
  onDrillDown?: (item: ChartData) => void
}

const PieChart = ({ data, onDrillDown }: PieChartProps) => {
  const COLORS = data.map((item) => item.color || '#3b82f6')

  const renderCustomLabel = (entry: ChartData) => {
    // Если значение меньше 5, это балл - не показываем процент
    if (entry.value < 5) {
      return `${entry.name}: ${entry.value.toFixed(2)}`
    }
    // Иначе показываем процент
    const percentage = ((entry.value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)
    return `${entry.name}: ${percentage}%`
  }

  const handleClick = (entry: ChartData) => {
    if (onDrillDown) {
      onDrillDown(entry)
    }
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          onClick={(_, index) => handleClick(data[index])}
          style={{ cursor: onDrillDown ? 'pointer' : 'default' }}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#f8f9fc',
            border: '1px solid #d7dcea',
            borderRadius: '8px',
            color: '#1d2433',
          }}
          formatter={(value: number) => {
            // Если значение меньше 5, это балл
            if (value < 5) {
              return [`${value.toFixed(2)}`, 'Средний балл']
            }
            // Иначе это количество
            return [`${value}`, 'Количество']
          }}
        />
        <Legend
          wrapperStyle={{ color: '#6b7280' }}
          formatter={(value, entry: any) => {
            const val = entry.payload.value
            if (val < 5) {
              return <span style={{ color: '#6b7280' }}>{value}: {val.toFixed(2)} балл</span>
            }
            return <span style={{ color: '#6b7280' }}>{value}: {val}</span>
          }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}

export default PieChart

