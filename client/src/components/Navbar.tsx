import { Link } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'
import { selectUnreadCount } from '../features/notificationsSlice'
import { useGetNotificationsQuery } from '../api/apiSlice.ts'

export const Navbar = () => {
  useGetNotificationsQuery()
  const unreadCount = useAppSelector(selectUnreadCount)

  const navContent: React.ReactNode = (
    <div className="navContent">
      <div className="navLinks">
        <Link to="/main" className="link">
          Main
        </Link>
        <Link to="/notifications" className="link">
          Notifications {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </Link>
      </div>
    </div>
  )

  return (
    <nav>
      <section>
        <h1>Redux Essentials Example</h1>
        {navContent}
      </section>
    </nav>
  )
}
