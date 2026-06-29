import { useState } from 'react';
import TarjetaInfo from './TarjetaInfo.jsx';
import mockDB from './CamionArea.json';
import './DropDrag.css';
import Registro from '../Registro/Registro.jsx';
import ConfAvaz from '../ConfAvanz/ConfAvaz.jsx';
import Reportes from '../Reportes/Reportes.jsx';

import { MdDashboard, MdAssignmentTurnedIn, MdSwapHoriz, MdHistory, MdBarChart, MdSettings, MdExitToApp } from "react-icons/md";
import { TbWash, TbWashDryDip } from "react-icons/tb";
import { BsFillFuelPumpDieselFill } from "react-icons/bs";
import { CiDroplet } from "react-icons/ci";
import { MdLocalCarWash } from "react-icons/md";
import { HiMiniWrenchScrewdriver } from "react-icons/hi2";
import { SiBlockbench } from "react-icons/si";
import { MdAddAlert } from "react-icons/md";

const areaIcons = {
  "Desfogue": <TbWash />,
  "Diesel": <BsFillFuelPumpDieselFill />,
  "Ad-Blue": <CiDroplet />,
  "Lavado Exterior": <MdLocalCarWash />,
  "Lavado Interior": <TbWashDryDip />,
  "Taller": <HiMiniWrenchScrewdriver />,
  "Descanso": <SiBlockbench />
};

export default function DropDrag() {
  const [pestanaActiva, setPestanaActiva] = useState('patio');
  const [camiones, setCamiones] = useState(mockDB.camiones);
  const [camionSeleccionado, setCamionSeleccionado] = useState(null);
  const agregarCamion = (nuevoCamion) => {
    setCamiones((prev) => [...prev, nuevoCamion]);
  };

  const [alertas, setAlertas] = useState([]);
  const [areasConfig, setAreasConfig] = useState(mockDB.areas); //Las áreas si van a cambiar
  const [historial, setHistorial] = useState([]);

  const crearAlerta = (alertaNueva) => {
  setAlertas((prev) => [...prev, alertaNueva]);
  const ahora = new Date();

setHistorial(prev => [
  {
    id: Date.now(),
    tipo: "alerta",
    unidad: alertaNueva.autobus,
    fecha: ahora.toLocaleDateString('es-MX'),
    hora: ahora.toLocaleTimeString('es-MX'),
    mensaje: `Alerta: la unidad ${alertaNueva.autobus} excedió el tiempo permitido en ${alertaNueva.area}`
  },
  ...prev
  ]);

  setTimeout(() => {
    setAlertas((prev) =>
      prev.filter((alerta) => alerta !== alertaNueva)
    );
  }, 5000);
  };

  const sacarCamion = (idCamion) => {
    const camion = camiones.find(c => c.id === idCamion);

    if (!camion) return;

    const ahora = new Date();
    const horaSalidaTexto = ahora.toLocaleTimeString('es-MX');

    const registroSalida = {
      id: Date.now(),
      unidad: camion.codigo,
      areaFinal: camion.area,
      fecha: ahora.toLocaleDateString('es-MX'),
      hora: horaSalidaTexto,
      mensaje: `La unidad ${camion.codigo} salió de la terminal ADO`
    };

    setHistorial(prev => [registroSalida, ...prev]);

    // CORREGIDO: En lugar de usar .filter() para eliminarlo, 
    // mapeamos el arreglo y cambiamos su área a "Fuera" guardando su hora de salida
    setCamiones(prev =>
      prev.map(c => 
        c.id === idCamion 
          ? { ...c, area: "Fuera", horaSalidaTerminal: horaSalidaTexto } 
          : c
      )
    );
  };

  const agregarHistorial = (registro) => {
  setHistorial(prev => [registro, ...prev]);
  };

  const alIniciarArrastre = (e, idCamion) => {
    e.dataTransfer.setData('text/plain', idCamion);
  };

  const permitirSoltar = (e) => {
    e.preventDefault();
  };

 const alSoltar = (e, nuevaAreaId) => { 
    e.preventDefault();
    const idCamion = e.dataTransfer.getData('text/plain');

    const camionQueSeMueve = camiones.find(c => c.id === idCamion);
    if (!camionQueSeMueve) return;
    
    const areaActual = camionQueSeMueve.area;
    if (areaActual === nuevaAreaId) return;

    // 🌟 NUEVO: Validación estricta usando la ruta asignada en el Registro
    if (camionQueSeMueve.ruta && camionQueSeMueve.ruta.length > 0) {
      const indiceActual = camionQueSeMueve.ruta.indexOf(areaActual);
      const siguienteAreaEsperada = camionQueSeMueve.ruta[indiceActual + 1];

      // Si intenta saltarse pasos o ir a un área que no le toca
      if (nuevaAreaId !== siguienteAreaEsperada) {
        alert(`Movimiento incorrecto.\nEl autobús ${camionQueSeMueve.codigo} tiene asignado ir a: "${siguienteAreaEsperada || 'Completar ciclo'}".`);
        return;
      }
    } else {
      // Si es un camión de prueba sin ruta, usamos las reglas genéricas que tenías
      const reglasFlujo = {
        "Desfogue": ["Diesel", "Ad-Blue","Descanso"], 
        "Diesel": ["Ad-Blue","Descanso"],
        "Ad-Blue": ["Lavado Interior","Lavado Exterior","Taller","Descanso"],
        "Lavado Exterior": ["Lavado Interior","Taller","Descanso"], 
        "Lavado Interior": ["Lavado Exterior", "Taller","Descanso"],
        "Taller": ["Lavado Exterior", "Lavado Interior","Descanso"],
        "Descanso": ["Desfogue"] 
      };

      const movimientosPermitidos = reglasFlujo[areaActual] || [];
      if (!movimientosPermitidos.includes(nuevaAreaId)) {
        alert(`Movimiento no autorizado.\nUn autobús en "${areaActual}" solo puede avanzar a: ${movimientosPermitidos.join(" o ")}.`);
        return;
      }
    }

    const infoAreaDestino = areasConfig.find(a => a.id === nuevaAreaId);
    const limiteMaximoArea = infoAreaDestino ? infoAreaDestino.capacidad : 4;

    const camionesEnAreaDestino = camiones.filter(c => c.area === nuevaAreaId).length;

    if (camionesEnAreaDestino >= limiteMaximoArea) {
      alert(`El área de ${nuevaAreaId} ya alcanzó su límite máximo de ${limiteMaximoArea} lugares.`);
      return;
    }

    const camionesActualizados = camiones.map((camion) => {
      if (camion.id === idCamion) {
        return { ...camion, area: nuevaAreaId };
      }
      return { ...camion };
    });

    const camionMovido = camiones.find(
  c => c.id === idCamion
  );

if (camionMovido) {
  const ahora = new Date();

  setHistorial(prev => [
    {
      id: Date.now(),
      tipo: "movimiento",
      unidad: camionMovido.codigo,
      fecha: ahora.toLocaleDateString('es-MX'),
      hora: ahora.toLocaleTimeString('es-MX'),
      mensaje: `La unidad ${camionMovido.codigo} fue movida de ${camionMovido.area} a ${nuevaAreaId}`
    },
    ...prev
  ]);
  }

    setCamiones(camionesActualizados);
  };
  
  const generarDatosDeReporte = () => {
    return camiones.map((camion) => {
      const movimientosDelCamion = historial.filter(
        (mov) => mov.unidad === camion.codigo
      );

      const horaEntrada = movimientosDelCamion.length > 0 
        ? movimientosDelCamion[movimientosDelCamion.length - 1].hora 
        : "Recién registrado";

      const areaActual = camion.area ? camion.area.trim() : "";

      let horaSalida = "En proceso...";
      if (areaActual === "Fuera" && camion.horaSalidaTerminal) {
        horaSalida = camion.horaSalidaTerminal;
      }

      let estadoActual = "En flujo"; 
      if (areaActual === "Fuera") {
        estadoActual = "Completado"; 
      } else if (areaActual === "Descanso") {
        estadoActual = "En descanso"; 
      }

      // 📊 CÁLCULO DINÁMICO DEL PROGRESS BAR
      let porcentajeProgreso = 0;
      
      if (areaActual === "Fuera") {
        porcentajeProgreso = 100; // Si ya salió, completó el 100%
      } else {
        // Encontramos la posición del área actual en la configuración de la terminal
        const indiceArea = areasConfig.findIndex(a => a.id === areaActual);
        
        if (indiceArea !== -1 && areasConfig.length > 0) {
          // Dividimos el 100% entre el total de áreas y multiplicamos por la posición actual (+1 para no empezar en 0%)
          porcentajeProgreso = Math.round(((indiceArea + 1) / areasConfig.length) * 100);
        }
      }

      return {
        id: camion.id, 
        codigo: camion.codigo,
        conductor: camion.conductor,
        horaEntrada: horaEntrada,
        horaSalida: horaSalida,
        estado: estadoActual,   
        status: estadoActual,   
        estatus: estadoActual,
        progreso: porcentajeProgreso // 👈 Enviamos el porcentaje calculado al reporte
      };
    });
  };

  const obtenerProgresoCamion = (camion) => {
    if (!camion) return 0;
    
    // Si ya se presionó el botón de finalizar, la barra va al 100%
    if (camion.finalizado || camion.area === "Fuera") return 100;

    // Cálculo dinámico empezando en 0%
    if (camion.ruta && camion.ruta.length > 0) {
      const indiceArea = camion.ruta.indexOf(camion.area);
      if (indiceArea !== -1) {
        // Fórmula: (posición actual / total de paradas) * 100
        return Math.round((indiceArea / camion.ruta.length) * 100);
      }
    } else {
      // Fallback para camiones sin ruta configurada
      const indiceArea = areasConfig.findIndex(a => a.id === camion.area);
      if (indiceArea !== -1 && areasConfig.length > 0) {
        return Math.round((indiceArea / areasConfig.length) * 100);
      }
    }
    return 0;
  };

const finalizarRecorrido = (idCamion) => {
    const camion = camiones.find(c => c.id === idCamion);
    if (!camion) return;

    const ahora = new Date();
    const horaSalidaTexto = ahora.toLocaleTimeString('es-MX');

    // 1. Guardamos en el historial
    setHistorial(prev => [
      {
        id: Date.now(),
        tipo: "completado",
        unidad: camion.codigo,
        fecha: ahora.toLocaleDateString('es-MX'),
        hora: horaSalidaTexto,
        mensaje: `La unidad ${camion.codigo} completó su ruta en ${camion.area}`
      },
      ...prev
    ]);

    // 2. Marcamos el camión como finalizado, pero SIN sacarlo de su área actual
    setCamiones(prev =>
      prev.map(c => 
        c.id === idCamion 
          ? { ...c, finalizado: true, horaSalidaTerminal: horaSalidaTexto } 
          : c
      )
    );
  };

   const renderizarContenido = () => {
    switch (pestanaActiva) {
      case 'patio':
        return (
          <div className="drag-board">
            {areasConfig.map((areaInfo) => {
              const nombreArea = areaInfo.id;
              const capacidadMaxima = areaInfo.capacidad;
              const camionesActuales = camiones.filter((c) => c.area === nombreArea).length;
              

              return (
                <div
                  key={nombreArea}
                  className="drag-zone"
                  onDragOver={permitirSoltar}
                  onDrop={(e) => alSoltar(e, nombreArea)}
                >
                  <div className="drag-zone__header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="sidebar__icon-active">
                        {areaIcons[nombreArea]}
                      </span>
                      <h3>{nombreArea}</h3>
                    </div>
                    <span className="zone-counter">
                      Capacidad: {camionesActuales}/{capacidadMaxima}
                    </span>
                  </div>

                  <div className="drag-zone__content">
                    {camiones.filter((camion) => camion.area === nombreArea).length === 0 ? (
                      <div className="no-buses">No hay autobuses</div>
                    ) : (
                      camiones
                        .filter((camion) => camion.area === nombreArea)
                        .map((camion) => (
                        <div
                       key={camion.id}
                       onDoubleClick={() => setCamionSeleccionado(camion)}
                        title="Doble clic para ver detalles del Registro"
                      >
                   <TarjetaInfo
  camion={camion}
  alIniciarArrastre={alIniciarArrastre}
  crearAlerta={crearAlerta}
  progreso={obtenerProgresoCamion(camion)} /* 👈 Agrega esta línea */
/>

                  {/* 🌟 NUEVA LÓGICA: BOTÓN DINÁMICO DE SALIDA */}
{ (camion.ruta && camion.ruta.length > 0) ? (
  // Aparece en la última parada, solo si NO ha sido finalizado
  camion.area === camion.ruta[camion.ruta.length - 1] && !camion.finalizado && (
    <button
      className="btn-salida"
      onClick={() => finalizarRecorrido(camion.id)}
    >
      Finalizar recorrido
    </button>
  )
) : (
  nombreArea === "Descanso" && !camion.finalizado && (
    <button
      className="btn-salida"
      onClick={() => finalizarRecorrido(camion.id)}
    >
      Finalizar recorrido
    </button>
  )
)}
                </div>
                        ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      case 'registrar':
  return (
    <Registro
      agregarCamion={agregarCamion}
      agregarHistorial={agregarHistorial}
    />
  );
     case 'historial':
  return (
    <div className="historial-container">
      <h2>Historial de Movimientos</h2>

      {historial.length === 0 ? (
        <p>No hay registros disponibles.</p>
      ) : (
        <div className="historial-grid">
          {historial.map((registro) => (
            <div
              key={registro.id}
              className="historial-card"
            >
              <div className="historial-card__mensaje">
                {registro.mensaje}
              </div>

              <div className="historial-card__info">
                <span>Unidad: {registro.unidad}</span>
              </div>

              <div className="historial-card__fecha">
                {registro.fecha} · {registro.hora}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
      case 'reportes':
        return <Reportes datos={generarDatosDeReporte()} />;

      case 'configuracion':
        return (
          <ConfAvaz //Lista de camiones
            areasConfig={areasConfig} 
            setAreasConfig={setAreasConfig} 
            camiones={camiones} 
            setCamiones={setCamiones}
          />
        );
      default:
        return <div className="pantalla-vacia"><h2>Selecciona una opción</h2></div>;
    }
  };

  // SIDEBAR

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar__logo">
          <img
            src="/logo-ado.png"
           alt="ADO"
        className="sidebar__logo-img"
      />
     </div>

        <nav className="sidebar__nav">
          <button 
            className={`sidebar__item ${pestanaActiva === 'patio' ? 'sidebar__item--active' : ''}`}
            onClick={() => setPestanaActiva('patio')}
          >
            <MdDashboard className="sidebar__icon" />
            <span>Patio en tiempo real</span>
          </button>
          <button 
            className={`sidebar__item ${pestanaActiva === 'registrar' ? 'sidebar__item--active' : ''}`}
            onClick={() => setPestanaActiva('registrar')}
          >
            <MdAssignmentTurnedIn className="sidebar__icon" />
            <span>Registrar camión</span>
          </button>
          <button 
            className={`sidebar__item ${pestanaActiva === 'historial' ? 'sidebar__item--active' : ''}`}
            onClick={() => setPestanaActiva('historial')}
          >
            <MdHistory className="sidebar__icon" />
            <span>Historial</span>
          </button>
          <button 
            className={`sidebar__item ${pestanaActiva === 'reportes' ? 'sidebar__item--active' : ''}`}
            onClick={() => setPestanaActiva('reportes')}
          >
            <MdBarChart className="sidebar__icon" />
            <span>Reportes</span>
          </button>
          <button 
            className={`sidebar__item ${pestanaActiva === 'configuracion' ? 'sidebar__item--active' : ''}`}
            onClick={() => setPestanaActiva('configuracion')}
          >
            <MdSettings className="sidebar__icon" />
            <span>Configuración Avanzada</span>
          </button>       
        </nav> 

        <button className="sidebar__logout" onClick={() => alert('Cerrando sesión...')}>
          <MdExitToApp className="sidebar__icon" />
          <span>Cerrar sesión</span>
        </button>
      </aside>

      <main className="main-content">
        <header className="main-content__header">
          <h1>Control de Patio - Oaxaca</h1>
          <p>Vista general de ocupación por área</p>
        </header>
        {alertas.length > 0 && (
         <div className="alertas-container">
           {alertas.map((alerta, index) => (
          <div key={index} className="alerta-toast">
           <MdAddAlert />
          <span>
         El autobús {alerta.autobus} está en {alerta.area} y lleva {alerta.tiempo}
         </span>
        </div>
    ))}
  </div>
)}
        
        {renderizarContenido()}
      </main>

      {/* INFORMACION DEL CAMION */}
      {camionSeleccionado && (
        <div className="modal-overlay" onClick={() => setCamionSeleccionado(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card__header">
              <h2>Ficha de Registro: {camionSeleccionado.codigo}</h2>
              <button className="modal-card__close" onClick={() => setCamionSeleccionado(null)}>&times;</button>
            </div>
            <div className="modal-card__body">
              <div className="modal-data-row"><strong>Código:</strong> <span>{camionSeleccionado.codigo}</span></div>
              <div className="modal-data-row"><strong>Tipo de Autobús:</strong> <span>{camionSeleccionado.tipo}</span></div>
              <div className="modal-data-row"><strong>Área Asignada:</strong> <span>{camionSeleccionado.area}</span></div>
              
              <div className="modal-data-row"><strong>Conductor Asignado:</strong> <span>{camionSeleccionado.conductor || 'No asignado'}</span></div>
              <div className="modal-data-row"><strong>Origen:</strong> <span>{camionSeleccionado.origen || 'N/A'}</span></div>
              <div className="modal-data-row"><strong>Destino:</strong> <span>{camionSeleccionado.destino || 'N/A'}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}