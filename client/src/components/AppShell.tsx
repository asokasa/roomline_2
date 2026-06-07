import type { ReactNode } from 'react'
import sharedStyles from './Shared.module.css'
import type { Page } from '../appTypes'
import { pageTitles } from '../appHelpers'
import type { RoomSize, User } from '../types'
import styles from './AppShell.module.css'

type AppShellProps = {
  page: Page
  user: User | null
  theme: 'dark' | 'light'
  isAdmin: boolean
  tableCount: number
  roomSize: RoomSize
  children: ReactNode
  onNavigate: (page: Page) => void
  onToggleTheme: () => void
  onLogout: () => void
}

export function AppShell({
  page,
  user,
  theme,
  isAdmin,
  tableCount,
  roomSize,
  children,
  onNavigate,
  onToggleTheme,
  onLogout,
}: AppShellProps) {
  const navClass = (targetPage: Page) =>
    [styles.navLink, page === targetPage ? styles.navLinkActive : '']
      .filter(Boolean)
      .join(' ')

  return (
    <div className={styles.appShell}>
      <nav className={styles.navbar} aria-label="Fo navigacio">
        <button
          type="button"
          className={styles.brand}
          onClick={() => onNavigate('room')}
        >
          Roomlie
        </button>

        <div className={styles.navLinks}>
          <button
            type="button"
            className={navClass('room')}
            onClick={() => onNavigate('room')}
          >
            Terem
          </button>
          {!user ? (
            <>
              <button
                type="button"
                className={navClass('login')}
                onClick={() => onNavigate('login')}
              >
                Bejelentkezes
              </button>
              <button
                type="button"
                className={navClass('register')}
                onClick={() => onNavigate('register')}
              >
                Regisztracio
              </button>
            </>
          ) : null}
          {user?.role === 'user' ? (
            <button
              type="button"
              className={navClass('my-bookings')}
              onClick={() => onNavigate('my-bookings')}
            >
              Foglalasaim
            </button>
          ) : null}
          {isAdmin ? (
            <>
              <button
                type="button"
                className={navClass('add-table')}
                onClick={() => onNavigate('add-table')}
              >
                Asztal hozzaadasa
              </button>
              <button
                type="button"
                className={navClass('admin-bookings')}
                onClick={() => onNavigate('admin-bookings')}
              >
                Beerkezett foglalasok
              </button>
            </>
          ) : null}
        </div>

        <div className={styles.navUser}>
          {user ? (
            <span>
              {user.name}
              {isAdmin ? ' (admin)' : ''}
            </span>
          ) : (
            <span>Latogato</span>
          )}
          <button
            type="button"
            className={sharedStyles.button}
            onClick={onToggleTheme}
          >
            {theme === 'dark' ? 'Vilagos mod' : 'Sotet mod'}
          </button>
          {user ? (
            <button
              type="button"
              className={`${sharedStyles.button} ${sharedStyles.buttonSecondary}`}
              onClick={onLogout}
            >
              Kijelentkezes
            </button>
          ) : null}
        </div>
      </nav>

      <header className={styles.appHeader}>
        <div>
          <p className={styles.eyebrow}>Roomlie</p>
          <h1>{pageTitles[page]}</h1>
        </div>
        <div className={styles.headerMetrics} aria-label="Terem adatok">
          <span>{tableCount} asztal</span>
          <span>
            {roomSize.width} x {roomSize.height} px
          </span>
        </div>
      </header>

      {children}
    </div>
  )
}
