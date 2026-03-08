import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Layout.module.css'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>💊</span>
          <span>SIAD-PrEP</span>
        </div>
        <nav className={styles.nav}>
          <NavLink to="/pacientes" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            👥 Pacientes
          </NavLink>
          <NavLink to="/consultas" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            📅 Consultas
          </NavLink>
        </nav>
        <div className={styles.userArea}>
          <span className={styles.userName}>{user?.name}</span>
          <span className={styles.userRole}>{user?.role}</span>
          <button className="btn-outline" onClick={handleLogout}>Sair</button>
        </div>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
