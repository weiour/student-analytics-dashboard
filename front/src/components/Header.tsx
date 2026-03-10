import { Search, Bell, Settings, User } from 'lucide-react'

const Header = () => {
  return (
    <header className="bg-app-surface border-b border-app-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <Search className="text-app-muted" size={20} />
          <input
            type="text"
            placeholder="Поиск по студентам, группам, предметам..."
            className="bg-app-surface-strong border border-app-border-strong rounded-lg px-4 py-2 text-app-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 flex-1 max-w-md"
          />
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-app-surface-strong rounded-lg transition-colors">
            <Bell className="text-app-muted/90" size={20} />
          </button>
          <button className="p-2 hover:bg-app-surface-strong rounded-lg transition-colors">
            <Settings className="text-app-muted/90" size={20} />
          </button>
          <button className="flex items-center space-x-2 p-2 hover:bg-app-surface-strong rounded-lg transition-colors">
            <div className="w-8 h-8 bg-primary-700 rounded-full flex items-center justify-center">
              <User size={16} />
            </div>
            <span className="text-app-muted/90">Администратор</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header

