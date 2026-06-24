import { useState } from 'react';
import TarjetaInfo from './TarjetaInfo.jsx';
import mockDB from './CamionArea.json';
import './DropDrag.css';
import Registro from '../Registro/Registro.jsx';
import ConfAvaz from '../ConfAvanz/ConfAvaz.jsx';

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
  const [camiones, setCamiones] = useState(mockDB.camiones); //SetCamiones es el gatillo 
  const agregarCamion = (nuevoCamion) => {
  setCamiones((prev) => [...prev, nuevoCamion]);
 };
  const [alertas, setAlertas] = useState([]);
  const [areasConfig, setAreasConfig] = useState(mockDB.areas); //Las áreas si van a cambiar
  const [historial, setHistorial] = useState([]);

  const crearAlerta = (alertaNueva) => {
  setAlertas((prev) => [...prev, alertaNueva]);

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

  const registroSalida = {
    id: Date.now(),
    unidad: camion.codigo,
    areaFinal: camion.area,
    fecha: ahora.toLocaleDateString('es-MX'),
    hora: ahora.toLocaleTimeString('es-MX'),
    mensaje: `La unidad ${camion.codigo} salió de la terminal ADO`
  };

  setHistorial(prev => [registroSalida, ...prev]);

  setCamiones(prev =>
    prev.filter(c => c.id !== idCamion)
  );
  };

  const [camionSeleccionado, setCamionSeleccionado] = useState(null);

  const alIniciarArrastre = (e, idCamion) => {
    e.dataTransfer.setData('text/plain', idCamion);
  };

  const permitirSoltar = (e) => {
    e.preventDefault();
  };

 const alSoltar = (e, nuevaAreaId) => { //Aqui se implementa la validacion para OPERADOR
    e.preventDefault();
    const idCamion = e.dataTransfer.getData('text/plain');

    const camionQueSeMueve = camiones.find(c => c.id === idCamion);
    if (!camionQueSeMueve) return;
    
    const areaActual = camionQueSeMueve.area;

    if (areaActual === nuevaAreaId) return;

    const reglasFlujo = {
      "Desfogue": ["Diesel", "Ad-Blue","Descanso"], // De desfogue solo pueden ir a lavar o al taller
      "Diesel": ["Ad-Blue","Descanso"],
      "Ad-Blue": ["Lavado Interior","Lavado Exterior","Taller","Descanso"],
      "Lavado Exterior": ["Lavado Interior","Taller","Descanso"], // Tienen que pasar por interior obligatoriamente
      "Lavado Interior": ["Lavado Exterior", "Taller","Descanso"],
      "Taller": ["Lavado Exterior", "Lavado Interior","Descanso"],
      "Descanso": ["Desfogue"] // Vuelven a empezar un nuevo viaje
    };

    const movimientosPermitidos = reglasFlujo[areaActual] || [];

    if (!movimientosPermitidos.includes(nuevaAreaId)) {
      alert(`Movimiento no autorizado.\nUn autobús en "${areaActual}" solo puede avanzar a: ${movimientosPermitidos.join(" o ")}.`);
      return;
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

    setCamiones(camionesActualizados);
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
                   />

                  {nombreArea === "Descanso" && (
                    <button
                   className="btn-salida"
                    onClick={() => sacarCamion(camion.id)}
                   >
                 Dar salida
                </button>
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
       return <Registro agregarCamion={agregarCamion} />;
     case 'historial':
      return (
       <div className="pantalla-vacia">
      <h2>Historial de Salidas</h2>

      {historial.length === 0 ? (
        <p>No hay registros de salida.</p>
      ) : (
        historial.map((registro, index) => (
          <div key={index}>
            <p>{registro.mensaje}</p>
            <small>
              {registro.fecha} - {registro.hora}
            </small>
          </div>
        ))
      )}
    </div>
    );
      case 'reportes':
        return <div className="pantalla-vacia"><h2>Pantalla de Reportes</h2></div>;
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