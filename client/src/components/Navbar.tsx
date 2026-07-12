// components/Navbar.tsx
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { selectIsAuthenticated, selectCurrentUser, logout } from '../features/authSlice'
import { selectUnreadCount } from '../features/notificationsSlice.ts'
import { useGetNotificationsQuery } from '../api/apiSlice.ts'

export const Navbar = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  // Подписка на уведомления, если пользователь авторизован
  useGetNotificationsQuery(undefined, {
    skip: !isAuthenticated,
  })

  const unreadCount = useAppSelector(selectUnreadCount)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <nav>
      <section>
        <h1>Redux Essentials Example</h1>
        <div className="navContent">
          <div className="navLinks">
            <Link to="/main">Main</Link>
            {isAuthenticated && (
              <Link to="/notifications">
                Notifications
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                {/* здесь можно добавить бейдж */}
              </Link>
            )}
          </div>
          <div className="authLinks">
            {!isAuthenticated ? (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            ) : (
              <>
                <span>Hello, {user?.username}</span>
                <button onClick={handleLogout}>Logout</button>
              </>
            )}
          </div>
        </div>
      </section>
    </nav>
  )
}
