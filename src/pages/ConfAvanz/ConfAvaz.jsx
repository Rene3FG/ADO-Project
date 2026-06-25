import { useState } from "react";
import { MdAddLocation, MdPersonAdd, MdDirectionsBus, MdDelete, MdArrowBack, MdCompareArrows } from "react-icons/md";
import { AreaRepository } from "../../lib/data/repositories/AreaRepository";
import { AutobusRepository } from "../../lib/data/repositories/AutobusRepository";
import "./ConfAvanz.css";

export default function ConfAvanz({ areasConfig, camiones, onAreasChange, onCamionesChange }) {
  // Para controlar qué sub-pantalla ver ('menu', 'areas', 'mover')
  const [vistaActual, setVistaActual] = useState('menu');

  const [nuevaAreaNombre, setNuevaAreaNombre] = useState('');
  const [nuevaAreaCapacidad, setNuevaAreaCapacidad] = useState(4);
  const [guardandoArea, setGuardandoArea] = useState(false);

  const [camionSeleccionadoId, setCamionSeleccionadoId] = useState('');
  const [areaDestinoId, setAreaDestinoId] = useState('');
  const [reubicando, setReubicando] = useState(false);

  // Áreas reales administrables (excluye "Espera", que es un bucket del
  // cliente sin fila propia en la API — ver AreaRepository).
  const areasAdministrables = areasConfig.filter((a) => a.dbId);

  const agregarArea = async (e) => {
    e.preventDefault();
    if (!nuevaAreaNombre.trim()) return;

    if (areasConfig.some(a => a.id.toLowerCase() === nuevaAreaNombre.toLowerCase())) {
      alert("Esta área ya existe en el patio.");
      return;
    }

    setGuardandoArea(true);
    try {
      await AreaRepository.crear({ nombre: nuevaAreaNombre, capacidad: parseInt(nuevaAreaCapacidad) || 4 });
      await onAreasChange();
      setNuevaAreaNombre('');
      setNuevaAreaCapacidad(4);
    } catch (error) {
      alert(`No se pudo crear el área: ${error.message}`);
    } finally {
      setGuardandoArea(false);
    }
  };

  const eliminarArea = async (area) => {
    const confirmar = window.confirm(`¿Estás seguro de eliminar el área "${area.id}"?`);
    if (!confirmar) return;
    try {
      await AreaRepository.eliminar(area.dbId);
      await onAreasChange();
    } catch (error) {
      alert(`No se pudo eliminar: ${error.message}`);
    }
  };

  const ejecutarReubicacion = async (e) => {
    e.preventDefault();
    if (!camionSeleccionadoId || !areaDestinoId) return;

    const infoCamion = camiones.find(c => String(c.busId) === camionSeleccionadoId);
    if (!infoCamion) return;

    const infoAreaDestino = areasConfig.find(a => a.id === areaDestinoId);
    const limiteMaximo = infoAreaDestino ? infoAreaDestino.capacidad : 4;
    const actualesEnDestino = camiones.filter(c => c.currentArea === areaDestinoId).length;

    if (actualesEnDestino >= limiteMaximo) {
      alert(`⚠️ Capacidad máxima superada. El área ${areaDestinoId} está llena.`);
      return;
    }

    setReubicando(true);
    try {
      await AutobusRepository.moverAutobus(infoCamion, areaDestinoId);
      await onCamionesChange();
      alert(`⚡ Reubicación exitosa: El autobús ${infoCamion.busId} fue forzado a "${areaDestinoId}".`);
      setCamionSeleccionadoId('');
      setAreaDestinoId('');
    } catch (error) {
      alert(`No se pudo reubicar: ${error.message}`);
    } finally {
      setReubicando(false);
    }
  };

  if (vistaActual === 'areas') {
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
            <button type="submit" className="btn-primary" disabled={guardandoArea}>
              {guardandoArea ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>

        <div className="area-list-container">
          <h3>Áreas Activas</h3>
          <ul className="area-list">
            {areasAdministrables.map((area) => (
              <li key={area.id} className="area-list-item">
                <div className="area-info">
                  <strong>{area.icono} {area.id}</strong>
                  <span>Capacidad: {area.capacidad} autobuses</span>
                </div>
                <button className="btn-delete" onClick={() => eliminarArea(area)}><MdDelete /></button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (vistaActual === 'mover') {
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
                <option key={c.busId} value={c.busId}>
                  {c.busId} ({c.busType}) - Actualmente en: {c.currentArea}
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

          <button type="submit" className="btn-primary btn-block" style={{ marginTop: '20px' }} disabled={reubicando}>
            <MdCompareArrows /> {reubicando ? 'Reubicando...' : 'Forzar Reubicación de Unidad'}
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
        <div className="config-option-card" onClick={() => setVistaActual('areas')}>
          <div className="config-option-icon"><MdAddLocation /></div>
          <div className="config-option-text">
            <h3>Gestor de Áreas</h3>
            <p>Crea nuevas zonas de trabajo en el patio, define capacidades o elimina áreas en desuso.</p>
          </div>
        </div>

        <div className="config-option-card" onClick={() => alert('Próximamente: Módulo de Usuarios')}>
          <div className="config-option-icon"><MdPersonAdd /></div>
          <div className="config-option-text">
            <h3>Agregar usuario</h3>
            <p>Registra nuevos operadores, mecánicos o supervisores de patio.</p>
          </div>
        </div>

        <div className="config-option-card" onClick={() => setVistaActual('mover')}>
          <div className="config-option-icon"><MdDirectionsBus /></div>
          <div className="config-option-text">
            <h3>Mover camiones</h3>
            <p>Salte el ciclo operativo y reubique manualmente cualquier autobús en caso de emergencia.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
