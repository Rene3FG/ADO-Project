// src/App.jsx
import { useState } from 'react';
import { LoginPage } from './lib/presentation/pages/LoginPage';
import { PatioPage } from './lib/presentation/pages/PatioPage';

function App() {
  // Estado global muy sencillo para saber si hay alguien logueado
  const [usuarioActual, setUsuarioActual] = useState(null);

  // Si no hay usuario, pintamos la pantalla de Login
  if (!usuarioActual) {
    return (
      <LoginPage 
        onLoginSuccess={(datosUsuario) => setUsuarioActual(datosUsuario)} 
      />
    );
  }

  // Si ya hay usuario, pintamos la pantalla del patio (y le pasamos los datos si los necesita)
  return (
    <PatioPage usuario={usuarioActual} />
  );
}

export default App;