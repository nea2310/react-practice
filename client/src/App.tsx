import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-tiny-toast'
import { Navbar } from './components/Navbar.tsx'
import Notifications from './features/Notifications.tsx'
import Main from './features/Main.tsx'
function App() {
  return (
    <Router>
      <Navbar />
      <div className="App">
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/main" element={<Main />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
        <ToastContainer />
      </div>
    </Router>
  )
}

export default App
