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
    const data = await apiFetch('/login', {
      method: 'POST',
      body: JSON.stringify({ username: idLimpio, password }),
    });
    if (data.token) localStorage.setItem('sca_token', data.token);
    const { token: _t, ...usuario } = data;
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

  listar: () => apiFetch('/usuarios'),

  editar: (id, { nombre, rol, password }) => {
    const partes = nombre.trim().split(' ');
    const first_name = partes[0];
    const last_name = partes.slice(1).join(' ') || first_name;
    const body = { first_name, last_name, rol };
    if (password && password !== '***') body.password = password;
    return apiFetch(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  eliminar: (id) => apiFetch(`/usuarios/${id}`, { method: 'DELETE' }),
};
