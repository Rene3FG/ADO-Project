// const camionesIniciales = [
//   { id: '1', codigo: 'ADO-001', tipo: 'Ejecutivo', area: 'Desfogue' },
//   { id: '2', codigo: 'ADO-002', tipo: 'Primera Clase', area: 'Taller' },
//   { id: '3', codigo: 'ADO-003', tipo: 'GL', area: 'Ad-Blue' },
//   { id: '4', codigo: 'ADO-004', tipo: 'Platino', area: 'Taller' },
//   { id: '5', codigo: 'ADO-005', tipo: 'Platino', area: 'Taller' },

// ];

// const AREAS = ['Desfogue', 'Diesel', 'Ad-Blue', 'Taller', 'Lavado Interior', 'Lavado Exterior', 'Lavado Interior', 'Descanso'];
// const LIMITE_MAXIMO = 4; // El límite de espacios por área

import { useState } from 'react';
import TarjetaInfo from './TarjetaInfo.jsx';
import './DropDrag.css';

import mockDB from './CamionArea.json';

export default function DropDrag() {
  const [camiones, setCamiones] = useState(mockDB.camiones); 
  const areasConfig = mockDB.areas; // Corrección: Bien escrito "areasConfig"

  const alIniciarArrastre = (e, idCamion) => {
    e.dataTransfer.setData('text/plain', idCamion);
  };

  const permitirSoltar = (e) => {
    e.preventDefault();
  };

  const alSoltar = (e, nuevaAreaId) => {
    e.preventDefault();
    const idCamion = e.dataTransfer.getData('text/plain');

    //Buscamos la capacidad máxima en nuestra configuración de áreas
    const infoAreaDestino = areasConfig.find(a => a.id === nuevaAreaId);
    const limiteMaximoArea = infoAreaDestino ? infoAreaDestino.capacidad : 4;

    //Se valida cuántos camiones hay ya en el área de destino
    const camionesEnAreaDestino = camiones.filter(c => c.area === nuevaAreaId).length;

    //Si ya está llena, bloqueamos el movimiento usando la capacidad del JSON
    if (camionesEnAreaDestino >= limiteMaximoArea) {
      alert(`El área de ${nuevaAreaId} ya alcanzó su límite máximo de ${limiteMaximoArea} lugares.`);
      return;
    }

    //Si hay espacio, actualizamos el área del camión
    const camionesActualizados = camiones.map((camion) => {
      if (camion.id === idCamion) {
        return { ...camion, area: nuevaAreaId };
      }
      return { ...camion };
    });

    setCamiones(camionesActualizados);
  };

  return (
    <div className="contenedor-patio">
      <header className="header-patio">
        <h1>Monitoreo de Flujos - Patio ADO</h1>
      </header>

      <div className="tablero">
        {}
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
                <h3>{nombreArea}</h3>
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