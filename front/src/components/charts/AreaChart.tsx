import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { DataPoint } from '../../types'
interface AreaChartProps {
  data: DataPoint[]
}

const AreaChart = ({ data }: AreaChartProps) => {
  const chartData = data.map((point) => {
    const date = new Date(point.date)
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`
    return {
      date: formattedDate,
      value: point.value,
    }
  })

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsAreaChart data={chartData}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#d7dcea" />
        <XAxis
          dataKey="date"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          domain={[2.5, 5.5]}
          tickFormatter={(value) => value.toFixed(1)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#f8f9fc',
            border: '1px solid #d7dcea',
            borderRadius: '8px',
            color: '#1d2433',
          }}
          labelStyle={{ color: '#6b7280' }}
          formatter={(value: number) => [`${value.toFixed(2)}`, 'Средний балл']}
        />
        <Legend wrapperStyle={{ color: '#6b7280' }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorValue)"
          name="Средний балл"
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}

export default AreaChart

