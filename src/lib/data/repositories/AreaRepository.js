// src/lib/data/repositories/AreaRepository.js
import { supabase } from '../supabaseClient';

export const AreaRepository = {
  obtenerTodas: async () => {
    const { data, error } = await supabase
      .from('area')
      .select('*')
      .order('id_area', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  },

  guardarArea: async (datos, esNueva) => {
    const payload = {
      nombre_area: datos.nombre_area,
      capacidad: parseInt(datos.capacidad),
      icono: datos.icono || '📍'
    };

    if (esNueva) {
      const { data, error } = await supabase.from('area').insert([payload]);
      if (error) throw new Error(error.message);
      return data;
    } else {
      const { data, error } = await supabase.from('area').update(payload).eq('id_area', datos.id_area);
      if (error) throw new Error(error.message);
      return data;
    }
  },

  eliminarArea: async (id_area) => {
    const { error } = await supabase.from('area').delete().eq('id_area', id_area);
    if (error) throw new Error(error.message);
    return true;
  }
};