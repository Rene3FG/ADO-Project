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

  // ==========================================
  // Alta de usuarios (Configuración Avanzada → Agregar usuario)
  // ==========================================
  listarRoles: () => apiFetch('/roles'),

  crear: ({ username, password, nombre, rol }) => {
    const [first_name, ...resto] = nombre.trim().split(' ');
    return apiFetch('/usuarios', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        first_name,
        last_name: resto.join(' ') || first_name,
        rol,
      }),
    });
  },

  // El resto del CRUD viejo (obtenerTodos/editar/eliminar, con area_asignada)
  // se quitó de aquí: apuntaba a la tabla vieja 'usuario'/'rol' en español,
  // que ya no existe. useUsuariosBloc.js (mobile) queda deshabilitado — esa
  // pantalla necesita además GET/PUT/DELETE /usuarios y resolver qué hacer
  // con "área asignada", que no existe como columna en la tabla real `users`.
};
