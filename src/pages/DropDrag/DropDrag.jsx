import { useState } from 'react';
import TarjetaInfo from './tarjetaInfo.jsx';
import mockDB from './CamionArea.json'; // Tu JSON externo
import './DropDrag.css';

// Todos tus iconos importados
import { MdDashboard, MdAssignmentTurnedIn, MdSwapHoriz, MdHistory, MdBarChart, MdSettings, MdExitToApp } from "react-icons/md";
import { TbWash, TbWashDryDip } from "react-icons/tb";
import { BsFillFuelPumpDieselFill } from "react-icons/bs";
import { CiDroplet } from "react-icons/ci";
import { MdLocalCarWash } from "react-icons/md";
import { HiMiniWrenchScrewdriver } from "react-icons/hi2";
import { SiBlockbench } from "react-icons/si";

// Diccionario de iconos para tus columnas
const areaIcons = {
  "Desfogue": <TbWash />,
  "Diesel": <BsFillFuelPumpDieselFill />,
  "Ad-Blue": <CiDroplet />,
  "Lavado Exterior": <MdLocalCarWash />,
  "Lavado Interior": <TbWashDryDip />,
  "Taller": <HiMiniWrenchScrewdriver />,
  "Descanso": <SiBlockbench />
};

export default function ContenedorPrincipal() {
  const [pestanaActiva, setPestanaActiva] = useState('patio');
  
  // Estado dinámico para los camiones y configuración de áreas
  const [camiones, setCamiones] = useState(mockDB.camiones);
  const areasConfig = mockDB.areas;

  const alIniciarArrastre = (e, idCamion) => {
    e.dataTransfer.setData('text/plain', idCamion);
  };

  const permitirSoltar = (e) => {
    e.preventDefault();
  };

  const alSoltar = (e, nuevaArea) => {
    e.preventDefault();
    const idCamion = e.dataTransfer.getData('text/plain');

    const infoAreaDestino = areasConfig.find(a => a.id === nuevaArea);
    const limiteMaximoArea = infoAreaDestino ? infoAreaDestino.capacidad : 4;

    const camionesEnAreaDestino = camiones.filter(
      camion => camion.area === nuevaArea
    ).length;

    if (camionesEnAreaDestino >= limiteMaximoArea) {
      alert(`⚠️ El área de ${nuevaArea} ya alcanzó su límite máximo de ${limiteMaximoArea} lugares.`);
      return;
    }

    const camionesActualizados = camiones.map((camion) => {
      if (camion.id === idCamion) {
        return { ...camion, area: nuevaArea };
      }
      return camion;
    });

    setCamiones(camionesActualizados);
  };

  // Función que controla el cambio de vistas
  const renderizarContenido = () => {
    switch (pestanaActiva) {
      case 'patio':
        return (
          /* Aquí sustituimos el texto de relleno por tu tablero real de arrastre */
          <div className="tablero">
            {areasConfig.map((areaInfo) => {
              const area = areaInfo.id;
              const limiteMaximoArea = areaInfo.capacidad;
              const camionesActuales = camiones.filter(c => c.area === area).length;
              const lugaresDisponibles = limiteMaximoArea - camionesActuales;

              return (
                <div
                  key={area}
                  className={`columna-area ${lugaresDisponibles === 0 ? 'columna-llena' : ''}`}
                  onDragOver={permitirSoltar}
                  onDrop={(e) => alSoltar(e, area)}
                >
                  <div className="area-header">
                    <div className="area-title">
                      <span className="area-icon">{areaIcons[area]}</span>
                      <h3>{area}</h3>
                    </div>
                    <span className="area-capacidad">
                      Capacidad: {camionesActuales}/{limiteMaximoArea}
                    </span>
                  </div>

                  <div className="lista-camiones">
                    {camiones
                      .filter((camion) => camion.area === area)
                      .map((camion) => (
                        <TarjetaInfo
                          key={camion.id}
                          camion={camion}
                          alIniciarArrastre={alIniciarArrastre}
                        />
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      case 'registrar':
        return <div className="pantalla-vacia"><h2>Pantalla Registrar Camión</h2></div>;
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
    <div className="layout-sistema">
      {/* MENÚ LATERAL */}
      <aside className="sidebar-izquierdo">
        <div className="logo-empresa">
          <span style={{ color: '#C93B3B', fontWeight: 'bold', fontSize: '24px' }}>ADO</span>
        </div>

        <nav className="menu-navegacion">
          <button 
            className={`boton-pestana ${pestanaActiva === 'patio' ? 'activa' : ''}`}
            onClick={() => setPestanaActiva('patio')}
          >
            <MdDashboard className="icono-menu" />
            <span>Patio en tiempo real</span>
          </button>

          <button 
            className={`boton-pestana ${pestanaActiva === 'registrar' ? 'activa' : ''}`}
            onClick={() => setPestanaActiva('registrar')}
          >
            <MdAssignmentTurnedIn className="icono-menu" />
            <span>Registrar camión</span>
          </button>

          <button 
            className={`boton-pestana ${pestanaActiva === 'movimientos' ? 'activa' : ''}`}
            onClick={() => setPestanaActiva('movimientos')}
          >
            <MdSwapHoriz className="icono-menu" />
            <span>Movimientos</span>
          </button>

          <button 
            className={`boton-pestana ${pestanaActiva === 'historial' ? 'activa' : ''}`}
            onClick={() => setPestanaActiva('historial')}
          >
            <MdHistory className="icono-menu" />
            <span>Historial</span>
          </button>

          <button 
            className={`boton-pestana ${pestanaActiva === 'reportes' ? 'activa' : ''}`}
            onClick={() => setPestanaActiva('reportes')}
          >
            <MdBarChart className="icono-menu" />
            <span>Reportes</span>
          </button>

          <button 
            className={`boton-pestana ${pestanaActiva === 'configuracion' ? 'activa' : ''}`}
            onClick={() => setPestanaActiva('configuracion')}
          >
            <MdSettings className="icono-menu" />
            <span>Configuración</span>
          </button>
        </nav>

        <div className="footer-sidebar">
          <button className="boton-pestana cerrar-sesion" onClick={() => alert('Cerrando sesión...')}>
            <MdExitToApp className="icono-menu" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL DINÁMICO */}
      <main className="contenido-derecho">
        <header className="header-patio-superior">
          <span>Control de Patio - Oaxaca</span>
        </header>
        
        <div className="area-de-trabajo">
          {renderizarContenido()}
        </div>
      </main>
    </div>
  );
}