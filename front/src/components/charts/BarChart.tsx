import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ChartData } from '../../types'

interface BarChartProps {
  data: ChartData[]
  onDrillDown?: (item: ChartData) => void
}

const BarChart = ({ data, onDrillDown }: BarChartProps) => {

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d7dcea" />
        <XAxis
          dataKey="name"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#f8f9fc',
            border: '1px solid #d7dcea',
            borderRadius: '8px',
            color: '#1d2433',
          }}
          labelStyle={{ color: '#6b7280' }}
          formatter={(value: number) => {
            // Если значение меньше 5, это балл
            if (value < 5) {
              return [`${value.toFixed(2)}`, 'Средний балл']
            }
            // Иначе это количество студентов
            return [`${value.toLocaleString()}`, 'Количество студентов']
          }}
        />
        <Legend wrapperStyle={{ color: '#6b7280' }} />
        <Bar
          dataKey="value"
          fill="#3b82f6"
          radius={[8, 8, 0, 0]}
          name="Значение"
          style={{ cursor: onDrillDown ? 'pointer' : 'default' }}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

export default BarChart

