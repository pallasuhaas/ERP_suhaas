import { useState } from 'react'
import LoginPage from './components/LoginPage'
import BottomNav from './components/BottomNav'
import NavSidebar from './components/NavSidebar'
import Dashboard from './pages/Dashboard'
import Finance from './pages/Finance'
import Transport from './pages/Transport'
import Notifications from './pages/Notifications'
import Chat from './pages/Chat'
import Receipt from './pages/Receipt'
import Help from './pages/Help'
import Settings from './pages/Settings'
import styles from './App.module.css'

const NAV_PAGES = ['home', 'fees', 'bus', 'alerts', 'chat']

const PAGES = {
  home:     Dashboard,
  fees:     Finance,
  bus:      Transport,
  alerts:   Notifications,
  chat:     Chat,
  receipt:  Receipt,
  help:     Help,
  settings: Settings,
  history:  Finance,
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [currentPage, setCurrentPage] = useState('home')
  // parentData: { guardians, children, name, initials, phone }
  const [parentData, setParentData] = useState(null)
  // activeChildId: the currently-selected child's studentId
  const [activeChildId, setActiveChildId] = useState(null)

  function handleLogin(guardians) {
    // Build a deduplicated list of children from all guardian records
    const childMap = new Map()
    for (const g of guardians) {
      if (g.student) childMap.set(g.student.studentId, g.student)
    }
    const children = [...childMap.values()]

    const firstName = guardians[0]?.fullName?.split(' ')[0] || 'Parent'
    const fullName = guardians[0]?.fullName || 'Parent'
    const phone = guardians[0]?.phone || ''
    const initials = fullName
      .split(' ')
      .slice(0, 2)
      .map(p => p[0])
      .join('')
      .toUpperCase()

    setParentData({ guardians, children, name: fullName, initials, phone })
    // Default to first child
    setActiveChildId(children[0]?.studentId ?? null)
    setLoggedIn(true)
  }

  function handleNavigate(page) {
    if (page === '__logout__') {
      setLoggedIn(false)
      setParentData(null)
      setCurrentPage('home')
      return
    }
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  if (!loggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  const PageComponent = PAGES[currentPage] ?? Dashboard
  const isSubPage = !NAV_PAGES.includes(currentPage)

  // Extra props for pages that need deep-link state
  const extraProps = {}
  if (currentPage === 'history') extraProps.initialTab = 'history'

  return (
    <div className={styles.shell}>
      {/* Desktop sidebar — hidden on mobile via CSS */}
      <NavSidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        parentData={parentData}
        activeChildId={activeChildId}
        onChildChange={setActiveChildId}
      />

      {/* Content column */}
      <div className={styles.contentCol}>
        <main className={`${styles.main} ${!isSubPage ? styles.mainWithNav : ''}`}>
          <PageComponent
            onNavigate={handleNavigate}
            parentData={parentData}
            activeChildId={activeChildId}
            onChildChange={setActiveChildId}
            {...extraProps}
          />
        </main>

        {/* Mobile bottom nav — hidden on desktop via CSS */}
        {!isSubPage && (
          <BottomNav
            currentPage={currentPage}
            onNavigate={handleNavigate}
            navPages={NAV_PAGES}
          />
        )}
      </div>
    </div>
  )
}
