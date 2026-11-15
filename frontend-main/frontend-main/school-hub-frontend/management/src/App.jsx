import { useState } from 'react'
import MgmtLogin from './components/MgmtLogin'
import MgmtSidebar from './components/MgmtSidebar'
import MgmtHeader from './components/MgmtHeader'
import ExecDashboard from './pages/ExecDashboard'
import FeeAnalytics from './pages/FeeAnalytics'
import TransportAnalytics from './pages/TransportAnalytics'
import Documents from './pages/Documents'
import Settings from './pages/Settings'
import styles from './App.module.css'

const PAGES = {
  dashboard:  ExecDashboard,
  fee:        FeeAnalytics,
  transport:  TransportAnalytics,
  documents:  Documents,
  settings:   Settings,
}

const PAGE_TITLES = {
  dashboard: 'Executive Dashboard',
  fee:       'Fee Analytics',
  transport: 'Transport Analytics',
  documents: 'Documents & Reports',
  settings:  'Settings',
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')

  function handleNavigate(page) {
    if (page === '__logout__') { setLoggedIn(false); setCurrentPage('dashboard'); return }
    setCurrentPage(page)
  }

  if (!loggedIn) return <MgmtLogin onLogin={() => setLoggedIn(true)} />

  const PageComponent = PAGES[currentPage] ?? ExecDashboard

  return (
    <div className={styles.shell}>
      <MgmtSidebar currentPage={currentPage} onNavigate={handleNavigate} />
      <div className={styles.body}>
        <MgmtHeader title={PAGE_TITLES[currentPage]} onNavigate={handleNavigate} />
        <main className={styles.main}>
          <PageComponent onNavigate={handleNavigate} />
        </main>
      </div>
    </div>
  )
}
