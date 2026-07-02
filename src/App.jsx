// src/App.jsx
import { useState, useEffect } from 'react';
import { LoginPage } from './lib/presentation/pages/LoginPage';
import { PatioPage } from './lib/presentation/pages/PatioPage';

function App() {
  // Estado global para saber si hay alguien logueado
  const [usuarioActual, setUsuarioActual] = useState(null);
  
  // Nuevo estado para evitar que parpadee el Login mientras lee la memoria
  const [verificandoSesion, setVerificandoSesion] = useState(true);

  // Revisa la memoria cuando el usuario entra o presiona F5
  useEffect(() => {
    const sesionGuardada = localStorage.getItem('sesionAdo');
    if (sesionGuardada) {
      setUsuarioActual(JSON.parse(sesionGuardada));
    }
    setVerificandoSesion(false);
  }, []);

  // Pantalla de carga mientras lee el disco
  if (verificandoSesion) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <h2 style={{ color: '#6b21a8' }}>Cargando sistema...</h2>
      </div>
    );
  }

  // Si no hay usuario, pintamos la pantalla de Login
  if (!usuarioActual) {
    return (
      <LoginPage 
        onLoginSuccess={(datosUsuario) => {
          setUsuarioActual(datosUsuario);
          // Guardamos el usuario en la memoria al loguearse
          localStorage.setItem('sesionAdo', JSON.stringify(datosUsuario));
        }} 
      />
    );
  }

  // Si ya hay usuario, pintamos la pantalla del patio (y le pasamos los datos si los necesita)
  return (
    <PatioPage usuario={usuarioActual} />
  );
}

export default App;