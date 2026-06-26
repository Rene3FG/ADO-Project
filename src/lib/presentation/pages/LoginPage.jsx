// src/lib/presentation/pages/LoginPage.jsx
import { useAuthBloc } from '../../logic/useAuthBloc';
import '../styles/LoginPage.css';

export const LoginPage = ({ onLoginSuccess }) => {
  // Inyectamos nuestro BLoC
  const {
    idEmpleado, setIdEmpleado,
    password, setPassword,
    error, cargando, iniciarSesion
  } = useAuthBloc(onLoginSuccess);

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Aquí puedes poner el logo real de ADO más adelante */}
        <div className="login-header">
          <h1 className="login-logo">ADO</h1>
          <h2>Sistema de Control de Autobuses</h2>
        </div>

        <form onSubmit={iniciarSesion} className="login-form">
          <div className="input-group">
            <label htmlFor="idEmpleado">ID de Empleado</label>
            <input
              type="text"
              id="idEmpleado"
              value={idEmpleado}
              onChange={(e) => setIdEmpleado(e.target.value)}
              placeholder="ID de empleado"
              required
              disabled={cargando}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={cargando}
            />
          </div>

          {/* Manejo de Errores Visual */}
          {error && <div className="error-mensaje">⚠️ {error}</div>}

          <button type="submit" className="btn-ingresar" disabled={cargando}>
            {cargando ? 'Verificando...' : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};