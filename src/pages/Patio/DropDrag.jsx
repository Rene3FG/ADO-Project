import { useState, useEffect, useCallback } from 'react';
import TarjetaInfo from './TarjetaInfo.jsx';
import './DropDrag.css';
import Registro from '../Registro/Registro.jsx';
import ConfAvanz from '../ConfAvanz/ConfAvaz.jsx';
import { AutobusRepository } from '../../lib/data/repositories/AutobusRepository';
import { AREAS_PATIO } from '../../lib/areasConfig';
import { HistorialPage } from '../../lib/presentation/pages/HistorialPage';
import { ReportesPage } from '../../lib/presentation/pages/ReportesPage';

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
  "Ad-blue": <CiDroplet />,
  "Lavado Exterior": <MdLocalCarWash />,
  "Lavado Interior": <TbWashDryDip />,
  "Taller": <HiMiniWrenchScrewdriver />,
  "Espera": <SiBlockbench />
};

export default function DropDrag() {
  const [pestanaActiva, setPestanaActiva] = useState('patio');
  const [camiones, setCamiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [alertas, setAlertas] = useState([]);
  const areasConfig = AREAS_PATIO;

  const cargarCamiones = useCallback(async () => {
    setCargando(true);
    try {
      const data = await AutobusRepository.obtenerAutobusesActivos();
      setCamiones(data);
    } catch (error) {
      console.error('No se pudieron cargar los autobuses:', error);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarCamiones();
    const intervalo = setInterval(cargarCamiones, 30000); // refresca cada 30 seg
    return () => clearInterval(intervalo);
  }, [cargarCamiones]);

  const crearAlerta = (alertaNueva) => {
  setAlertas((prev) => [...prev, alertaNueva]);

  setTimeout(() => {
    setAlertas((prev) =>
      prev.filter((alerta) => alerta !== alertaNueva)
    );
  }, 5000);
  };

  const [camionSeleccionado, setCamionSeleccionado] = useState(null);

  const alIniciarArrastre = (e, idCamion) => {
    e.dataTransfer.setData('text/plain', String(idCamion));
  };

  const permitirSoltar = (e) => {
    e.preventDefault();
  };

  const alSoltar = async (e, nuevaAreaId) => {
    e.preventDefault();
    const idCamion = e.dataTransfer.getData('text/plain');
    const bus = camiones.find((c) => String(c.busId) === idCamion);
    if (!bus || bus.currentArea === nuevaAreaId) return;

    const infoAreaDestino = areasConfig.find(a => a.id === nuevaAreaId);
    const limiteMaximoArea = infoAreaDestino ? infoAreaDestino.capacidad : 4;
    const camionesEnAreaDestino = camiones.filter(c => c.currentArea === nuevaAreaId).length;

    if (camionesEnAreaDestino >= limiteMaximoArea) {
      alert(`El área de ${nuevaAreaId} ya alcanzó su límite máximo de ${limiteMaximoArea} lugares.`);
      return;
    }

    try {
      await AutobusRepository.moverAutobus(bus, nuevaAreaId);
      await cargarCamiones();
    } catch (error) {
      alert(`No se pudo mover la unidad: ${error.message}`);
    }
  };

   const renderizarContenido = () => {
    switch (pestanaActiva) {
      case 'patio':
        return (
          <div className="drag-board">
            {cargando && camiones.length === 0 ? (
              <div className="pantalla-vacia"><h2>Cargando patio...</h2></div>
            ) : areasConfig.map((areaInfo) => {
              const nombreArea = areaInfo.id;
              const capacidadMaxima = areaInfo.capacidad;
              const camionesActuales = camiones.filter((c) => c.currentArea === nombreArea).length;

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
                      <h3>{areaInfo.nombre}</h3>
                    </div>
                    <span className="zone-counter">
                      Capacidad: {camionesActuales}/{capacidadMaxima}
                    </span>
                  </div>

                  <div className="drag-zone__content">
                    {camiones.filter((camion) => camion.currentArea === nombreArea).length === 0 ? (
                      <div className="no-buses">No hay autobuses</div>
                    ) : (
                      camiones
                        .filter((camion) => camion.currentArea === nombreArea)
                        .map((camion) => (
                          <div
                            key={camion.busId}
                            onDoubleClick={() => setCamionSeleccionado(camion)}
                            title="Doble clic para ver detalles del Registro"
                          >
                           <TarjetaInfo
                          camion={camion}
                          alIniciarArrastre={alIniciarArrastre}
                         crearAlerta={crearAlerta}
                          />
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
        return <Registro onRegistrado={() => { setPestanaActiva('patio'); cargarCamiones(); }} />;
      case 'historial':
        return <HistorialPage />;
      case 'reportes':
        return <ReportesPage />;
      case 'configuracion':
        return <ConfAvanz />;
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
              <h2>Ficha de Registro: {camionSeleccionado.busId}</h2>
              <button className="modal-card__close" onClick={() => setCamionSeleccionado(null)}>&times;</button>
            </div>
            <div className="modal-card__body">
              <div className="modal-data-row"><strong>Serie:</strong> <span>{camionSeleccionado.busId}</span></div>
              <div className="modal-data-row"><strong>Tipo de Autobús:</strong> <span>{camionSeleccionado.busType}</span></div>
              <div className="modal-data-row"><strong>Área Asignada:</strong> <span>{camionSeleccionado.currentArea}</span></div>
              <div className="modal-data-row"><strong>Hora límite de salida:</strong> <span>{camionSeleccionado.departureTime}</span></div>
              <div className="modal-data-row"><strong>Avance:</strong> <span>{camionSeleccionado.progressPercentage}%</span></div>
              {/* Conductor/Origen/Destino no se persisten: no existe ese campo en trips/records todavía */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}