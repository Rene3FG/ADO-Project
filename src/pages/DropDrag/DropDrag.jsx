import { useState } from 'react';
import TarjetaInfo from './tarjetaInfo.jsx';
import './DropDrag.css';

// Iconos importados de la versión HEAD
import { TbWash } from "react-icons/tb";
import { BsFillFuelPumpDieselFill } from "react-icons/bs";
import { CiDroplet } from "react-icons/ci";
import { MdLocalCarWash } from "react-icons/md";
import { TbWashDryDip } from "react-icons/tb";
import { HiMiniWrenchScrewdriver } from "react-icons/hi2";
import { SiBlockbench } from "react-icons/si";

// Base de datos simulada (Versión remota/incoming)
import mockDB from './CamionArea.json';

// Diccionario de iconos asignados por nombre de área
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

    // Buscamos la capacidad máxima en nuestra configuración de áreas (JSON)
    const infoAreaDestino = areasConfig.find(a => a.id === nuevaAreaId);
    const limiteMaximoArea = infoAreaDestino ? infoAreaDestino.capacidad : 4;

    // Se valida cuántos camiones hay ya en el área de destino
    const camionesEnAreaDestino = camiones.filter(c => c.area === nuevaAreaId).length;

    // Si ya está llena, bloqueamos el movimiento
    if (camionesEnAreaDestino >= limiteMaximoArea) {
      alert(`⚠️ El área de ${nuevaAreaId} ya alcanzó su límite máximo de ${limiteMaximoArea} lugares.`);
      return;
    }

    // Si hay espacio, actualizamos el área del camión
    const camionesActualizados = camiones.map((camion) => {
      if (camion.id === idCamion) {
        return { ...camion, area: nuevaAreaId };
      }
      return camion;
    });

    setCamiones(camionesActualizados);
  };

  return (
    <div className="contenedor-patio">
      <header className="header-patio">
        <h1>Monitoreo de Flujos - Patio ADO</h1>
      </header>

      <div className="tablero">
        {areasConfig.map((areaInfo) => {
          const nombreArea = areaInfo.id;
          const capacidadMaxima = areaInfo.capacidad;

          // --- CÁLCULO DE LUGARES EN TIEMPO REAL ---
          const camionesActuales = camiones.filter((c) => c.area === nombreArea).length;
          const lugaresDisponibles = capacidadMaxima - camionesActuales;

          return (
            <div
              key={nombreArea}
              className={`columna-area ${lugaresDisponibles === 0 ? 'columna-llena' : ''}`}
              onDragOver={permitirSoltar}
              onDrop={(e) => alSoltar(e, nombreArea)}
            >
              <div className="encabezado-columna">
                <div className="area-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Aquí renderizamos el icono correspondiente si existe */}
                  <span className="area-icon">
                    {areaIcons[nombreArea]}
                  </span>
                  <h3>{nombreArea}</h3>
                </div>
                
                {/* Contador visual usando la capacidad del JSON */}
                <span className={`contador-lugares ${lugaresDisponibles <= 1 ? 'alerta-espacio' : ''}`}>
                  {lugaresDisponibles} / {capacidadMaxima} lugares libres
                </span>
              </div>

              <div className="lista-camiones">
                {camiones
                  .filter((camion) => camion.area === nombreArea)
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
    </div>
  );
}