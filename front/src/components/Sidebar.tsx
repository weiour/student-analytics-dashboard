import { LayoutDashboard, PieChart, FileText, Download, Users, ClipboardList } from 'lucide-react'

interface SidebarProps {
  selectedView: string
  onViewChange: (view: string) => void
}

const Sidebar = ({ selectedView, onViewChange }: SidebarProps) => {
  const menuItems = [
    { id: 'dashboard', label: 'Графики', icon: LayoutDashboard },
    { id: 'contingent', label: 'Контингент', icon: Users },
    { id: 'vsoko', label: 'ВСОКО', icon: ClipboardList },
    { id: 'analytics', label: 'Чат-аналитика', icon: PieChart },
    { id: 'reports', label: 'Отчёты', icon: FileText },
    { id: 'export', label: 'Экспорт', icon: Download },
  ]

  return (
    <aside className="w-64 bg-app-surface border-r border-app-border flex flex-col">
      <div className="p-6 border-b border-app-border">
        <h1 className="text-2xl font-bold text-app-text">
          АГУИККИ <span className="text-primary-700">BI</span>
        </h1>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = selectedView === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-700 text-white'
                      : 'text-app-muted/90 hover:bg-app-surface-strong'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar

