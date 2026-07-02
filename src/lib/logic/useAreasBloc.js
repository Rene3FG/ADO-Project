// src/lib/logic/useAreasBloc.js
// CRUD de estaciones de patio (Config. Avanzada) contra la SCA API.
import { useState, useEffect } from 'react';
import { AreaRepository } from '../data/repositories/AreaRepository';

export const useAreasBloc = () => {
  const [areas, setAreas] = useState([]);
  const [cargandoAreas, setCargandoAreas] = useState(true);

  const [modalAreaAbierto, setModalAreaAbierto] = useState(false);
  const [esEdicionArea, setEsEdicionArea] = useState(false);
  const [guardandoArea, setGuardandoArea] = useState(false);

  const estadoInicialArea = { dbId: null, nombre: '', capacidad: 1 };
  const [formDataArea, setFormDataArea] = useState(estadoInicialArea);

  const cargarAreas = async () => {
    setCargandoAreas(true);
    try {
      setAreas(await AreaRepository.listar());
    } catch (error) {
      console.error('Error al cargar áreas:', error);
    } finally {
      setCargandoAreas(false);
    }
  };

  useEffect(() => { cargarAreas(); }, []);

  const abrirModalNuevaArea = () => {
    setEsEdicionArea(false);
    setFormDataArea(estadoInicialArea);
    setModalAreaAbierto(true);
  };

  const abrirModalEditarArea = (area) => {
    setEsEdicionArea(true);
    setFormDataArea({ dbId: area.dbId, nombre: area.nombre, capacidad: area.capacidad || 1 });
    setModalAreaAbierto(true);
  };

  const cerrarModalArea = () => setModalAreaAbierto(false);

  const handleAreaInputChange = (e) => {
    const { name, value } = e.target;
    setFormDataArea(prev => ({ ...prev, [name]: value }));
  };

  const guardarArea = async (e) => {
    e.preventDefault();
    setGuardandoArea(true);
    try {
      if (esEdicionArea) {
        await AreaRepository.editar(formDataArea.dbId, Number(formDataArea.capacidad));
      } else {
        await AreaRepository.crear({ nombre: formDataArea.nombre.trim(), capacidad: Number(formDataArea.capacidad) });
      }
      await cargarAreas();
      cerrarModalArea();
    } catch (error) {
      alert(error.message || 'Error al guardar el área. Verifica que el nombre no esté duplicado.');
    } finally {
      setGuardandoArea(false);
    }
  };

  const eliminarArea = async (dbId, nombre) => {
    if (window.confirm(`¿Estás seguro de eliminar el área "${nombre}"? Esto podría afectar historiales pasados.`)) {
      try {
        await AreaRepository.eliminar(dbId);
        await cargarAreas();
      } catch (error) {
        alert(error.message || 'No se puede eliminar: hay camiones con esta área en su historial.');
      }
    }
  };

  return {
    areas, cargandoAreas, cargarAreas, modalAreaAbierto, esEdicionArea, guardandoArea, formDataArea,
    abrirModalNuevaArea, abrirModalEditarArea, cerrarModalArea, handleAreaInputChange, guardarArea, eliminarArea
  };
};
