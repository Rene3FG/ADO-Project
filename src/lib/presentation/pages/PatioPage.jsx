// src/lib/presentation/pages/PatioPage.jsx
import { useState } from 'react';
import { useMenuBloc } from '../../logic/useMenuBloc';
import { usePatioBloc } from '../../logic/usePatioBloc';
import { RegistroUnidadPage } from './RegistroUnidadPage';
import "../../../App.css";

export const PatioPage = ({ usuario }) => {
  // Ahora traemos menuAbierto y alternarMenu del BLoC
  const { menuAbierto, alternarMenu, cerrarMenu, cerrarSesion } = useMenuBloc();
  const [vistaActual, setVistaActual] = useState('patio');
  
  const [destinosOperador, setDestinosOperador] = useState({});
  
  const { 
    autobuses, cargando, cargarAutobuses,
    busSeleccionado, cerrarModal, abrirModalMover,
    obtenerOcupacion, arrancarServicio, confirmarMovimientoDirecto
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
      <div key={bus.id_autobus} className={`slot ${bus.estadoServicio === 'En Proceso' ? 'process' : 'occ'}`} onClick={() => abrirModalMover(bus)} style={{ cursor: 'pointer', position: 'relative' }}>
        {bus.isPriority && <span style={{ position: 'absolute', top: '-8px', right: '-8px', fontSize: '1.2rem' }}>⚠️</span>}
        <span>{bus.busId}</span>
        <span className="slot-time">{bus.estadoServicio === 'En Proceso' ? '⏱️ Proceso' : 'En Espera'}</span>
      </div>
    ));
    const espaciosLibres = capacidad - slots.length;
    for (let i = 0; i < espaciosLibres; i++) {
      slots.push(<div key={`free-${nombreArea}-${i}`} className="slot free"><span>Libre</span></div>);
    }
    return slots;
  };

  const alertasPrioridad = autobuses.filter(bus => bus.isPriority && bus.currentArea !== 'Salida');

  // Función combinada para navegar y cerrar el menú en móvil
  const navegarA = (vista) => {
    setVistaActual(vista);
    cerrarMenu();
    if (vista === 'patio') cargarAutobuses();
  };

  return (
    <div className="app-layout">
      
      {/* Capa oscura en móvil para cerrar el menú tocando afuera */}
      {menuAbierto && <div className="overlay-menu" onClick={cerrarMenu}></div>}

      {/* ================= BARRA LATERAL ================= */}
      <aside className={`sidebar ${menuAbierto ? 'abierto' : ''}`}>
        <div className="sidebar-logo"><h1>ADO</h1></div>
        <ul className="sidebar-menu">
          <li><a className={vistaActual === 'patio' ? 'active' : ''} onClick={() => navegarA('patio')}>🏠 {esAdmin ? 'Patio Central' : 'Mi Área'}</a></li>
          {esAdmin && <li><a className={vistaActual === 'registrar' ? 'active' : ''} onClick={() => navegarA('registrar')}>⊕ Registrar camión</a></li>}
          {esAdmin && <li><a>🔃 Movimientos</a></li>}
          {esAdmin && <li><a>📊 Reportes</a></li>}
          <li style={{ marginTop: '20px' }}><a onClick={cerrarSesion} style={{ color: '#ef4444' }}>🚪 Cerrar sesión</a></li>
        </ul>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            {/* NUEVO: Botón Hamburguesa visible solo en móviles */}
            <button className="hamburger-btn" onClick={alternarMenu}>☰</button>
            <div className="topbar-title">Control de Patio - Oaxaca</div>
          </div>
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
                      <div className="leyenda">
                        <div className="leyenda-item"><div className="caja-color caja-libre"></div> Libre</div>
                        <div className="leyenda-item"><div className="caja-color caja-ocupada"></div> Ocupado</div>
                        <div className="leyenda-item"><div className="caja-color" style={{backgroundColor: '#f59e0b'}}></div> En proceso</div>
                      </div>
                      <button className="btn-registrar-header" onClick={() => navegarA('registrar')}>⊕ Registrar camión</button>
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

                    <div className="widget-panel">
                      <div className="widget-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-muted)' }}>Autobuses en patio</p>
                          <h2 style={{ margin: 0, fontSize: '2rem' }}>{autobuses.length}</h2>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', fontWeight: 600 }}>Ocupación total</p>
                          <h3 style={{ margin: '0 0 10px 0', color: 'var(--ado-purple)' }}>
                            {Math.round((autobuses.length / 24) * 100)}%
                          </h3>
                          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-light)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${(autobuses.length / 24) * 100}%`, height: '100%', backgroundColor: 'var(--ado-purple)' }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="widget-card">
                        <h3 className="widget-title">Alertas Prioritarias</h3>
                        {alertasPrioridad.length === 0 ? (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No hay alertas activas.</p>
                        ) : (
                          alertasPrioridad.map(bus => (
                            <div key={bus.id_autobus} style={{ backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '10px', marginBottom: '10px', fontSize: '0.85rem' }}>
                              <strong>⚠️ Unidad {bus.busId}</strong>
                              <br />Salida límite: {bus.departureTime}
                              <br />Ubicación: {bus.currentArea}
                            </div>
                          ))
                        )}
                      </div>
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
                        const destinoSeleccionado = destinosOperador[bus.busId] || ''; 

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

                                <button 
                                  onClick={() => {
                                    confirmarMovimientoDirecto(bus, destinoSeleccionado);
                                    setDestinosOperador(prev => { const n = {...prev}; delete n[bus.busId]; return n; });
                                  }} 
                                  disabled={!destinoSeleccionado} 
                                  style={{ width: '100%', padding: '15px', backgroundColor: '#1976D2', color: 'white', fontSize: '18px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: (!destinoSeleccionado) ? 'not-allowed' : 'pointer', opacity: (!destinoSeleccionado) ? 0.5 : 1 }}
                                >
                                  FINALIZAR SERVICIO Y ENVIAR
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
          <div 
            onClick={cerrarModal} 
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px', boxSizing: 'border-box' }}
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid var(--bg-light)', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, color: 'var(--ado-purple)', fontSize: '1.4rem' }}>Detalles Unidad #{busSeleccionado.busId}</h3>
                <button onClick={cerrarModal} style={{ background: '#f1f5f9', border: 'none', fontSize: '1.2rem', cursor: 'pointer', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
                  ✖
                </button>
              </div>
              
              <div style={{ backgroundColor: 'var(--bg-light)', padding: '15px', borderRadius: '12px', marginBottom: '20px', fontSize: '1rem' }}>
                <p style={{ margin: '0 0 8px 0' }}><strong>Área actual:</strong> <span style={{ color: 'var(--ado-red)', fontWeight: 600 }}>{busSeleccionado.currentArea} ({busSeleccionado.estadoServicio})</span></p>
                <p style={{ margin: '0 0 8px 0' }}><strong>Ingreso al Patio:</strong> {new Date(busSeleccionado.ingresoPatio).toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'})}</p>
                
                <p style={{ margin: '20px 0 10px 0', fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>Historial de Servicios:</p>
                {Object.keys(busSeleccionado.historialTiempos).length === 0 ? (
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>No hay servicios registrados aún.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                    {Object.entries(busSeleccionado.historialTiempos).map(([area, tiempos]) => (
                      <li key={area} style={{ margin: '8px 0' }}>
                        <strong>{area}:</strong> <br/>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                          Inició {tiempos.inicio || '--:--'} | Finalizó {tiempos.fin || '--:--'}
                        </span>
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