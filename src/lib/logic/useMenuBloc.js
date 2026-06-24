// src/lib/logic/useMenuBloc.js
import { useState } from 'react';

export const useMenuBloc = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const alternarMenu = () => setMenuAbierto(!menuAbierto);
  const cerrarMenu = () => setMenuAbierto(false);

  // No hay sesión de servidor que invalidar (no hay JWT/token todavía):
  // recargar basta para limpiar el estado en memoria y volver al Login.
  const cerrarSesion = () => {
    window.location.reload();
  };

  return {
    menuAbierto,
    alternarMenu,
    cerrarMenu,
    cerrarSesion
  };
};