import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Contingent from './components/Contingent'
import Analytics from './components/Analytics'
import Header from './components/Header'
import Reports from './components/Reports'
import Vsoko from './components/Vsoko'

function App() {
  const [selectedView, setSelectedView] = useState<string>('dashboard')

  return (
    <div className="flex h-screen bg-app-bg text-app-text overflow-hidden">
      <Sidebar selectedView={selectedView} onViewChange={setSelectedView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {selectedView === 'dashboard' && <Dashboard />}
          {selectedView === 'contingent' && <Contingent />}
          {selectedView === 'analytics' && <Analytics />}
          {selectedView === 'reports' && <Reports />}
          {selectedView === 'vsoko' && <Vsoko />}
        </main>
      </div>
    </div>
  )
}

export default App


