// src/lib/logic/useAreasBloc.js
import { useState, useEffect } from 'react';
import { AreaRepository } from '../data/repositories/AreaRepository';

export const useAreasBloc = () => {
  const [areas, setAreas] = useState([]);
  const [cargandoAreas, setCargandoAreas] = useState(true);
  
  const [modalAreaAbierto, setModalAreaAbierto] = useState(false);
  const [esEdicionArea, setEsEdicionArea] = useState(false);
  const [guardandoArea, setGuardandoArea] = useState(false);
  
  const estadoInicialArea = { id_area: '', nombre_area: '', capacidad: 1, icono: '📍' };
  const [formDataArea, setFormDataArea] = useState(estadoInicialArea);

  const cargarAreas = async () => {
    setCargandoAreas(true);
    try {
      const data = await AreaRepository.obtenerTodas();
      setAreas(data);
    } catch (error) {
      console.error("Error al cargar áreas:", error);
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
    setFormDataArea({
      id_area: area.id_area,
      nombre_area: area.nombre_area,
      capacidad: area.capacidad || 1,
      icono: area.icono || '📍'
    });
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
      await AreaRepository.guardarArea(formDataArea, !esEdicionArea);
      await cargarAreas();
      cerrarModalArea();
    } catch (error) {
      alert("Error al guardar el área. Verifica que el nombre no esté duplicado.");
    } finally {
      setGuardandoArea(false);
    }
  };

  const eliminarArea = async (id_area, nombre) => {
    if(window.confirm(`¿Estás seguro de eliminar el área "${nombre}"? Esto podría afectar historiales pasados.`)) {
      try {
        await AreaRepository.eliminarArea(id_area);
        await cargarAreas();
      } catch(error) {
        alert("No se puede eliminar porque hay camiones con esta área en su historial.");
      }
    }
  };

  return {
    areas, cargandoAreas, modalAreaAbierto, esEdicionArea, guardandoArea, formDataArea,
    abrirModalNuevaArea, abrirModalEditarArea, cerrarModalArea, handleAreaInputChange, guardarArea, eliminarArea
  };
};