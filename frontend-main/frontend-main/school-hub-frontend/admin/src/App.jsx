import { useState } from 'react'
import AdminLogin from './components/AdminLogin'
import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'
import ErrorBoundary from './components/ErrorBoundary'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Finance from './pages/Finance'
import Transport from './pages/Transport'
import Communication from './pages/Communication'
import Settings from './pages/Settings'
import styles from './App.module.css'

const PAGES = {
  dashboard:     Dashboard,
  students:      Students,
  finance:       Finance,
  transport:     Transport,
  communication: Communication,
  settings:      Settings,
}

const PAGE_TITLES = {
  dashboard:     'Dashboard',
  students:      'Student Management',
  finance:       'Finance',
  transport:     'Transport',
  communication: 'Communication',
  settings:      'Settings',
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')

  function handleNavigate(page) {
    if (page === '__logout__') { setLoggedIn(false); setCurrentPage('dashboard'); return }
    setCurrentPage(page)
  }

  if (!loggedIn) return <AdminLogin onLogin={() => setLoggedIn(true)} />

  const PageComponent = PAGES[currentPage] ?? Dashboard

  return (
    <div className={styles.shell}>
      <AdminSidebar currentPage={currentPage} onNavigate={handleNavigate} />
      <div className={styles.body}>
        <AdminHeader title={PAGE_TITLES[currentPage]} onNavigate={handleNavigate} />
        <main className={styles.main}>
          <ErrorBoundary key={currentPage}>
            <PageComponent onNavigate={handleNavigate} />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
