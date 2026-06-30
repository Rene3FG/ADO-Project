// src/lib/logic/useRegistroBloc.js
import { useState, useEffect } from 'react';
import { AutobusRepository } from '../data/repositories/AutobusRepository';

export const useRegistroBloc = () => {
  const [step, setStep] = useState(1); 
  
  const WORKFLOW_ORDER = ['Desfogue', 'Diesel', 'Ad-blue', 'Taller', 'Lavado Interior', 'Lavado Exterior'];

  const [formData, setFormData] = useState({
    numeroSerie: '',
    tipoUnidad: 'ADO',
    horaSalida: '',
    conductor: '',
    terminalOrigen: '',
    terminalDestino: '',
    areasRequeridas: {
      'Desfogue': false, 'Diesel': false, 'Ad-blue': false,
      'Taller': false, 'Lavado Interior': false, 'Lavado Exterior': false
    },
    areaInicial: '',
    observaciones: ''
  });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  // Sistema de recomendación inteligente
  const getRecommendedArea = () => {
    for (const area of WORKFLOW_ORDER) {
      if (formData.areasRequeridas[area]) {
        return area; 
      }
    }
    const hasSelections = Object.values(formData.areasRequeridas).some(val => val);
    return hasSelections ? 'Espera' : '';
  };

  const areaRecomendada = getRecommendedArea();
  const todasSeleccionadas = WORKFLOW_ORDER.every((area) => formData.areasRequeridas[area]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, areaInicial: areaRecomendada }));
  }, [areaRecomendada]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (area) => {
    setFormData((prev) => ({
      ...prev,
      areasRequeridas: { ...prev.areasRequeridas, [area]: !prev.areasRequeridas[area] }
    }));
  };

  const handleToggleAll = () => {
    const newValue = !todasSeleccionadas;
    const updatedAreas = {};
    WORKFLOW_ORDER.forEach((area) => updatedAreas[area] = newValue);
    setFormData((prev) => ({ ...prev, areasRequeridas: updatedAreas }));
  };

  // Validación para pasar al Paso 2
  const avanzarPaso = (e) => {
    e.preventDefault();
    const tieneAreas = Object.values(formData.areasRequeridas).some(v => v);
    if (!formData.numeroSerie || !formData.horaSalida || !tieneAreas) {
      setError("Por favor llena los campos obligatorios y selecciona al menos un área.");
      return;
    }
    setError('');
    setStep(2);
  };

  const guardarUnidad = async () => {
    setCargando(true);
    setError('');
    setExito(false);

    try {
      // Extraemos solo las áreas que el usuario marcó como true
      const areasSeleccionadas = Object.keys(formData.areasRequeridas).filter(area => formData.areasRequeridas[area]);

      await AutobusRepository.registrarAutobus({
        numeroSerie: formData.numeroSerie,
        tipoUnidad: formData.tipoUnidad,
        horaSalida: formData.horaSalida,
        conductor: formData.conductor,
        terminalOrigen: formData.terminalOrigen,
        terminalDestino: formData.terminalDestino,
        areasRequeridas: areasSeleccionadas,
        areaInicial: formData.areaInicial || areaRecomendada || 'Espera',
        observaciones: formData.observaciones
      });
      
      setExito(true);
      setTimeout(() => {
        setExito(false);
        setStep(1); // Regresamos al paso 1
        setFormData({
          numeroSerie: '', tipoUnidad: 'ADO', horaSalida: '',
          conductor: '', terminalOrigen: '', terminalDestino: '',
          areasRequeridas: { 'Desfogue': false, 'Diesel': false, 'Ad-blue': false, 'Taller': false, 'Lavado Interior': false, 'Lavado Exterior': false },
          areaInicial: '', observaciones: ''
        });
      }, 3000);
      
    } catch (err) {
      setError('Error al registrar. Verifica que el número de serie no esté duplicado.');
    } finally {
      setCargando(false);
    }
  };

  return {
    step, setStep,
    formData, WORKFLOW_ORDER, areaRecomendada, todasSeleccionadas,
    handleInputChange, handleCheckboxChange, handleToggleAll, avanzarPaso,
    cargando, error, exito, guardarUnidad
  };
};