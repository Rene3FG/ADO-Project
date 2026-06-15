// src/lib/logic/usePatioBloc.js
import { useState, useEffect } from 'react';
import { AutobusRepository } from '../data/repositories/AutobusRepository';

export const usePatioBloc = () => {
  const [autobuses, setAutobuses] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarAutobuses = async () => {
    setCargando(true);
    try {
      const data = await AutobusRepository.obtenerAutobusesActivos();
      setAutobuses(data);
    } catch (error) {
      console.error("No se pudieron cargar los autobuses");
    } finally {
      setCargando(false);
    }
  };

  // useEffect hace que esta función se ejecute sola al abrir la pantalla
  useEffect(() => {
    cargarAutobuses();
  }, []);

  return {
    autobuses,
    cargando,
    cargarAutobuses // Lo exportamos por si queremos poner un botón de "Actualizar"
  };
};