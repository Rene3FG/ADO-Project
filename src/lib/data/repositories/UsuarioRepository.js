// src/lib/data/repositories/UsuarioRepository.js
//
// Login real: llama a POST /login en la SCA API (api.py, rama Excel), que
// verifica username/password contra users/roles (esquema del equipo
// Diseño/Formularios) con bcrypt en el servidor. Reemplaza el intento
// anterior contra Supabase Auth, que nunca pudo funcionar porque esa tabla
// no usa Supabase Auth (ver historial de este archivo).
import { apiFetch } from '../apiClient';

export const UsuarioRepository = {
  // ==========================================
  // Función para Iniciar Sesión
  // ==========================================
  autenticar: async (idEmpleado, password) => {
    const idLimpio = String(idEmpleado).trim();
    const usuario = await apiFetch('/login', {
      method: 'POST',
      body: JSON.stringify({ username: idLimpio, password }),
    });
    return { usuario };
  },

  // El CRUD de usuarios (obtenerTodos/guardarUsuario/eliminarUsuario) se quitó de aquí:
  // apuntaba a la tabla vieja 'usuario'/'rol' en español, que ya no existe.
  // useUsuariosBloc.js queda deshabilitado hasta coordinar con Formularios.
};
