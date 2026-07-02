// src/lib/logic/useMenuBloc.js
import { useState } from 'react';
import { UsuarioRepository } from '../data/repositories/UsuarioRepository';

export const useMenuBloc = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  
  // NUEVO: Estado para el modal de cerrar sesión
  const [modalCerrarSesionAbierto, setModalCerrarSesionAbierto] = useState(false);

  const alternarMenu = () => setMenuAbierto(!menuAbierto);
  const cerrarMenu = () => setMenuAbierto(false);

  // Funciones para manejar la ventana de confirmación
  const confirmarCerrarSesion = () => {
    setModalCerrarSesionAbierto(true);
    cerrarMenu(); // Cerramos la barra lateral en móviles al abrir el modal
  };
  const cancelarCerrarSesion = () => setModalCerrarSesionAbierto(false);

  // Función real que destruye la sesión
  const ejecutarCerrarSesion = async () => {
    try {
      await UsuarioRepository.cerrarSesion();
      localStorage.removeItem('sesionAdo');
      window.location.reload(); 
    } catch (error) {
      console.error("Error al salir:", error);
    }
  };

  return {
    menuAbierto,
    alternarMenu,
    cerrarMenu,
    // Exportamos las nuevas funciones del modal
    modalCerrarSesionAbierto,
    confirmarCerrarSesion,
    cancelarCerrarSesion,
    ejecutarCerrarSesion
  };
};