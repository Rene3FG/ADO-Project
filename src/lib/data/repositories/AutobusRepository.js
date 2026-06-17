// src/lib/data/repositories/AutobusRepository.js
import { supabase } from '../supabaseClient';

export const AutobusRepository = {
  registrarAutobus: async (datos) => {
    const now = new Date();
    const [hours, minutes] = datos.horaSalida.split(':');
    const depDate = new Date();
    depDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    if (depDate < now) depDate.setDate(depDate.getDate() + 1);
    const esPrioridad = ((depDate - now) / (1000 * 60)) <= 60;

    const { data, error } = await supabase
      .from('autobus')
      .insert([{
        numero_serie: datos.numeroSerie,
        tipo_unidad: datos.tipoUnidad,
        tiene_bano: datos.tipoUnidad !== 'AU',
        estado_actual: datos.areaInicial,
        hora_salida: datos.horaSalida,
        areas_requeridas: datos.areasRequeridas,
        areas_completadas: [],
        porcentaje_avance: 0,
        es_prioridad: esPrioridad,
        observaciones: datos.observaciones,
        estado_servicio: 'Pendiente',
        historial_tiempos: {}
      }]);

    if (error) throw new Error(error.message);
    return data;
  },

  obtenerAutobusesActivos: async () => {
    const { data, error } = await supabase
      .from('autobus')
      .select('*')
      .order('id_autobus', { ascending: false });

    if (error) throw new Error(error.message);

    return data.map(item => ({
      id_autobus: item.id_autobus,
      busId: item.numero_serie,
      busType: item.tipo_unidad,
      departureTime: item.hora_salida ? item.hora_salida.substring(0, 5) : '00:00',
      requiredAreas: item.areas_requeridas || [],
      completedAreas: item.areas_completadas || [],
      currentArea: item.estado_actual,
      progressPercentage: item.porcentaje_avance,
      isPriority: item.es_prioridad,
      estadoServicio: item.estado_servicio,
      historialTiempos: item.historial_tiempos || {},
      ingresoPatio: item.hora_ingreso_patio
    }));
  },

  // NUEVO: Registrar hora de inicio de servicio
  iniciarServicio: async (bus) => {
    const horaActual = new Date().toLocaleTimeString('es-MX', { hour12: false, hour: '2-digit', minute:'2-digit' });
    const nuevoHistorial = { ...bus.historialTiempos };
    
    nuevoHistorial[bus.currentArea] = { 
      ...nuevoHistorial[bus.currentArea], 
      inicio: horaActual 
    };

    const { data, error } = await supabase
      .from('autobus')
      .update({ estado_servicio: 'En Proceso', historial_tiempos: nuevoHistorial })
      .eq('id_autobus', bus.id_autobus);

    if (error) throw new Error(error.message);
    return data;
  },

  moverAutobus: async (bus, nuevaArea) => {
    let completadas = [...(bus.completedAreas || [])];
    if (bus.requiredAreas.includes(bus.currentArea) && !completadas.includes(bus.currentArea)) {
      completadas.push(bus.currentArea);
    }
    const totalRequeridas = bus.requiredAreas.length;
    const nuevoPorcentaje = totalRequeridas === 0 ? 100 : Math.round((completadas.length / totalRequeridas) * 100);

    // Registramos la hora de fin en el historial del área que está dejando
    const horaActual = new Date().toLocaleTimeString('es-MX', { hour12: false, hour: '2-digit', minute:'2-digit' });
    const nuevoHistorial = { ...bus.historialTiempos };
    if (!nuevoHistorial[bus.currentArea]) nuevoHistorial[bus.currentArea] = {};
    nuevoHistorial[bus.currentArea].fin = horaActual;

    const updates = { 
      estado_actual: nuevaArea, 
      areas_completadas: completadas,
      porcentaje_avance: nuevoPorcentaje,
      estado_servicio: 'Pendiente', // Al llegar a la nueva área, vuelve a estar pendiente
      historial_tiempos: nuevoHistorial,
      tiempo_en_area: 0 
    };

    // Si se va del patio, sellamos la hora de salida global
    if (nuevaArea === 'Salida') {
        updates.hora_salida_patio = new Date().toISOString();
    }

    const { data, error } = await supabase.from('autobus').update(updates).eq('id_autobus', bus.id_autobus);
    if (error) throw new Error(error.message);
    return data;
  }
};