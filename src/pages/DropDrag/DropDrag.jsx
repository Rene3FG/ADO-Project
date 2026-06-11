import { useState } from 'react';
import TarjetaInfo from './tarjetaInfo.jsx';
import mockDB from './CamionArea.json'; // 1. Importamos el archivo JSON de tu compañera
import './DropDrag.css';

import { TbWash } from "react-icons/tb";
import { BsFillFuelPumpDieselFill } from "react-icons/bs";
import { CiDroplet } from "react-icons/ci";
import { MdLocalCarWash } from "react-icons/md";
import { TbWashDryDip } from "react-icons/tb";
import { HiMiniWrenchScrewdriver } from "react-icons/hi2";
import { SiBlockbench } from "react-icons/si";

// 2. Se eliminan las constantes estáticas locales (camionesIniciales, AREAS, LIMITE_MAXIMO)
// porque ahora toda esa información se lee directamente desde mockDB de forma dinámica.

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
  // 3. El estado inicial ahora se carga con los camiones del JSON
  const [camiones, setCamiones] = useState(mockDB.camiones);
  const areasConfig = mockDB.areas; // Guardamos el array de áreas configuradas en el JSON

  const alIniciarArrastre = (e, idCamion) => {
    e.dataTransfer.setData('text/plain', idCamion);
  };

  const permitirSoltar = (e) => {
    e.preventDefault();
  };

  const alSoltar = (e, nuevaArea) => {
    e.preventDefault();

    const idCamion = e.dataTransfer.getData('text/plain');

    // 4. Buscamos dinámicamente el límite de capacidad de la configuración del JSON
    const infoAreaDestino = areasConfig.find(a => a.id === nuevaArea);
    const limiteMaximoArea = infoAreaDestino ? infoAreaDestino.capacidad : 4;

    const camionesEnAreaDestino = camiones.filter(
      camion => camion.area === nuevaArea
    ).length;

    // 5. Validamos usando el límite dinámico del JSON en lugar de la constante fija
    if (camionesEnAreaDestino >= limiteMaximoArea) {
      alert(
        `⚠️ El área de ${nuevaArea} ya alcanzó su límite máximo de ${limiteMaximoArea} lugares.`
      );
      return;
    }

    const camionesActualizados = camiones.map((camion) => {
      if (camion.id === idCamion) {
        return {
          ...camion,
          area: nuevaArea
        };
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
        {/* 6. Mapeamos usando las áreas que vienen declaradas en el JSON */}
        {areasConfig.map((areaInfo) => {
          const area = areaInfo.id;               // El nombre del área (Ej: 'Desfogue')
          const limiteMaximoArea = areaInfo.capacidad; // Su límite de capacidad respectivo

          const camionesActuales = camiones.filter(
            (camion) => camion.area === area
          ).length;

          // 7. Calculamos la disponibilidad usando el límite dinámico del JSON
          const lugaresDisponibles = limiteMaximoArea - camionesActuales;

          return (
            <div
              key={area}
              className={`columna-area ${
                lugaresDisponibles === 0 ? 'columna-llena' : ''
              }`}
              onDragOver={permitirSoltar}
              onDrop={(e) => alSoltar(e, area)}
            >
              <div className="area-header">
                <div className="area-title">
                  <span className="area-icon">
                    {areaIcons[area]}
                  </span>

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
    </div>
  );
}