// src/lib/logic/usePatioBloc.js
import { useState, useEffect } from 'react';
import { AutobusRepository } from '../data/repositories/AutobusRepository';

export const usePatioBloc = () => {
  const [autobuses, setAutobuses] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busSeleccionado, setBusSeleccionado] = useState(null);
  const [areaDestino, setAreaDestino] = useState('');
  const [moviendo, setMoviendo] = useState(false);

  const cargarAutobuses = async () => {
    setCargando(true);
    try {
      const data = await AutobusRepository.obtenerAutobusesActivos();
      setAutobuses(data.filter(bus => bus.currentArea !== 'Salida'));
    } catch (error) {
      console.error("No se pudieron cargar los autobuses:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarAutobuses(); }, []);

  const abrirModalMover = (bus) => { setBusSeleccionado(bus); setAreaDestino(''); };
  const cerrarModal = () => { setBusSeleccionado(null); setAreaDestino(''); };
  const obtenerOcupacion = (nombreArea) => autobuses.filter(bus => bus.currentArea === nombreArea).length;

  const arrancarServicio = async (bus) => {
    try {
      await AutobusRepository.iniciarServicio(bus);
      await cargarAutobuses();
    } catch (error) {
      alert("Error al iniciar servicio.");
    }
  };

  const confirmarMovimiento = async () => {
    if (!areaDestino || !busSeleccionado) return;
    setMoviendo(true);
    try {
      await AutobusRepository.moverAutobus(busSeleccionado, areaDestino);
      await cargarAutobuses();
      cerrarModal();
    } catch (error) {
      alert("Error al mover la unidad.");
    } finally {
      setMoviendo(false);
    }
  };

  // NUEVA FUNCIÓN: Movimiento exclusivo y directo para Operadores
  const confirmarMovimientoDirecto = async (bus, destino) => {
    if (!destino || !bus) return;
    setMoviendo(true);
    try {
      await AutobusRepository.moverAutobus(bus, destino);
      await cargarAutobuses();
    } catch (error) {
      alert("Error al mover la unidad.");
    } finally {
      setMoviendo(false);
    }
  };

  return {
    autobuses, cargando, cargarAutobuses,
    busSeleccionado, areaDestino, setAreaDestino, moviendo,
    abrirModalMover, cerrarModal, confirmarMovimiento, obtenerOcupacion, arrancarServicio,
    confirmarMovimientoDirecto
  };
};