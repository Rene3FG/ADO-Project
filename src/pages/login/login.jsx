import { useState } from "react";
import { RiBus2Line } from "react-icons/ri";
import authService from "../../services/authService.js";
import "./login.css";

function Login() {
  const [numeroEmpleado, setNumeroEmpleado] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!numeroEmpleado.trim() || !contrasena.trim()) {
        setError("Por favor completa todos los campos");
        setLoading(false);
        return;
      }

      const response = await authService.login(numeroEmpleado, contrasena);
      console.log("Login exitoso:", response);
      
      // Redirect to dashboard or home page
      // For now, just show success
      alert(`Bienvenido ${response.usuario?.nombre || numeroEmpleado}`);
      // TODO: Redirect to /dashboard or main app
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="top-bar">
        <div className="header-content">
          <div className="mini-bus">
            <RiBus2Line />
          </div>

          <div>
            <h2>ADO - Control de patio</h2>
            <p>Operaciones de flota</p>
          </div>
        </div>
      </header>

      <main className="login-container">
        <div className="login-card">
          <div className="bus-icon">
            <RiBus2Line className="bus-svg" />
          </div>

          <h1>Control de Patio</h1>

          <p className="subtitle">
            Ingresa tu número de empleado para continuar
          </p>

          {error && <div className="error-message" style={{ color: '#ef4444', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>NÚMERO DE EMPLEADO</label>
              <input
                type="text"
                placeholder="Ej: 1001"
                value={numeroEmpleado}
                onChange={(e) => setNumeroEmpleado(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label>CONTRASEÑA</label>
              <input
                type="password"
                placeholder="Ingresa tu contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                disabled={loading}
              />
            </div>

            <button 
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Validando..." : "Entrar al sistema"}
            </button>
          </form>

          <p className="help-text">
            Si no puedes entrar, contacta a tu supervisor para activar tu turno.
          </p>
        </div>
      </main>
    </>
  );
}

export default Login;
