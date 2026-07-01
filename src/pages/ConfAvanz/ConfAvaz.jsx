import { useState, useEffect } from "react";
import { MdAddLocation, MdPersonAdd, MdDirectionsBus, MdDelete, MdArrowBack, MdCompareArrows } from "react-icons/md";
import areasService from "../../services/areasService.js";
import camionesService from "../../services/camionesService.js";
import { UsuarioRepository } from "../../lib/data/repositories/UsuarioRepository.js";
import "./ConfAvanz.css";

export default function ConfAvanz({ areasConfig, setAreasConfig, camiones, setCamiones }) {
  const [vistaActual, setVistaActual] = useState('menu');

  const [nuevaAreaNombre, setNuevaAreaNombre] = useState('');
  const [nuevaAreaCapacidad, setNuevaAreaCapacidad] = useState(4);
  const [loadingArea, setLoadingArea] = useState(false);
  const [errorArea, setErrorArea] = useState("");

  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({ username: '', nombre: '', rol: 'Operator', password: '' });
  const [loadingUsuario, setLoadingUsuario] = useState(false);
  const [errorUsuario, setErrorUsuario] = useState('');
  const [successUsuario, setSuccessUsuario] = useState('');

  useEffect(() => {
    if (vistaActual === 'usuarios' && rolesDisponibles.length === 0) {
      UsuarioRepository.listarRoles().then(setRolesDisponibles).catch(() => {});
    }
  }, [vistaActual]);

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

  const crearUsuario = async (e) => {
    e.preventDefault();
    setErrorUsuario('');
    setSuccessUsuario('');
    setLoadingUsuario(true);
    try {
      await UsuarioRepository.crear({
        username: nuevoUsuario.username,
        password: nuevoUsuario.password,
        nombre: nuevoUsuario.nombre,
        rol: nuevoUsuario.rol,
      });
      setSuccessUsuario(`Usuario "${nuevoUsuario.username}" creado correctamente.`);
      setNuevoUsuario({ username: '', nombre: '', rol: 'Operator', password: '' });
    } catch (err) {
      setErrorUsuario(err.message || 'Error al crear usuario');
    } finally {
      setLoadingUsuario(false);
    }
  };

  if (vistaActual === 'usuarios') {
    return (
      <div className="config-panel">
        <div className="config-header-flex">
          <button className="btn-back" onClick={() => { setVistaActual('menu'); setErrorUsuario(''); setSuccessUsuario(''); }}><MdArrowBack /> Volver</button>
          <h2>Agregar Usuario</h2>
        </div>

        {errorUsuario && <div style={{ color: '#ef4444', marginBottom: '15px', padding: '10px', borderRadius: '4px', backgroundColor: '#fee2e2' }}>{errorUsuario}</div>}
        {successUsuario && <div style={{ color: '#16a34a', marginBottom: '15px', padding: '10px', borderRadius: '4px', backgroundColor: '#dcfce7' }}>{successUsuario}</div>}

        <form onSubmit={crearUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '420px' }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>ID Empleado (nombre de usuario)</label>
            <input type="text" value={nuevoUsuario.username} onChange={e => setNuevoUsuario(u => ({ ...u, username: e.target.value }))}
              required disabled={loadingUsuario}
              style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>Nombre Completo</label>
            <input type="text" value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario(u => ({ ...u, nombre: e.target.value }))}
              required disabled={loadingUsuario}
              style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>Rol</label>
              <select value={nuevoUsuario.rol} onChange={e => setNuevoUsuario(u => ({ ...u, rol: e.target.value }))}
                disabled={loadingUsuario}
                style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box', backgroundColor: 'white' }}>
                {rolesDisponibles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>Contraseña</label>
              <input type="password" value={nuevoUsuario.password} onChange={e => setNuevoUsuario(u => ({ ...u, password: e.target.value }))}
                required disabled={loadingUsuario}
                style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }} />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loadingUsuario} style={{ marginTop: '6px' }}>
            {loadingUsuario ? 'Creando...' : 'Crear Usuario'}
          </button>
        </form>
      </div>
    );
  }

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

        <div className="config-option-card" onClick={() => setVistaActual('usuarios')}>
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
