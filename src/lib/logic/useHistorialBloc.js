// src/lib/logic/useHistorialBloc.js
import { useState, useEffect } from 'react';
import { MovimientoRepository } from '../data/repositories/MovimientoRepository';

export const useHistorialBloc = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  const [filtroPeriodo, setFiltroPeriodo] = useState('hoy'); 
  const [fechaInicioPersonalizada, setFechaInicioPersonalizada] = useState('');
  const [fechaFinPersonalizada, setFechaFinPersonalizada] = useState('');

  const cargarHistorial = async () => {
    setCargando(true);
    setError('');
    
    let fechaInicio = null;
    let fechaFin = null;
    const ahora = new Date();

    if (filtroPeriodo === 'hoy') {
      fechaInicio = new Date(ahora.setHours(0,0,0,0)).toISOString();
    } else if (filtroPeriodo === 'semana') {
      const haceUnaSemana = new Date(ahora.setDate(ahora.getDate() - 7));
      fechaInicio = haceUnaSemana.toISOString();
    } else if (filtroPeriodo === 'mes') {
      const haceUnMes = new Date(ahora.setMonth(ahora.getMonth() - 1));
      fechaInicio = haceUnMes.toISOString();
    } else if (filtroPeriodo === 'personalizado') {
      if (fechaInicioPersonalizada) {
         fechaInicio = new Date(fechaInicioPersonalizada).toISOString();
      }
      if (fechaFinPersonalizada) {
         const fin = new Date(fechaFinPersonalizada);
         fin.setHours(23, 59, 59, 999);
         fechaFin = fin.toISOString();
      }
    }

    try {
      const data = await MovimientoRepository.obtenerHistorial(fechaInicio, fechaFin);
      setMovimientos(data);
    } catch (err) {
      setError('No se pudo cargar el historial.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, [filtroPeriodo, fechaInicioPersonalizada, fechaFinPersonalizada]);

  return {
    movimientos, cargando, error, filtroPeriodo, setFiltroPeriodo,
    fechaInicioPersonalizada, setFechaInicioPersonalizada,
    fechaFinPersonalizada, setFechaFinPersonalizada, cargarHistorial
  };
};