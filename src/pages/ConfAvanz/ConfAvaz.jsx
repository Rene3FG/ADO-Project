import { useState } from "react";
import { MdAddLocation, MdPersonAdd, MdDirectionsBus, MdDelete, MdArrowBack, MdCompareArrows } from "react-icons/md";
import "./ConfAvanz.css";

export default function ConfAvanz({ areasConfig, setAreasConfig, camiones, setCamiones }) {
  // Para controlar qué sub-pantalla ver ('menu', 'areas', 'mover')
  const [vistaActual, setVistaActual] = useState('menu'); 
  
  const [nuevaAreaNombre, setNuevaAreaNombre] = useState(''); //Gestor de las nuevas áreas
  const [nuevaAreaCapacidad, setNuevaAreaCapacidad] = useState(4);

  const [camionSeleccionadoId, setCamionSeleccionadoId] = useState(''); //Gestor de los nuevos camiones reubicados
  const [areaDestinoId, setAreaDestinoId] = useState('');

  const agregarArea = (e) => { // Funcion de agregar área
    e.preventDefault();
    if (!nuevaAreaNombre.trim()) return;

    if (areasConfig.some(a => a.id.toLowerCase() === nuevaAreaNombre.toLowerCase())) {
      alert("Esta área ya existe en el patio.");
      return;
    }

    const nuevaArea = { id: nuevaAreaNombre, capacidad: parseInt(nuevaAreaCapacidad) || 4 };
    setAreasConfig([...areasConfig, nuevaArea]);
    setNuevaAreaNombre('');
    setNuevaAreaCapacidad(4);
  };

  const eliminarArea = (idArea) => { //Eliminar área
    const confirmar = window.confirm(`¿Estás seguro de eliminar el área "${idArea}"?`);
    if (confirmar) setAreasConfig(areasConfig.filter(a => a.id !== idArea));
  };

  const ejecutarReubicacion = (e) => { //Reubicacion Forzada
    e.preventDefault();
    if (!camionSeleccionadoId || !areaDestinoId) return;

    const infoCamion = camiones.find(c => c.id === camionSeleccionadoId);
    
    const infoAreaDestino = areasConfig.find(a => a.id === areaDestinoId);
    const limiteMaximo = infoAreaDestino ? infoAreaDestino.capacidad : 4;
    const actualesEnDestino = camiones.filter(c => c.area === areaDestinoId).length;

    if (actualesEnDestino >= limiteMaximo) {
      alert(`⚠️ Capacidad máxima superada. El área ${areaDestinoId} está llena.`);
      return;
    }

    const camionesModificados = camiones.map((c) => { //Actualización del camion
      if (c.id === camionSeleccionadoId) {
        return { ...c, area: areaDestinoId };
      }
      return c;
    });

    setCamiones(camionesModificados);
    alert(`⚡ Reubicación exitosa: El autobús ${infoCamion.codigo} fue forzado a "${areaDestinoId}".`);
    
    setCamionSeleccionadoId('');
    setAreaDestinoId('');
  };


  if (vistaActual === 'areas') { //Visualizacion de las sub-pantallas (crear/eliminar area)
    return (
      <div className="config-panel">
        <div className="config-header-flex">
          <button className="btn-back" onClick={() => setVistaActual('menu')}><MdArrowBack /> Volver</button>
          <h2>Gestor de Áreas del Patio</h2>
        </div>

        <form className="area-form" onSubmit={agregarArea}>
          <div className="input-group-row">
            <input 
              type="text" 
              placeholder="Nombre del área (Ej. Bahía 1)" 
              value={nuevaAreaNombre}
              onChange={(e) => setNuevaAreaNombre(e.target.value)}
              required
            />
            <input 
              type="number" 
              placeholder="Capacidad" 
              min="1"
              value={nuevaAreaCapacidad}
              onChange={(e) => setNuevaAreaCapacidad(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary">Crear</button>
          </div>
        </form>

        <div className="area-list-container">
          <h3>Áreas Activas</h3>
          <ul className="area-list">
            {areasConfig.map((area) => (
              <li key={area.id} className="area-list-item">
                <div className="area-info">
                  <strong>{area.id}</strong>
                  <span>Capacidad: {area.capacidad} autobuses</span>
                </div>
                <button className="btn-delete" onClick={() => eliminarArea(area.id)}><MdDelete /></button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (vistaActual === 'mover') { //Visualizacion de las sub-pantallas (reubicar camiones)
    return (
      <div className="config-panel">
        <div className="config-header-flex">
          <button className="btn-back" onClick={() => setVistaActual('menu')}><MdArrowBack /> Volver</button>
          <h2>Módulo de Reubicación Forzada (Admin)</h2>
        </div>
        
        <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '13px' }}>
          *Nota: Como Administrador, esta herramienta moverá el autobús ignorando por completo el ciclo estricto del patio.
        </p>

        <form className="reubicacion-form" onSubmit={ejecutarReubicacion}>
          <div className="form-group-vertical">
            <label>1. Selecciona el Autobús a mover:</label>
            <select 
              value={camionSeleccionadoId} 
              onChange={(e) => setCamionSeleccionadoId(e.target.value)}
              required
            >
              <option value="">-- Seleccionar Autobús ID --</option>
              {camiones.map(c => (
                <option key={c.id} value={c.id}>
                  {c.codigo} ({c.tipo}) - Actualmente en: {c.area}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-vertical" style={{ marginTop: '15px' }}>
            <label>2. Forzar hacia el Área destino:</label>
            <select 
              value={areaDestinoId} 
              onChange={(e) => setAreaDestinoId(e.target.value)}
              required
            >
              <option value="">-- Seleccionar Destino --</option>
              {areasConfig.map(a => (
                <option key={a.id} value={a.id}>{a.id}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary btn-block" style={{ marginTop: '20px', width: '100%' }}>
            <MdCompareArrows /> Forzar Reubicación de Unidad
          </button>
        </form>
      </div>
    );
  }

  // Menu Principal
  return (
    <div className="config-panel">
      <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '14px' }}>
        Selecciona una tarea administrativa para el control del patio.
      </p>
      
      <div className="config-grid">
        {/* Tarjeta 1 */}
        <div className="config-option-card" onClick={() => setVistaActual('areas')}>
          <div className="config-option-icon"><MdAddLocation /></div>
          <div className="config-option-text">
            <h3>Gestor de Áreas</h3>
            <p>Crea nuevas zonas de trabajo en el patio, define capacidades o elimina áreas en desuso.</p>
          </div>
        </div>

        {/* Tarjeta 2 */}
        <div className="config-option-card" onClick={() => alert('Próximamente: Módulo de Usuarios')}>
          <div className="config-option-icon"><MdPersonAdd /></div>
          <div className="config-option-text">
            <h3>Agregar usuario</h3>
            <p>Registra nuevos operadores, mecánicos o supervisores de patio.</p>
          </div>
        </div>

        {/* Tarjeta 3*/}
        <div className="config-option-card" onClick={() => setVistaActual('mover')}>
          <div className="config-option-icon"><MdDirectionsBus /></div>
          <div className="config-option-text">
            <h3>Mover unidades</h3>
            <p>Salte el ciclo operativo y reubique manualmente cualquier autobús en caso de emergencia.</p>
          </div>
        </div>
      </div>
    </div>
  );
}