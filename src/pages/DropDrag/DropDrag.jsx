import { useState } from 'react';
import TarjetaInfo from './TarjetaInfo.jsx';
import './DropDrag.css';

const camionesIniciales = [
  { id: '1', codigo: 'ADO-001', tipo: 'Ejecutivo', area: 'Desfogue' },
  { id: '2', codigo: 'ADO-002', tipo: 'Primera Clase', area: 'Taller' },
  { id: '3', codigo: 'ADO-003', tipo: 'GL', area: 'Ad-Blue' },
  { id: '4', codigo: 'ADO-004', tipo: 'Platino', area: 'Taller' },
  { id: '5', codigo: 'ADO-005', tipo: 'Platino', area: 'Taller' },

];

const AREAS = ['Desfogue', 'Diesel', 'Ad-Blue', 'Taller', 'Lavado Interior', 'Lavado Exterior', 'Lavado Interior', 'Descanso'];
const LIMITE_MAXIMO = 4; // El límite de espacios por área

export default function DropDrag() {
  const [camiones, setCamiones] = useState(camionesIniciales);

  const alIniciarArrastre = (e, idCamion) => {
    e.dataTransfer.setData('text/plain', idCamion);
  };

  const permitirSoltar = (e) => {
    e.preventDefault();
  };

  const alSoltar = (e, nuevaArea) => {
    e.preventDefault();
    const idCamion = e.dataTransfer.getData('text/plain');

    // 1. Validar cuántos camiones hay ya en el área de destino
    const camionesEnAreaDestino = camiones.filter(c => c.area === nuevaArea).length;

    // 2. Si ya está llena (alcanzó los 4 espacios), bloqueamos el movimiento
    if (camionesEnAreaDestino >= LIMITE_MAXIMO) {
      alert(`⚠️ El área de ${nuevaArea} ya alcanzó su límite máximo de ${LIMITE_MAXIMO} lugares.`);
      return;
    }

    // 3. Si hay espacio, actualizamos el área del camión
    const camionesActualizados = camiones.map((camion) => {
      if (camion.id === idCamion) {
        return { ...camion, area: nuevaArea };
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
        {AREAS.map((area) => {
          // --- CÁLCULO DE LUGARES EN TIEMPO REAL ---
          const camionesActuales = camiones.filter((c) => c.area === area).length;
          const lugaresDisponibles = LIMITE_MAXIMO - camionesActuales;

          return (
            <div
              key={area}
              className={`columna-area ${lugaresDisponibles === 0 ? 'columna-llena' : ''}`}
              onDragOver={permitirSoltar}
              onDrop={(e) => alSoltar(e, area)}
            >
              <div className="encabezado-columna">
                <h3>{area}</h3>
                {/* Contador visual de espacios */}
                <span className={`contador-lugares ${lugaresDisponibles <= 1 ? 'alerta-espacio' : ''}`}>
                  {lugaresDisponibles} / {LIMITE_MAXIMO} lugares libres
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