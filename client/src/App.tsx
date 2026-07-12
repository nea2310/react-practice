import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-tiny-toast'
import { Navbar } from './components/Navbar.tsx'
import Notifications from './features/Notifications.tsx'
import Main from './features/Main.tsx'

import { Navigate } from 'react-router-dom'
import Login from './features/Login.tsx'
import Register from './features/Register.tsx'
import { PrivateRoute } from './components/PrivateRoute.tsx'

function App() {
  return (
    <Router>
      <Navbar />
      <div className="App">
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Main />} />
          <Route path="/main" element={<Main />} />

          {/* Защищённые маршруты */}
          <Route element={<PrivateRoute />}>
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          {/* Редирект на главную для неизвестных маршрутов */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </div>
    </Router>
  )
}

export default App
