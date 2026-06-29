import { useState } from "react";
import { MdAddLocation, MdPersonAdd, MdDirectionsBus, MdDelete, MdArrowBack, MdCompareArrows } from "react-icons/md";
import areasService from "../../services/areasService.js";
import camionesService from "../../services/camionesService.js";
import "./ConfAvanz.css";

export default function ConfAvanz({ areasConfig, setAreasConfig, camiones, setCamiones }) {
  const [vistaActual, setVistaActual] = useState('menu');

  const [nuevaAreaNombre, setNuevaAreaNombre] = useState('');
  const [nuevaAreaCapacidad, setNuevaAreaCapacidad] = useState(4);
  const [loadingArea, setLoadingArea] = useState(false);
  const [errorArea, setErrorArea] = useState("");

  const [camionSeleccionadoId, setCamionSeleccionadoId] = useState('');
  const [areaDestinoId, setAreaDestinoId] = useState('');
  const [loadingReubicacion, setLoadingReubicacion] = useState(false);
  const [errorReubicacion, setErrorReubicacion] = useState("");

  const agregarArea = async (e) => {
    e.preventDefault();
    setErrorArea("");
    setLoadingArea(true);

    try {
      if (!nuevaAreaNombre.trim()) {
        setErrorArea("El nombre del área es requerido");
        setLoadingArea(false);
        return;
      }

      if (areasConfig.some(a => a.id.toLowerCase() === nuevaAreaNombre.toLowerCase())) {
        setErrorArea("Esta área ya existe en el patio");
        setLoadingArea(false);
        return;
      }

      const nuevaArea = { 
        id: nuevaAreaNombre, 
        capacidad: parseInt(nuevaAreaCapacidad) || 4 
      };

      // Crear área en API
      const areaCreada = await areasService.createArea(nuevaArea);
      console.log("Área creada en API:", areaCreada);

      // Actualizar estado local
      setAreasConfig([...areasConfig, areaCreada || nuevaArea]);

      alert("Área creada exitosamente");
      setNuevaAreaNombre('');
      setNuevaAreaCapacidad(4);
    } catch (err) {
      console.error("Error creating area:", err);
      setErrorArea(err.message || "Error al crear el área");
    } finally {
      setLoadingArea(false);
    }
  };

  const eliminarArea = async (idArea) => {
    const confirmar = window.confirm(`¿Estás seguro de eliminar el área "${idArea}"?`);
    if (!confirmar) return;

    try {
      setLoadingArea(true);
      setErrorArea("");

      // Eliminar en API
      await areasService.deleteArea(idArea);
      console.log("Área eliminada de API");

      // Actualizar estado local
      setAreasConfig(areasConfig.filter(a => a.id !== idArea));
      alert("Área eliminada exitosamente");
    } catch (err) {
      console.error("Error deleting area:", err);
      setErrorArea(err.message || "Error al eliminar el área");
    } finally {
      setLoadingArea(false);
    }
  };

  const ejecutarReubicacion = async (e) => {
    e.preventDefault();
    setErrorReubicacion("");
    setLoadingReubicacion(true);

    try {
      if (!camionSeleccionadoId || !areaDestinoId) {
        setErrorReubicacion("Debes seleccionar un camión y un área destino");
        setLoadingReubicacion(false);
        return;
      }

      const infoCamion = camiones.find(c => c.id === camionSeleccionadoId);
      const infoAreaDestino = areasConfig.find(a => a.id === areaDestinoId);
      const limiteMaximo = infoAreaDestino ? infoAreaDestino.capacidad : 4;
      const actualesEnDestino = camiones.filter(c => c.area === areaDestinoId).length;

      if (actualesEnDestino >= limiteMaximo) {
        setErrorReubicacion(`Capacidad máxima superada. El área ${areaDestinoId} está llena.`);
        setLoadingReubicacion(false);
        return;
      }

      // Reubicación en API
      await camionesService.reubicacionForzada(camionSeleccionadoId, areaDestinoId);
      console.log("Reubicación forzada registrada en API");

      // Actualizar estado local
      const camionesModificados = camiones.map((c) => {
        if (c.id === camionSeleccionadoId) {
          return { ...c, area: areaDestinoId };
        }
        return c;
      });

      setCamiones(camionesModificados);
      alert(`Reubicación exitosa: El autobús ${infoCamion.codigo} fue forzado a "${areaDestinoId}".`);

      setCamionSeleccionadoId('');
      setAreaDestinoId('');
    } catch (err) {
      console.error("Error reubicando camión:", err);
      setErrorReubicacion(err.message || "Error al reubicación del autobús");
    } finally {
      setLoadingReubicacion(false);
    }
  };

  if (vistaActual === 'areas') {
    return (
      <div className="config-panel">
        <div className="config-header-flex">
          <button className="btn-back" onClick={() => setVistaActual('menu')}><MdArrowBack /> Volver</button>
          <h2>Gestor de Áreas del Patio</h2>
        </div>

        {errorArea && <div style={{ color: '#ef4444', marginBottom: '15px', padding: '10px', borderRadius: '4px', backgroundColor: '#fee2e2' }}>{errorArea}</div>}

        <form className="area-form" onSubmit={agregarArea}>
          <div className="input-group-row">
            <input
              type="text"
              placeholder="Nombre del área (Ej. Bahía 1)"
              value={nuevaAreaNombre}
              onChange={(e) => setNuevaAreaNombre(e.target.value)}
              disabled={loadingArea}
              required
            />
            <input
              type="number"
              placeholder="Capacidad"
              min="1"
              value={nuevaAreaCapacidad}
              onChange={(e) => setNuevaAreaCapacidad(e.target.value)}
              disabled={loadingArea}
              required
            />
            <button type="submit" className="btn-primary" disabled={loadingArea}>
              {loadingArea ? "Creando..." : "Crear"}
            </button>
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
                <button
                  className="btn-delete"
                  onClick={() => eliminarArea(area.id)}
                  disabled={loadingArea}
                >
                  <MdDelete />
                </button>
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

        {errorReubicacion && <div style={{ color: '#ef4444', marginBottom: '15px', padding: '10px', borderRadius: '4px', backgroundColor: '#fee2e2' }}>{errorReubicacion}</div>}

        <form className="reubicacion-form" onSubmit={ejecutarReubicacion}>
          <div className="form-group-vertical">
            <label>1. Selecciona el Autobús a mover:</label>
            <select
              value={camionSeleccionadoId}
              onChange={(e) => setCamionSeleccionadoId(e.target.value)}
              disabled={loadingReubicacion}
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
              disabled={loadingReubicacion}
              required
            >
              <option value="">-- Seleccionar Destino --</option>
              {areasConfig.map(a => (
                <option key={a.id} value={a.id}>{a.id}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary btn-block" style={{ marginTop: '20px', width: '100%' }} disabled={loadingReubicacion}>
            <MdCompareArrows /> {loadingReubicacion ? "Procesando..." : "Forzar Reubicación de Unidad"}
          </button>
        </form>
      </div>
    );
  }

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
