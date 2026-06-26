import '@fontsource/inter';
import { useState } from 'react';
import { useIsMobile } from './lib/hooks/useIsMobile';
import DropDrag from './pages/Patio/DropDrag.jsx';
import { LoginPage } from './lib/presentation/pages/LoginPage';
import { PatioPage } from './lib/presentation/pages/PatioPage';

function MobileApp() {
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
  return <PatioPage usuario={usuarioActual} />;
}

function App() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileApp />;
  }

  return (
    <div className="desktop-shell">
      <DropDrag />
    </div>
  );
}

export default App;
