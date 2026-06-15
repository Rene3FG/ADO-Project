import { useState } from 'react';
import TarjetaInfo from './TarjetaInfo.jsx';
import mockDB from './CamionArea.json';
import './DropDrag.css';

// Asegúrate de que esta importación sea correcta según tu proyecto
import Registro from '../Registro/Registro.jsx'; 

import { MdDashboard, MdAssignmentTurnedIn, MdSwapHoriz, MdHistory, MdBarChart, MdSettings, MdExitToApp } from "react-icons/md";
import { TbWash, TbWashDryDip } from "react-icons/tb";
import { BsFillFuelPumpDieselFill } from "react-icons/bs";
import { CiDroplet } from "react-icons/ci";
import { MdLocalCarWash } from "react-icons/md";
import { HiMiniWrenchScrewdriver } from "react-icons/hi2";
import { SiBlockbench } from "react-icons/si";

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
  const areasConfig = mockDB.areas; //las áreas no cambian
  const [camiones, setCamiones] = useState(mockDB.camiones);
  const areasConfig = mockDB.areas;

  const alIniciarArrastre = (e, idCamion) => {
    e.dataTransfer.setData('text/plain', idCamion);
  };

  const permitirSoltar = (e) => {
    e.preventDefault();
  };

  const alSoltar = (e, nuevaAreaId) => {
    e.preventDefault();
    const idCamion = e.dataTransfer.getData('text/plain');

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
                          <TarjetaInfo 
                            key={camion.id} 
                            camion={camion} 
                            alIniciarArrastre={alIniciarArrastre}
                          />
                        ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      case 'registrar':
        return <Registro />;
      case 'movimientos':
        return <div className="pantalla-vacia"><h2>Pantalla de Movimientos</h2></div>;
      case 'historial':
        return <div className="pantalla-vacia"><h2>Pantalla de Historial</h2></div>;
      case 'reportes':
        return <div className="pantalla-vacia"><h2>Pantalla de Reportes</h2></div>;
      case 'configuracion':
        return <div className="pantalla-vacia"><h2>Pantalla de Configuración</h2></div>;
      default:
        return <div className="pantalla-vacia"><h2>Selecciona una opción</h2></div>;
    }
  };

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar__logo">
          <span style={{ color: '#e21c24', fontWeight: 'bold', fontSize: '24px', letterSpacing: '1px' }}>ADO</span>
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
            {/* Cambiar el color de la paleta */}
            <span>Registrar camión</span>
          </button>
          <button 
            className={`sidebar__item ${pestanaActiva === 'movimientos' ? 'sidebar__item--active' : ''}`}
            onClick={() => setPestanaActiva('movimientos')}
          >
            <MdSwapHoriz className="sidebar__icon" />
            <span>Movimientos</span>
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

          <button
            className={`sidebar__item ${pestanaActiva === 'Alarmas' ? 'sidebar__item--active' : ''}`}
            onClick={() => setPestanaActiva('configuracion')}
          >
            <MdSettings className="sidebar__icon" />
            {/* Cambiar el ícono */}
            <span>Crear Alarmas</span> 
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
        
        {renderizarContenido()}
      </main>
    </div>
  );
}