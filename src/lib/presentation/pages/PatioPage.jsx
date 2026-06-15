// src/lib/presentation/pages/PatioPage.jsx
import { useState } from 'react';
import { useMenuBloc } from '../../logic/useMenuBloc';
import { usePatioBloc } from '../../logic/usePatioBloc';
import { RegistroUnidadPage } from './RegistroUnidadPage';
import "../../../App.css";

export const PatioPage = ({ usuario }) => {
  const { cerrarSesion } = useMenuBloc();
  const [vistaActual, setVistaActual] = useState('patio');
  const { autobuses, cargando, cargarAutobuses } = usePatioBloc(); 

  // Definición estructurada de las áreas (Basado en la imagen y URD)
  const definicionAreas = [
    { id: 'Desfogue', nombre: 'Desfogue', capacidad: 4, icono: '💨' },
    { id: 'Diesel', nombre: 'Diesel', capacidad: 3, icono: '⛽' },
    { id: 'Lavado Exterior', nombre: 'Lavado Exterior', capacidad: 4, icono: '🚿' },
    { id: 'Lavado Interior', nombre: 'Lavado Interior', capacidad: 3, icono: '🧽' },
    { id: 'Ad-Blue', nombre: 'AdBlue', capacidad: 2, icono: '💧' },
    { id: 'Taller - Preventivo', nombre: 'Taller', capacidad: 2, icono: '🛠️' },
    { id: 'En espera', nombre: 'Área de Espera', capacidad: 6, icono: '🚏' }
  ];

  // Función para agrupar los autobuses de la BD por su estado/área actual
  const obtenerSlotsArea = (nombreArea, capacidad) => {
    // Filtramos los autobuses que están en esta área específica
    const busesEnArea = autobuses.filter(bus => bus.estado_actual === nombreArea);
    
    // Creamos los slots llenos
    const slots = busesEnArea.slice(0, capacidad).map(bus => (
      <div key={bus.id_autobus} className="slot occ">
        <span>{bus.numero_serie}</span>
        <span className="slot-time">{bus.tiempo_en_area} min</span>
      </div>
    ));

    // Rellenamos el resto de la capacidad con slots "Libre"
    const espaciosLibres = capacidad - slots.length;
    for (let i = 0; i < espaciosLibres; i++) {
      slots.push(
        <div key={`free-${nombreArea}-${i}`} className="slot free">
          <span>Libre</span>
        </div>
      );
    }
    return slots;
  };

  return (
    <div className="app-layout">
      
      {/* ================= BARRA LATERAL (IDÉNTICA A LA IMAGEN) ================= */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>ADO</h1>
        </div>
        
        <ul className="sidebar-menu">
          <li>
            <a 
              className={vistaActual === 'patio' ? 'active' : ''} 
              onClick={() => { setVistaActual('patio'); cargarAutobuses(); }}
            >
              🏠 Patio en tiempo real
            </a>
          </li>

          {/* BOTÓN DE REGISTRO EN BARRA LATERAL (Solo para autorizados) */}
          {(usuario.rol === 'Administrador' || usuario.rol === 'Supervisor') && (
            <li>
              <a 
                className={vistaActual === 'registrar' ? 'active' : ''} 
                onClick={() => setVistaActual('registrar')}
              >
                ⊕ Registrar camión
              </a>
            </li>
          )}
          
          <li><a>🔃 Movimientos</a></li>
          <li><a>🕒 Historial</a></li>
          <li><a>📊 Reportes</a></li>
          <li><a>⚙️ Configuración</a></li>
          <li style={{ marginTop: '20px' }}>
            <a onClick={cerrarSesion} style={{ color: '#ef4444' }}>🚪 Cerrar sesión</a>
          </li>
        </ul>
      </aside>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <main className="main-content">
        
        {/* Cabecera (Topbar) */}
        <header className="topbar">
          <div className="topbar-title">Control de Patio - Oaxaca</div>
          <div className="user-profile">
            <div style={{ textAlign: 'right' }}>
              <p className="name">{usuario.nombre}</p>
              <p className="role">{usuario.rol}</p>
            </div>
            <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              👤
            </div>
          </div>
        </header>

        {/* Renderizado de Pantallas */}
        <div className="dashboard-container">
          
          {vistaActual === 'patio' && (
            <>
              {/* Cabecera del Dashboard */}
              <div className="dash-header">
                <div>
                  <h2>Patio en tiempo real</h2>
                  <p>Vista general de ocupación por área</p>
                </div>
                
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div className="leyenda">
                    <div className="leyenda-item"><div className="caja-color caja-libre"></div> Libre</div>
                    <div className="leyenda-item"><div className="caja-color caja-ocupada"></div> Ocupado</div>
                  </div>
                  
                  {/* BOTÓN DE REGISTRO EN CABECERA */}
                  {(usuario.rol === 'Administrador' || usuario.rol === 'Supervisor') && (
                    <button className="btn-registrar-header" onClick={() => setVistaActual('registrar')}>
                      ⊕ Registrar camión
                    </button>
                  )}
                </div>
              </div>

              {/* Grid Central */}
              <div className="dash-grid">
                
                {/* Lado Izquierdo: Las Áreas */}
                <div className="areas-grid">
                  {definicionAreas.map((area) => (
                    <div key={area.id} className="area-card">
                      <div className="area-header">
                        <h3>{area.icono} {area.nombre}</h3>
                        <span>Capacidad: {area.capacidad}</span>
                      </div>
                      <div className="slots-container">
                        {cargando ? <p style={{fontSize: '0.8rem'}}>Cargando...</p> : obtenerSlotsArea(area.id, area.capacidad)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Lado Derecho: Widgets */}
                <div className="widget-panel">
                  
                  <div className="widget-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-muted)' }}>Autobuses activos</p>
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
                    <h3 className="widget-title">Alertas</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No hay alertas activas.</p>
                  </div>

                </div>

              </div>
            </>
          )}

          {vistaActual === 'registrar' && <RegistroUnidadPage />}
          
        </div>
      </main>
    </div>
  );
};