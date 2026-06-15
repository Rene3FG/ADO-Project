// src/lib/data/repositories/AutobusRepository.js
import { supabase } from '../supabaseClient';

export const AutobusRepository = {
  registrarAutobus: async (numeroSerie, tipoUnidad, tieneBano) => {
    // Insertamos los datos en la tabla 'autobus'
    // 'estado_actual' y 'tiempo_en_area' tomarán sus valores por defecto ('En espera' y 0)
    const { data, error } = await supabase
      .from('autobus')
      .insert([
        {
          numero_serie: numeroSerie,
          tipo_unidad: tipoUnidad,
          tiene_bano: tieneBano
        }
      ]);

    if (error) {
      console.error("Error en Supabase al registrar:", error);
      throw new Error(error.message);
    }

    return data;
  },
// NUEVA FUNCIÓN: Traer los autobuses del patio
  obtenerAutobusesActivos: async () => {
    const { data, error } = await supabase
      .from('autobus')
      .select('*')
      .order('id_autobus', { ascending: false }); // Los más recientes primero

    if (error) {
      console.error("Error al obtener autobuses:", error);
      throw new Error(error.message);
    }

    return data;
  }
};