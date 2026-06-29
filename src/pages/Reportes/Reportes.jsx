import "./Reportes.css";
import { MdBarChart, MdAssignmentTurnedIn, MdTimeline, MdPeople } from "react-icons/md";

// const [datosReportes, setDatosReportes] = useState([
//     {
//       id: "rep-1",
//       codigo: "ADO-1020",
//       conductor: "Carlos Gómez",
//       horaEntrada: "10:15:30 AM",
//       horaSalida: "11:45:22 AM",
//       estado: "Completado"
//     }
// ]);

export default function Reportes({ datos }) {

  // Cálculos estadísticos rápidos para los indicadores de arriba
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
          <table className="reportes-table">
            <thead>
              <tr>
                <th>ID Autobús</th>
                <th>Conductor</th>
                <th>Hora Entrada al Flujo</th>
                <th>Hora Salida / Liberación</th>
                <th>Estatus</th>
                <th>Progreso</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((item) => (
                <tr key={item.id}>
                  <td><span className="badge-bus-rep">{item.codigo}</span></td>
                  <td>
                    <div className="driver-cell">
                      <MdPeople className="driver-icon" />
                      <span>{item.conductor || "Sin conductor asignado"}</span>
                    </div>
                  </td>
                  <td className="time-in">{item.horaEntrada}</td>
                  <td className={`time-out ${item.horaSalida === "En proceso..." ? "text-anim" : ""}`}>
                    {item.horaSalida}
                  </td>
                  <td>
                    <span className={
                      item.estado === 'Completado' ? 'badge-rojo' : 
                      item.estado === 'En descanso' ? 'badge-amarillo' : 
                      'badge-verde'
                    }>
                      {item.estado === 'Completado' ? 'COMPLETADO' : 
                       item.estado === 'En descanso' ? 'EN DESCANSO' : 
                       'EN PATIO'}
                    </span>
                  </td>
                  <td>
  <div className="tabla-progreso-bg">
    <div className="tabla-progreso-fill" style={{ width: `${item.progreso}%` }}></div>
  </div>
</td>
<td>
                  <div className="progreso-celda-container">
                    <div className="barra-progreso-fondo">
                      <div 
                        className="barra-progreso-relleno" 
                        style={{ width: `${item.progreso}%` }}
                      ></div>
                    </div>
                    <span className="porcentaje-texto">{item.progreso}%</span>
                  </div>
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}