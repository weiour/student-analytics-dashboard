import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { DataPoint } from '../../types'
interface LineChartProps {
  data: DataPoint[]
}

const LineChart = ({ data }: LineChartProps) => {
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
      <RechartsLineChart data={chartData}>
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
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
          name="Средний балл"
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

export default LineChart

