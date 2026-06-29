import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Login from './pages/login/login.jsx'
import DropDrag from './pages/Patio/DropDrag.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { useAuth } from './context/AuthContext.jsx'

function App() {
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
      <Route 
        path="*" 
        element={<Navigate to="/" replace />} 
      />
    </Routes>
  )
}

export default App
