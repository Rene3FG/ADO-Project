// src/lib/logic/useRegistroBloc.js
import { useState } from 'react';
import { AutobusRepository } from '../data/repositories/AutobusRepository';

export const useRegistroBloc = () => {
  const [numeroSerie, setNumeroSerie] = useState('');
  const [tipoUnidad, setTipoUnidad] = useState('ADO');
  const [tieneBano, setTieneBano] = useState(true);
  
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const guardarUnidad = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    setExito(false);

    try {
      await AutobusRepository.registrarAutobus(numeroSerie, tipoUnidad, tieneBano);
      
      setExito(true);
      // Limpiamos el formulario para el siguiente registro
      setNumeroSerie('');
      setTipoUnidad('ADO');
      setTieneBano(true);
      
      // Ocultamos el mensaje de éxito después de 3 segundos
      setTimeout(() => setExito(false), 3000);
      
    } catch (err) {
      // Si el número de serie ya existe, Supabase lanzará un error de llave única
      setError('Error al registrar. Verifica que el número de serie no esté duplicado en el patio.');
    } finally {
      setCargando(false);
    }
  };

  return {
    numeroSerie, setNumeroSerie,
    tipoUnidad, setTipoUnidad,
    tieneBano, setTieneBano,
    cargando, error, exito,
    guardarUnidad
  };
};