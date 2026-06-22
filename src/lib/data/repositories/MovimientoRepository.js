// src/lib/data/repositories/MovimientoRepository.js
import { supabase } from '../supabaseClient';

export const MovimientoRepository = {
  obtenerHistorial: async (fechaInicio, fechaFin) => {
    let query = supabase
      .from('bitacora_movimiento')
      .select(`
        id_movimiento,
        hora_entrada,
        hora_salida,
        autobus:id_autobus ( numero_serie, tipo_unidad ),
        area:id_area ( nombre_area )
      `)
      .order('hora_entrada', { ascending: false });

    if (fechaInicio) {
      query = query.gte('hora_entrada', fechaInicio);
    }
    if (fechaFin) {
      query = query.lte('hora_entrada', fechaFin);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error al obtener historial en Supabase:", error);
      throw new Error(error.message);
    }

    return data;
  }
};