// src/lib/logic/useMenuBloc.js
import { useState } from 'react';

export const useMenuBloc = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Modal de confirmación antes de cerrar sesión
  const [modalCerrarSesionAbierto, setModalCerrarSesionAbierto] = useState(false);

  const alternarMenu = () => setMenuAbierto(!menuAbierto);
  const cerrarMenu = () => setMenuAbierto(false);

  const confirmarCerrarSesion = () => {
    setModalCerrarSesionAbierto(true);
    cerrarMenu(); // Cerramos la barra lateral en móviles al abrir el modal
  };
  const cancelarCerrarSesion = () => setModalCerrarSesionAbierto(false);

  // La API no tiene endpoint de logout: basta con tirar el JWT y la sesión
  // guardada, y recargar para limpiar el estado en memoria.
  const ejecutarCerrarSesion = () => {
    localStorage.removeItem('sca_token');
    localStorage.removeItem('sesionAdo');
    window.location.reload();
  };

  return {
    menuAbierto,
    alternarMenu,
    cerrarMenu,
    modalCerrarSesionAbierto,
    confirmarCerrarSesion,
    cancelarCerrarSesion,
    ejecutarCerrarSesion
  };
};
