import "./Reportes.css";
import { MdBarChart, MdAssignmentTurnedIn, MdTimeline, MdPeople } from "react-icons/md";

export default function Reportes({ datos }) {

  const totalUnidades = datos.length;
  const completados = datos.filter(d => d.horaSalida !== "En proceso...").length;
  const enProceso = totalUnidades - completados;

  return (
    <div className="reportes-panel">
      <div className="reportes-header">
        <h2>Panel de Reportes y Rendimiento</h2>
        <p>Análisis de tiempos de estancia y productividad por unidad vehicular.</p>
      </div>

      {/* Tarjetas de Indicadores Rápidos (KPIs) */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon"><MdTimeline /></div>
          <div className="kpi-info">
            <h3>{totalUnidades}</h3>
            <p>Unidades Totales</p>
          </div>
        </div>
        <div className="kpi-card completado">
          <div className="kpi-icon"><MdAssignmentTurnedIn /></div> 
          <div className="kpi-info">
            <h3>{completados}</h3>
            <p>Ciclos Completados</p>
          </div>
        </div>
        <div className="kpi-card proceso">
          <div className="kpi-icon"><MdBarChart /></div>
          <div className="kpi-info">
            <h3>{enProceso}</h3>
            <p>En Flujo Activo</p>
          </div>
        </div>
      </div>

      {/* Tabla Principal de Reportes */}
      {datos.length === 0 ? (
        <div className="no-reportes">No hay registros analíticos disponibles.</div>
      ) : (
        <div className="table-container-rep">
          
          {/* 🌟 CONTENEDOR RESPONSIVO: Agregamos overflowX para que se pueda deslizar si es muy grande */}
          <div style={{ overflowX: 'auto', width: '100%', paddingBottom: '10px' }}>
            <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', color: '#e5e7eb', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937' }}>
                  <th style={{ padding: '16px', whiteSpace: 'nowrap', color: '#9ca3af', fontWeight: 'normal' }}>ID Autobús</th>
                  <th style={{ padding: '16px', whiteSpace: 'nowrap', color: '#9ca3af', fontWeight: 'normal' }}>Conductor</th>
                  <th style={{ padding: '16px', whiteSpace: 'nowrap', color: '#9ca3af', fontWeight: 'normal' }}>Hora Entrada al Flujo</th>
                  <th style={{ padding: '16px', whiteSpace: 'nowrap', color: '#9ca3af', fontWeight: 'normal' }}>Hora Salida / Liberación</th>
                  <th style={{ padding: '16px', whiteSpace: 'nowrap', color: '#9ca3af', fontWeight: 'normal' }}>Estatus</th>
                  {/* minWidth: '120px' para que la palabra Progreso nunca se aplaste */}
                  <th style={{ padding: '16px', whiteSpace: 'nowrap', color: '#9ca3af', fontWeight: 'normal', textAlign: 'right', minWidth: '120px' }}>Progreso</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((item) => {
                  
                  // 🌟 Lógica dinámica para los colores del Estatus
                  let colorBorde = '#10b981'; // Verde por defecto (En Flujo / En Patio)
                  let colorFondo = 'rgba(16, 185, 129, 0.1)';
                  let colorTexto = '#10b981';

                  if (item.estado === 'En descanso') {
                    colorBorde = '#f59e0b'; // Amarillo/Naranja
                    colorFondo = 'rgba(245, 158, 11, 0.1)';
                    colorTexto = '#f59e0b';
                  } else if (item.estado === 'Completado') {
                    colorBorde = '#3b82f6'; // Azul
                    colorFondo = 'rgba(59, 130, 246, 0.1)';
                    colorTexto = '#3b82f6';
                  }

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #1f2937' }}>
                      
                      {/* Recuadro oscuro para el ID del Autobús */}
                      <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                        <span style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                          border: '1px solid rgba(255, 255, 255, 0.1)', 
                          padding: '6px 12px', 
                          borderRadius: '6px', 
                          fontWeight: '600' 
                        }}>
                          {item.codigo}
                        </span>
                      </td>
                      
                      {/* Conductor con su icono morado */}
                      <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#8b5cf6', fontSize: '16px' }}>
                            <MdPeople />
                          </span>
                          <span>{item.conductor}</span>
                        </div>
                      </td>
                      
                      <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>{item.horaEntrada}</td>
                      
                      <td style={{ padding: '16px', whiteSpace: 'nowrap', color: item.horaSalida === 'En proceso...' ? '#f59e0b' : '#e5e7eb', fontStyle: item.horaSalida === 'En proceso...' ? 'italic' : 'normal' }}>
                        {item.horaSalida}
                      </td>
                      
                      {/* Recuadro de color estilo neón para el Estatus */}
                      <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                        <span style={{ 
                          backgroundColor: colorFondo, 
                          border: `1px solid ${colorBorde}`, 
                          color: colorTexto, 
                          padding: '6px 12px', 
                          borderRadius: '6px', 
                          fontSize: '12px',
                          fontWeight: 'bold',
                          letterSpacing: '0.5px'
                        }}>
                          {item.estado.toUpperCase()}
                        </span>
                      </td>
                      
                      {/* Celda de la Barra de Progreso */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
                          <div style={{ backgroundColor: '#222b3c', borderRadius: '4px', width: '70px', height: '6px', overflow: 'hidden', flexShrink: 0 }}>
                            <div style={{ background: 'linear-gradient(90deg, #3b82f6, #10b981)', height: '100%', width: `${item.progreso}%`, transition: 'width 0.4s ease' }}></div>
                          </div>
                          <span style={{ fontWeight: 'bold', fontSize: '14px', minWidth: '35px', textAlign: 'right' }}>{item.progreso}%</span>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
}