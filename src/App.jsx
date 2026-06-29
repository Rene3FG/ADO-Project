import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import './App.css'
import Login from './pages/login/login.jsx'
import DropDrag from './pages/Patio/DropDrag.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { useIsMobile } from './lib/hooks/useIsMobile.js'
import { LoginPage } from './lib/presentation/pages/LoginPage.jsx'
import { PatioPage } from './lib/presentation/pages/PatioPage.jsx'

function MobileApp() {
  const [usuarioActual, setUsuarioActual] = useState(null)

  if (!usuarioActual) {
    return <LoginPage onLoginSuccess={(datos) => setUsuarioActual(datos)} />
  }

  return <PatioPage usuario={usuarioActual} />
}

function DesktopApp() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Cargando aplicación...</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DropDrag />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileApp /> : <DesktopApp />
}

export default App
