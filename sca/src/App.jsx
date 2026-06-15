import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/auth/Login';
import OperatorDashboard from './pages/operator/OperatorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import BusRegistration from './pages/operator/BusRegistration';

function App() {
  // Por ahora ponemos manunalmente que rol tiene el usuario:
  const userRole = 'operador'; // aqui podemos cambiar a "admin", "operador", recepcion

  return (
    <Router>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Ruta EXCLUSIVA para el encargado de Recepción/Registro */}
        <Route 
          path="/recepcion" 
          element={
            userRole === 'operador' ? <BusRegistration /> : <Navigate to="/login" />
          } 
        />

        {/* Rutas para (Mobile - Operadores) */}
        <Route 
          path="/operador/*" 
          element={
            userRole === 'operador' ? <OperatorDashboard /> : <Navigate to="/login" />
          } 
        />

        {/* Rutas para lo de UI (PC - Administradores/Supervisores) */}
        <Route 
          path="/admin/*" 
          element={
            userRole === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />
          } 
        />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;