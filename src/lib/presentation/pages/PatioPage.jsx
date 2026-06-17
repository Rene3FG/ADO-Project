// src/lib/presentation/pages/PatioPage.jsx
import { useState } from 'react';
import { useMenuBloc } from '../../logic/useMenuBloc';
import { usePatioBloc } from '../../logic/usePatioBloc';
import { RegistroUnidadPage } from './RegistroUnidadPage';
import "../../../App.css";

export const PatioPage = ({ usuario }) => {
  const { cerrarSesion } = useMenuBloc();
  const [vistaActual, setVistaActual] = useState('patio');
  
  // NUEVO ESTADO: Diccionario para guardar selecciones individuales de camiones
  const [destinosOperador, setDestinosOperador] = useState({});
  
  const { 
    autobuses, cargando, cargarAutobuses,
    busSeleccionado, areaDestino, setAreaDestino, moviendo,
    abrirModalMover, cerrarModal, confirmarMovimiento, obtenerOcupacion, arrancarServicio, confirmarMovimientoDirecto
  } = usePatioBloc(); 

  const esAdmin = !usuario.areaAsignada || usuario.areaAsignada === 'General';
  const WORKFLOW_ORDER = ['Desfogue', 'Diesel', 'Ad-blue', 'Taller', 'Lavado Interior', 'Lavado Exterior'];
  
  const definicionAreas = [
    { id: 'Desfogue', nombre: 'Desfogue', capacidad: 4, icono: '💨' },
    { id: 'Diesel', nombre: 'Diesel', capacidad: 3, icono: '⛽' },
    { id: 'Lavado Exterior', nombre: 'Lavado Exterior', capacidad: 4, icono: '🚿' },
    { id: 'Lavado Interior', nombre: 'Lavado Interior', capacidad: 3, icono: '🧽' },
    { id: 'Ad-blue', nombre: 'AdBlue', capacidad: 2, icono: '💧' },
    { id: 'Taller', nombre: 'Taller', capacidad: 2, icono: '🛠️' },
    { id: 'Espera', nombre: 'Área de Espera', capacidad: 6, icono: '🚏' }
  ];

  const obtenerSugerencia = (bus) => {
    const completadas = bus.completedAreas || [];
    for (const area of WORKFLOW_ORDER) {
      if (bus.requiredAreas.includes(area) && !completadas.includes(area) && area !== bus.currentArea) {
        return area;
      }
    }
    const terminadasTodas = bus.requiredAreas.every(a => completadas.includes(a) || a === bus.currentArea);
    return terminadasTodas ? 'Salida' : 'Espera';
  };

  const busesDelOperador = autobuses.filter(bus => bus.currentArea === usuario.areaAsignada);
  const ocupacionActual = busesDelOperador.length;
  const capacidadMaxArea = definicionAreas.find(a => a.id === usuario.areaAsignada)?.capacidad || 3;

  const obtenerSlotsArea = (nombreArea, capacidad) => {
    const busesEnArea = autobuses.filter(bus => bus.currentArea === nombreArea);
    const slots = busesEnArea.slice(0, capacidad).map(bus => (
      <div key={bus.id_autobus} className={`slot ${bus.estadoServicio === 'En Proceso' ? 'process' : 'occ'}`} onClick={() => abrirModalMover(bus)} style={{ cursor: 'pointer', position: 'relative', backgroundColor: bus.estadoServicio === 'En Proceso' ? '#f59e0b' : 'var(--slot-occ-bg)' }}>
        {bus.isPriority && <span style={{ position: 'absolute', top: '-8px', right: '-8px', fontSize: '1.2rem' }}>⚠️</span>}
        <span style={{ color: bus.estadoServicio === 'En Proceso' ? 'black' : 'white' }}>{bus.busId}</span>
        <span className="slot-time" style={{ color: bus.estadoServicio === 'En Proceso' ? 'black' : 'white' }}>{bus.estadoServicio === 'En Proceso' ? '⏱️ Proceso' : 'En Espera'}</span>
      </div>
    ));
    const espaciosLibres = capacidad - slots.length;
    for (let i = 0; i < espaciosLibres; i++) {
      slots.push(<div key={`free-${nombreArea}-${i}`} className="slot free"><span>Libre</span></div>);
    }
    return slots;
  };

  return (
    <div className="app-layout">
      {/* ================= BARRA LATERAL ================= */}
      <aside className="sidebar">
        <div className="sidebar-logo"><h1>ADO</h1></div>
        <ul className="sidebar-menu">
          <li><a className={vistaActual === 'patio' ? 'active' : ''} onClick={() => { setVistaActual('patio'); cargarAutobuses(); }}>🏠 {esAdmin ? 'Patio Central' : 'Mi Área'}</a></li>
          {esAdmin && <li><a className={vistaActual === 'registrar' ? 'active' : ''} onClick={() => setVistaActual('registrar')}>⊕ Registrar camión</a></li>}
          {esAdmin && <li><a>🔃 Movimientos</a></li>}
          {esAdmin && <li><a>📊 Reportes</a></li>}
          <li style={{ marginTop: '20px' }}><a onClick={cerrarSesion} style={{ color: '#ef4444' }}>🚪 Cerrar sesión</a></li>
        </ul>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title">Control de Patio - Oaxaca</div>
          <div className="user-profile">
            <div style={{ textAlign: 'right' }}><p className="name">{usuario.nombre}</p><p className="role">{usuario.rol}</p></div>
            <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👤</div>
          </div>
        </header>

        <div className="dashboard-container" style={{ padding: esAdmin ? '30px' : '0', backgroundColor: esAdmin ? 'var(--bg-light)' : '#f4f4f9', minHeight: '100vh' }}>
          {vistaActual === 'patio' && (
            <>
              {esAdmin ? (
                /* ================= VISTA: ADMINISTRADOR ================= */
                <>
                  <div className="dash-header">
                    <div><h2>Patio en tiempo real</h2><p>Vista general de ocupación por área</p></div>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <button className="btn-registrar-header" onClick={() => setVistaActual('registrar')}>⊕ Registrar camión</button>
                    </div>
                  </div>
                  <div className="dash-grid">
                    <div className="areas-grid">
                      {definicionAreas.map((area) => (
                        <div key={area.id} className="area-card">
                          <div className="area-header"><h3>{area.icono} {area.nombre}</h3><span>Cap: {area.capacidad}</span></div>
                          <div className="slots-container">{cargando ? <p>Cargando...</p> : obtenerSlotsArea(area.id, area.capacidad)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* ================= VISTA: OPERADOR ================= */
                <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
                  <div style={{ backgroundColor: '#D32F2F', color: 'white', padding: '20px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                    <h1 style={{ margin: 0, fontSize: '24px' }}>Área: {usuario.areaAsignada}</h1>
                    <p style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#FFEB3B' }}>Ocupación: {ocupacionActual}/{capacidadMaxArea} camiones</p>
                  </div>

                  <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {cargando ? <p style={{ textAlign: 'center' }}>Cargando unidades...</p> : busesDelOperador.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#777', fontSize: '18px', marginTop: '20px' }}>No hay unidades en la cola.</p>
                    ) : (
                      busesDelOperador.map(bus => {
                        const sugerencia = obtenerSugerencia(bus); 
                        const destinoSeleccionado = destinosOperador[bus.busId] || ''; // Diccionario local

                        return (
                          <div key={bus.id_autobus} style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderLeft: '6px solid #1976D2' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eeeeee', paddingBottom: '10px', marginBottom: '15px' }}>
                              <h2 style={{ margin: 0, fontSize: '22px', color: '#333' }}>Unidad #{bus.busId}</h2>
                              <span style={{ color: '#666' }}>{bus.busType}</span>
                            </div>
                            
                            <div style={{ fontSize: '16px', color: '#555', marginBottom: '15px', textAlign: 'center' }}>
                              <p style={{ margin: '0 0 5px 0' }}><strong>Estado:</strong> {bus.estadoServicio === 'En Proceso' ? 'En Proceso ⚙️' : 'En Espera ⏳'}</p>
                              <p style={{ margin: '0 0 5px 0' }}><strong>Hora límite:</strong> {bus.departureTime}</p>
                              {bus.isPriority && <p style={{ color: '#D32F2F', fontWeight: 'bold', margin: '5px 0' }}>¡PRIORIDAD ALTA!</p>}
                            </div>

                            <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #eee', marginBottom: '15px' }}>
                              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '14px', color: '#333', textAlign: 'center' }}>Ruta asignada:</p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                                {bus.requiredAreas.map(area => {
                                  const isCompleted = bus.completedAreas.includes(area);
                                  const isCurrent = bus.currentArea === area;
                                  let bg = isCompleted ? '#E0E0E0' : isCurrent ? '#FFB74D' : '#f1f5f9';
                                  let color = isCompleted ? '#555' : isCurrent ? '#000' : '#94a3b8';
                                  return <div key={area} style={{ backgroundColor: bg, color: color, padding: '6px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>{area}</div>;
                                })}
                              </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#333', textAlign: 'center' }}>Avance: {bus.progressPercentage}%</p>
                              <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
                                <div style={{ width: `${bus.progressPercentage}%`, backgroundColor: '#388E3C', height: '100%', transition: 'width 0.3s ease' }}></div>
                              </div>
                            </div>

                            {bus.estadoServicio === 'Pendiente' ? (
                              <button onClick={() => arrancarServicio(bus)} style={{ width: '100%', padding: '15px', backgroundColor: '#388E3C', color: 'white', fontSize: '18px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                INICIAR SERVICIO
                              </button>
                            ) : (
                              <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #eeeeee' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Siguiente estación:</label>
                                
                                {/* SELECTOR CORREGIDO: Mapeo independiente con estado local */}
                                <select 
                                  value={destinoSeleccionado} 
                                  onChange={(e) => setDestinosOperador(prev => ({ ...prev, [bus.busId]: e.target.value }))}
                                  style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#000', marginBottom: '10px' }}
                                >
                                  <option value="" disabled>Seleccione destino...</option>
                                  
                                  {bus.requiredAreas.map(areaId => {
                                    if (areaId === bus.currentArea || bus.completedAreas.includes(areaId)) return null;
                                    
                                    const areaDef = definicionAreas.find(a => a.id === areaId);
                                    if (!areaDef) return null;
                                    
                                    const estaLleno = obtenerOcupacion(areaId) >= areaDef.capacidad;
                                    const esSugerida = areaId === sugerencia;

                                    return (
                                      <option key={areaId} value={areaId} disabled={estaLleno}>
                                        {areaDef.nombre} {estaLleno ? '- LLENO' : ''} {esSugerida ? '⭐ (Sugerido)' : ''}
                                      </option>
                                    );
                                  })}
                                  
                                  <option value="Salida">Salida del Complejo 🏁 {sugerencia === 'Salida' ? '⭐ (Sugerido)' : ''}</option>
                                  <option value="Espera">Espera 🚏 {sugerencia === 'Espera' ? '⭐ (Sugerido)' : ''}</option>
                                </select>

                                {/* BOTÓN DE ENVÍO CORREGIDO: Llama directo a la base de datos */}
                                <button 
                                  onClick={() => {
                                    confirmarMovimientoDirecto(bus, destinoSeleccionado);
                                    setDestinosOperador(prev => { const n = {...prev}; delete n[bus.busId]; return n; });
                                  }} 
                                  disabled={moviendo || !destinoSeleccionado} 
                                  style={{ width: '100%', padding: '15px', backgroundColor: '#1976D2', color: 'white', fontSize: '18px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: (moviendo || !destinoSeleccionado) ? 'not-allowed' : 'pointer', opacity: (moviendo || !destinoSeleccionado) ? 0.5 : 1 }}
                                >
                                  {moviendo ? 'ENVIANDO...' : 'FINALIZAR SERVICIO Y ENVIAR'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          {vistaActual === 'registrar' && esAdmin && <RegistroUnidadPage />}
        </div>

        {/* ================= MODAL ADMIN ================= */}
        {esAdmin && busSeleccionado && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: 'var(--ado-purple)', fontSize: '1.3rem' }}>Detalles Unidad #{busSeleccionado.busId}</h3>
                <button onClick={cerrarModal} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
              </div>
              
              <div style={{ backgroundColor: 'var(--bg-light)', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
                <p style={{ margin: '0 0 5px 0' }}><strong>Área actual:</strong> <span style={{ color: 'var(--ado-red)', fontWeight: 600 }}>{busSeleccionado.currentArea} ({busSeleccionado.estadoServicio})</span></p>
                <p style={{ margin: '0 0 5px 0' }}><strong>Ingreso al Patio:</strong> {new Date(busSeleccionado.ingresoPatio).toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'})}</p>
                
                <p style={{ margin: '15px 0 5px 0', fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>Historial de Servicios:</p>
                {Object.keys(busSeleccionado.historialTiempos).length === 0 ? (
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>No hay servicios registrados aún.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {Object.entries(busSeleccionado.historialTiempos).map(([area, tiempos]) => (
                      <li key={area} style={{ margin: '5px 0' }}>
                        <strong>{area}:</strong> Inició {tiempos.inicio || '--:--'} | Finalizó {tiempos.fin || '--:--'}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};