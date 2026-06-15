// src/lib/logic/useMenuBloc.js
import { useState } from 'react';
import { UsuarioRepository } from '../data/repositories/UsuarioRepository';

export const useMenuBloc = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const alternarMenu = () => setMenuAbierto(!menuAbierto);
  const cerrarMenu = () => setMenuAbierto(false);

  // Nueva función para salir de la app
  const cerrarSesion = async () => {
    try {
      await UsuarioRepository.cerrarSesion();
      window.location.reload(); // Recarga la página para limpiar el estado y volver al Login
    } catch (error) {
      console.error("Error al salir:", error);
    }
  };

  return {
    menuAbierto,
    alternarMenu,
    cerrarMenu,
    cerrarSesion
  };
};