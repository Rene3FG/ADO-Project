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

    // 1. Insertamos el camión
    const { data: busData, error: busError } = await supabase
      .from('autobus')
      .insert([{
        numero_serie: datos.numeroSerie,
        tipo_unidad: datos.tipoUnidad,
        tiene_bano: datos.tipoUnidad !== 'AU',
        estado_actual: datos.areaInicial,
        hora_salida: datos.horaSalida.length === 5 ? `${datos.horaSalida}:00` : datos.horaSalida,
        areas_requeridas: datos.areasRequeridas,
        areas_completadas: [],
        porcentaje_avance: 0,
        es_prioridad: esPrioridad,
        observaciones: datos.observaciones,
        estado_servicio: 'Pendiente',
        historial_tiempos: {}
      }])
      .select();

    if (busError) throw new Error(`Fallo al guardar camión: ${busError.message}`);
    const nuevoBus = busData[0];

    // 2. Buscamos el ID del área usando maybeSingle() para evitar el Error 406
    const { data: areaData, error: areaError } = await supabase
      .from('area')
      .select('id_area')
      .eq('nombre_area', datos.areaInicial)
      .maybeSingle();

    if (areaError) console.error("Error al buscar área:", areaError);

    // 3. Escribimos en la bitácora y forzamos el aviso si falla
    if (areaData) {
      const { error: bitacoraError } = await supabase.from('bitacora_movimiento').insert([{
        id_autobus: nuevoBus.id_autobus,
        id_area: areaData.id_area,
        hora_entrada: new Date().toISOString()
      }]);
      
      // Si la bitácora falla, ahora sí saltará el error en la pantalla roja
      if (bitacoraError) throw new Error(`El camión se registró, pero falló el historial: ${bitacoraError.message}`);
    } else {
      console.warn(`⚠️ No se encontró un área llamada exactamente '${datos.areaInicial}' en tu tabla 'area'.`);
    }

    return nuevoBus;
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

    const horaActual = new Date().toLocaleTimeString('es-MX', { hour12: false, hour: '2-digit', minute:'2-digit' });
    const nuevoHistorial = { ...bus.historialTiempos };
    if (!nuevoHistorial[bus.currentArea]) nuevoHistorial[bus.currentArea] = {};
    nuevoHistorial[bus.currentArea].fin = horaActual;

    const updates = { 
      estado_actual: nuevaArea, 
      areas_completadas: completadas,
      porcentaje_avance: nuevoPorcentaje,
      estado_servicio: 'Pendiente', 
      historial_tiempos: nuevoHistorial,
      tiempo_en_area: 0 
    };

    if (nuevaArea === 'Salida') updates.hora_salida_patio = new Date().toISOString();

    const { data, error } = await supabase.from('autobus').update(updates).eq('id_autobus', bus.id_autobus);
    if (error) throw new Error(error.message);

    // Cerramos el registro anterior en la bitácora
    await supabase.from('bitacora_movimiento')
      .update({ hora_salida: new Date().toISOString() })
      .eq('id_autobus', bus.id_autobus)
      .is('hora_salida', null); 

    // Abrimos un nuevo registro en la bitácora usando maybeSingle()
    if (nuevaArea !== 'Salida') {
      const { data: areaData } = await supabase.from('area').select('id_area').eq('nombre_area', nuevaArea).maybeSingle();
      if (areaData) {
        await supabase.from('bitacora_movimiento').insert([{
          id_autobus: bus.id_autobus,
          id_area: areaData.id_area,
          hora_entrada: new Date().toISOString()
        }]);
      }
    }

    return data;
  }
};