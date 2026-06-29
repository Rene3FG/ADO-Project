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

  const [movimientoPendiente, setMovimientoPendiente] = useState(null);

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

    setCamiones(prev =>
      prev.map(c => 
        c.id === idCamion 
          ? { ...c, area: "Fuera", horaSalidaTerminal: horaSalidaTexto } 
          : c
      )
    );
  };

  const mandarADescanso = (idCamion) => {
    const camion = camiones.find(c => c.id === idCamion);
    if (!camion) return;

    // 1. Validamos que el área de Descanso no esté llena
    const infoDescanso = areasConfig.find(a => a.id === "Descanso");
    const limiteDescanso = infoDescanso ? infoDescanso.capacidad : 4;
    const camionesEnDescanso = camiones.filter(c => c.area === "Descanso").length;

    if (camionesEnDescanso >= limiteDescanso) {
      alert(`No hay espacio. El área de Descanso está llena (${limiteDescanso}/${limiteDescanso}).`);
      return;
    }

    const ahora = new Date();

    setHistorial(prev => [
      {
        id: Date.now(),
        tipo: "movimiento",
        unidad: camion.codigo,
        fecha: ahora.toLocaleDateString('es-MX'),
        hora: ahora.toLocaleTimeString('es-MX'),
        mensaje: `La unidad ${camion.codigo} terminó su ruta y pasó a Descanso`
      },
      ...prev
    ]);

    setCamiones(prev =>
      prev.map(c => 
        c.id === idCamion 
          ? { ...c, area: "Descanso", finalizado: true } 
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

  // Esta función mueve el camión de verdad (ya sea por el camino feliz o forzado por el usuario)
  const ejecutarMovimiento = (idCamion, nuevaAreaId) => {
    // 1. Validar límite de capacidad primero (esto sí es un bloqueo estricto)
    const infoAreaDestino = areasConfig.find(a => a.id === nuevaAreaId);
    const limiteMaximoArea = infoAreaDestino ? infoAreaDestino.capacidad : 4;
    const camionesEnAreaDestino = camiones.filter(c => c.area === nuevaAreaId).length;

    if (camionesEnAreaDestino >= limiteMaximoArea) {
      alert(`Bloqueo: El área de ${nuevaAreaId} está llena (${limiteMaximoArea} lugares).`);
      return;
    }

    // 2. Mover el camión
    const camionesActualizados = camiones.map((camion) => {
      if (camion.id === idCamion) {
        return { ...camion, area: nuevaAreaId };
      }
      return { ...camion };
    });

    const camionMovido = camiones.find(c => c.id === idCamion);
    if (camionMovido) {
      const ahora = new Date();
      setHistorial(prev => [
        {
          id: Date.now(),
          tipo: "movimiento",
          unidad: camionMovido.codigo,
          fecha: ahora.toLocaleDateString('es-MX'),
          hora: ahora.toLocaleTimeString('es-MX'),
          mensaje: `La unidad ${camionMovido.codigo} fue movida a ${nuevaAreaId}`
        },
        ...prev
      ]);
    }

    setCamiones(camionesActualizados);
  };

 const alSoltar = (e, nuevaAreaId) => { 
    e.preventDefault();
    const idCamion = e.dataTransfer.getData('text/plain');

    const camionQueSeMueve = camiones.find(c => c.id === idCamion);
    if (!camionQueSeMueve) return;
    
    const areaActual = camionQueSeMueve.area;
    if (areaActual === nuevaAreaId) return;

    let advertenciaFlujo = null;

    // Evaluamos si está rompiendo las reglas
    if (camionQueSeMueve.ruta && camionQueSeMueve.ruta.length > 0) {
      if (camionQueSeMueve.finalizado) {
        if (nuevaAreaId !== "Descanso") {
          advertenciaFlujo = `La unidad ${camionQueSeMueve.codigo} ya completó su ciclo. ¿Seguro que deseas moverla a "${nuevaAreaId}" en lugar de enviarla a Descanso?`;
        }
      } else {
        const indiceActual = camionQueSeMueve.ruta.indexOf(areaActual);
        const siguienteAreaEsperada = camionQueSeMueve.ruta[indiceActual + 1];
        if (nuevaAreaId !== siguienteAreaEsperada) {
          advertenciaFlujo = `La unidad ${camionQueSeMueve.codigo} tiene asignado ir a "${siguienteAreaEsperada || 'Completar ciclo'}". ¿Deseas forzar su desvío a "${nuevaAreaId}"?`;
        }
      }
    } else {
      // Reglas para camiones sin ruta
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
        advertenciaFlujo = `Movimiento inusual. Un autobús en "${areaActual}" normalmente va a: ${movimientosPermitidos.join(" o ")}. ¿Forzar traslado a "${nuevaAreaId}"?`;
      }
    }

    if (advertenciaFlujo) {
      setMovimientoPendiente({
        idCamion: idCamion,
        nuevaAreaId: nuevaAreaId,
        mensaje: advertenciaFlujo
      });
      return;
    }

    ejecutarMovimiento(idCamion, nuevaAreaId);
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

      //Calculo de progress bar
      let porcentajeProgreso = 0;

if (areaActual === "Fuera" || camion.finalizado) {
  porcentajeProgreso = 100;
} else {
  if (camion.ruta && camion.ruta.length > 0) {
    const indiceArea = camion.ruta.indexOf(areaActual);
    if (indiceArea !== -1) {
      porcentajeProgreso = Math.round(((indiceArea + 1) / camion.ruta.length) * 100);
    }
  } else {
    const indiceArea = areasConfig.findIndex(a => a.id === areaActual);
    if (indiceArea !== -1 && areasConfig.length > 0) {
      porcentajeProgreso = Math.round(((indiceArea + 1) / areasConfig.length) * 100);
    }
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
        progreso: porcentajeProgreso
      };
    });
  };

  const obtenerProgresoCamion = (camion) => {
  if (!camion) return 0;

  if (camion.area === "Fuera" || camion.finalizado === true) {
    return 100;
  }

  if (camion.ruta && camion.ruta.length > 0) {
    const indiceArea = camion.ruta.indexOf(camion.area);
    if (indiceArea !== -1) {
      return Math.round(((indiceArea + 1) / camion.ruta.length) * 100);
    }
  }

  const indiceArea = areasConfig.findIndex(a => a.id === camion.area);
  if (indiceArea !== -1) {
    return Math.round(((indiceArea + 1) / areasConfig.length) * 100);
  }

  console.warn("Área desconocida para el camión:", camion.area);
  return 0;
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
  progreso={obtenerProgresoCamion(camion)}
/>

{/*BOTONES DUALES */}
{camion.ruta && camion.ruta[camion.ruta.length - 1] === nombreArea && nombreArea !== "Descanso" && !camion.finalizado && (
  <div className="botones-accion-final">
    <button 
      className="btn-final btn-descanso" 
      onClick={() => mandarADescanso(camion.id)}
    >
      Descanso
    </button>
    <button 
      className="btn-final btn-salida" 
      onClick={() => sacarCamion(camion.id)}
    >
      Salida
    </button>
  </div>
)}

{nombreArea === "Descanso" && (
  <div className="botones-accion-final">
    <button 
      className="btn-final btn-salida" 
      onClick={() => sacarCamion(camion.id)}
    >
      Salida de Terminal
    </button>
  </div>
)}

{/*MODAL DE ADVERTENCIA DE DESVÍO */}
      {movimientoPendiente && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-card" style={{ maxWidth: '450px', textAlign: 'center' }}>
            
            <div style={{ backgroundColor: '#f59e0b', padding: '15px', borderRadius: '8px 8px 0 0' }}>
              <h2 style={{ margin: 0, color: '#1a2235', fontSize: '20px' }}>⚠️ Desvío de Ruta Detectado</h2>
            </div>
            
            <div className="modal-card__body" style={{ padding: '25px 20px' }}>
              <p style={{ fontSize: '16px', color: '#e5e7eb', marginBottom: '25px', lineHeight: '1.5' }}>
                {movimientoPendiente.mensaje}
              </p>
              
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button 
                  className="btn-secondary"
                  onClick={() => setMovimientoPendiente(null)}
                >
                  Cancelar
                </button>
                <button 
                  className="btn-primary" 
                  style={{ backgroundColor: '#f59e0b', color: '#1a2235', fontWeight: 'bold' }}
                  onClick={() => {
                    ejecutarMovimiento(movimientoPendiente.idCamion, movimientoPendiente.nuevaAreaId);
                    setMovimientoPendiente(null); // Cerramos el modal tras confirmar
                  }}
                >
                  Sí, forzar movimiento
                </button>
              </div>
            </div>

          </div>
        </div>
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