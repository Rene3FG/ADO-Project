// src/lib/logic/usePatioBloc.js
import { useState, useEffect } from 'react';
import { AutobusRepository } from '../data/repositories/AutobusRepository';
import { supabase } from '../data/supabaseClient';

const TIEMPOS_BASE = {
  'Desfogue': 15,
  'Diesel': 15,
  'Lavado Exterior': 20,
  'Lavado Interior': 20,
  'Ad-blue': 10,
  'Taller': 45,
  'Espera': 999 
};

export const usePatioBloc = () => {
  const [autobuses, setAutobuses] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busSeleccionado, setBusSeleccionado] = useState(null);
  const [areaDestino, setAreaDestino] = useState('');
  const [moviendo, setMoviendo] = useState(false);
  
  const [promediosArea, setPromediosArea] = useState(TIEMPOS_BASE);
  const [tick, setTick] = useState(0);

  const calcularPromediosDinamicos = (buses) => {
    let sumas = {};
    let conteos = {};
    
    Object.keys(TIEMPOS_BASE).forEach(area => {
      sumas[area] = TIEMPOS_BASE[area] * 3;
      conteos[area] = 3;
    });

    buses.forEach(bus => {
      Object.entries(bus.historialTiempos || {}).forEach(([area, tiempos]) => {
        if (tiempos.inicio && tiempos.fin) {
          const [hI, mI] = tiempos.inicio.split(':').map(Number);
          const [hF, mF] = tiempos.fin.split(':').map(Number);
          let diff = (hF * 60 + mF) - (hI * 60 + mI);
          if (diff < 0) diff += 24 * 60; 
          sumas[area] += diff;
          conteos[area] += 1;
        }
      });
    });

    let nuevosPromedios = {};
    Object.keys(sumas).forEach(area => {
      nuevosPromedios[area] = Math.round(sumas[area] / conteos[area]);
    });
    setPromediosArea(nuevosPromedios);
  };

  const cargarAutobuses = async () => {
    // Solo mostramos 'cargando' si la lista está completamente vacía (para no parpadear en Realtime)
    if (autobuses.length === 0) setCargando(true);
    
    try {
      const data = await AutobusRepository.obtenerAutobusesActivos();
      const activos = data.filter(bus => bus.currentArea !== 'Salida');
      setAutobuses(activos);
      calcularPromediosDinamicos(data);
    } catch (error) {
      console.error("No se pudieron cargar los autobuses:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    // 1. Carga inicial
    cargarAutobuses();

    // 2. Suscripción a los cambios en Tiempo Real
    const canalSuscripcion = supabase
      .channel('cambios-patio')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'autobus' },
        (payload) => {
          console.log('🔄 Sincronizando con patio en tiempo real...', payload);
          // Si alguien registra, mueve o inicia servicio, recargamos la lista silenciosamente
          cargarAutobuses(); 
        }
      )
      .subscribe();

    // 3. Reloj interno para los semáforos (actualiza colores cada 30 seg)
    const intervalo = setInterval(() => setTick(t => t + 1), 30000); 

    // Limpieza al desmontar
    return () => {
      clearInterval(intervalo);
      supabase.removeChannel(canalSuscripcion);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const abrirModalMover = (bus) => { setBusSeleccionado(bus); setAreaDestino(''); };
  const cerrarModal = () => { setBusSeleccionado(null); setAreaDestino(''); };
  const obtenerOcupacion = (nombreArea) => autobuses.filter(bus => bus.currentArea === nombreArea).length;

  const arrancarServicio = async (bus) => {
    try {
      await AutobusRepository.iniciarServicio(bus);
      // El Realtime se encarga de actualizar la vista
    } catch (error) { alert("Error al iniciar servicio."); }
  };

  const confirmarMovimiento = async () => {
    if (!areaDestino || !busSeleccionado) return;
    setMoviendo(true);
    try {
      await AutobusRepository.moverAutobus(busSeleccionado, areaDestino);
      cerrarModal();
      // El Realtime se encarga de actualizar la vista
    } catch (error) { alert("Error al mover la unidad."); } 
    finally { setMoviendo(false); }
  };

  const confirmarMovimientoDirecto = async (bus, destino) => {
    if (!destino || !bus) return;
    setMoviendo(true);
    try {
      await AutobusRepository.moverAutobus(bus, destino);
    } catch (error) { alert("Error al mover la unidad."); } 
    finally { setMoviendo(false); }
  };

  const obtenerSemaforo = (bus) => {
    if (bus.estadoServicio !== 'En Proceso' || !bus.historialTiempos[bus.currentArea]?.inicio) return null;

    const [hI, mI] = bus.historialTiempos[bus.currentArea].inicio.split(':').map(Number);
    const now = new Date();
    let elapsed = (now.getHours() * 60 + now.getMinutes()) - (hI * 60 + mI);
    if (elapsed < 0) elapsed += 24 * 60; 

    const promedio = promediosArea[bus.currentArea] || TIEMPOS_BASE[bus.currentArea];
    
    let color = 'verde';
    if (elapsed > promedio) color = 'rojo';
    else if (promedio - elapsed <= 5) color = 'naranja'; 

    return { color, elapsed, promedio };
  };

  return {
    autobuses, cargando, cargarAutobuses,
    busSeleccionado, areaDestino, setAreaDestino, moviendo,
    abrirModalMover, cerrarModal, confirmarMovimiento, obtenerOcupacion, arrancarServicio,
    confirmarMovimientoDirecto, obtenerSemaforo, promediosArea
  };
};