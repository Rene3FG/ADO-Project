import "./Login.css";
import { RiBus2Line } from "react-icons/ri";
import "./login.css";

function Login() {
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

          <div className="input-group">

            <label>NÚMERO DE EMPLEADO</label>

            <input
              type="text"
              placeholder="Ej: 1001"
            />

          </div>
        <div className="input-group">
           <label>CONTRASEÑA</label>

          <input
           type="password"
           placeholder="Ingresa tu contraseña"
           />
        </div>
          <button className="login-button">
            Entrar al sistema
          </button>

          <p className="help-text">
            Si no puedes entrar, contacta a tu supervisor para activar tu turno.
          </p>

        </div>

      </main>
    </>
  );
}

export default Login;