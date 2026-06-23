// src/lib/data/repositories/UsuarioRepository.js
//
// TODO (login no funcional): este código asume Supabase Auth
// (auth.signInWithPassword contra un correo falso "<id>@ado.local") más una
// tabla 'usuario'/'rol' en español. Verificado contra el esquema real
// (2026-06-23): la tabla 'users' tiene su propio 'password_hash' — no usa
// Supabase Auth en absoluto — y se llama 'users'/'roles' (inglés), no
// 'usuario'/'rol'. autenticar() de abajo no puede funcionar tal cual contra
// producción. Arreglarlo de verdad requiere decidir con el equipo de
// Formularios (dueño de users/roles) cómo se verifica el password — lo más
// probable es un endpoint de login nuevo que compare el hash en el servidor,
// no algo que se pueda hacer con el anon key desde el cliente. No se
// improvisa esa solución aquí; queda fuera de alcance de esta integración.
import { supabase } from '../supabaseClient';

export const UsuarioRepository = {
  // ==========================================
  // Función para Iniciar Sesión
  // ==========================================
  autenticar: async (idEmpleado, password) => {
    if (!supabase) {
      throw new Error('Login no configurado/funcional todavía (ver TODO en este archivo).');
    }
    try {
      // 1. Limpiamos el ID y armamos el correo interno
      const idLimpio = String(idEmpleado).trim();
      const emailInterno = `${idLimpio}@ado.local`;
      
      console.log("Intentando login con:", emailInterno);

      // 2. Autenticación con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailInterno,
        password: password,
      });

      if (authError) {
        console.error("🔥 Error real de Supabase Auth:", authError);
        throw new Error(`Detalle técnico: ${authError.message}`); 
      }

      // 3. Consulta a la tabla 'usuario' con relación explícita a la tabla 'rol'
      const { data: perfilData, error: perfilError } = await supabase
        .from('usuario')
        .select(`
          nombre,
          id_rol,
          area_asignada,
          rol:id_rol(nombre_rol)
        `)
        .eq('id_empleado', idLimpio)
        .maybeSingle();

      if (perfilError) {
        console.error("🔥 Error al buscar el perfil:", perfilError);
        throw new Error('No se pudo cargar el perfil del usuario.');
      }

      // 4. Extracción segura del rol
      const nombreRol = (perfilData.rol && perfilData.rol.nombre_rol) 
        ? perfilData.rol.nombre_rol 
        : 'Rol Desconocido';

      // 5. Retorno de los datos empaquetados
      return {
        sesion: authData.session,
        usuario: {
          id: idLimpio,
          nombre: perfilData.nombre,
          rol: nombreRol,
          areaAsignada: perfilData.area_asignada // Agregamos esto
        }
      };

    } catch (error) {
      console.error("Error general en autenticar:", error.message);
      throw error; 
    }
  },

  // ==========================================
  // Función para Cerrar Sesión
  // ==========================================
  cerrarSesion: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Error al cerrar sesión:", error.message);
        throw error;
    }
  },

  // El CRUD de usuarios (obtenerTodos/guardarUsuario/eliminarUsuario) se quitó de aquí:
  // apuntaba a la tabla vieja 'usuario'/'rol' en español, que ya no existe.
  // useUsuariosBloc.js queda deshabilitado hasta coordinar con Formularios.
};