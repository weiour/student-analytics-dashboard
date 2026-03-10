import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { Metric } from '../../types'

interface MetricCardProps {
  metric: Metric
}

const MetricCard = ({ metric }: MetricCardProps) => {
  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return <ArrowUp className="text-emerald-600" size={16} />
      case 'down':
        return <ArrowDown className="text-rose-600" size={16} />
      default:
        return <Minus className="text-app-muted" size={16} />
    }
  }

  const getTrendColor = () => {
    switch (metric.trend) {
      case 'up':
        return 'text-emerald-600'
      case 'down':
        return 'text-rose-600'
      default:
        return 'text-app-muted'
    }
  }

  return (
    <div className="bg-app-surface rounded-xl p-6 border border-app-border hover:border-primary-500 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-app-muted text-sm font-medium mb-2">{metric.label}</p>
          <p className="text-2xl font-bold text-app-text mb-2">{metric.value}</p>
          {metric.change !== undefined && (
            <div className="flex items-center space-x-1">
              {getTrendIcon()}
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {metric.change > 0 ? '+' : ''}
                {metric.change}%
              </span>
              <span className="text-app-muted/80 text-sm">к прошлому периоду</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MetricCard


