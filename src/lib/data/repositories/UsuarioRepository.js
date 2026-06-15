// src/lib/data/repositories/UsuarioRepository.js
import { supabase } from '../supabaseClient';

export const UsuarioRepository = {
  // ==========================================
  // Función para Iniciar Sesión
  // ==========================================
  autenticar: async (idEmpleado, password) => {
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
          rol:id_rol(nombre_rol)
        `)
        .eq('id_empleado', idLimpio)
        .single();

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
          rol: nombreRol
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
  }
};