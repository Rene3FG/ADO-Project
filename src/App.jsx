import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
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
  const [verificandoSesion, setVerificandoSesion] = useState(true)

  // Restaura la sesión guardada para que un F5 no regrese al login
  useEffect(() => {
    const sesionGuardada = localStorage.getItem('sesionAdo')
    if (sesionGuardada) {
      try {
        setUsuarioActual(JSON.parse(sesionGuardada))
      } catch {
        localStorage.removeItem('sesionAdo')
      }
    }
    setVerificandoSesion(false)
  }, [])

  if (verificandoSesion) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <h2 style={{ color: '#6b21a8' }}>Cargando sistema...</h2>
      </div>
    )
  }

  if (!usuarioActual) {
    return (
      <LoginPage
        onLoginSuccess={(datos) => {
          localStorage.setItem('sesionAdo', JSON.stringify(datos))
          setUsuarioActual(datos)
        }}
      />
    )
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
