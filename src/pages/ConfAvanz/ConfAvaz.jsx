import { useState } from "react";
import { MdAddLocation, MdPersonAdd, MdDirectionsBus } from "react-icons/md";
import "./ConfAvanz.css";

export default function ConfAvanz() {  
  return (
    <div className="config-panel">
      <h2>Configuración del Sistema</h2>
      <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '14px' }}>
        Selecciona una tarea administrativa para el control del patio.
      </p>
      
      <div className="config-grid">
        <div className="config-option-card" onClick={() => alert('Abriendo formulario: Agregar área')}>
          <div className="config-option-icon"><MdAddLocation /></div>
          <div className="config-option-text">
            <h3>Agregar área</h3>
            <p>Crea una nueva zona de trabajo en el patio y define su capacidad máxima.</p>
          </div>
        </div>

        <div className="config-option-card" onClick={() => alert('Abriendo formulario: Agregar usuario')}>
          <div className="config-option-icon"><MdPersonAdd /></div>
          <div className="config-option-text">
            <h3>Agregar usuario</h3>
            <p>Registra nuevos operadores, mecánicos o supervisores de patio.</p>
          </div>
        </div>

        <div className="config-option-card" onClick={() => alert('Abriendo panel: Mover camiones')}>
          <div className="config-option-icon"><MdDirectionsBus /></div>
          <div className="config-option-text">
            <h3>Mover camiones</h3>
            <p>Reubicación masiva de autobuses o reajustes manuales de flujo.</p>
          </div>
        </div>
      </div>
    </div>
  );
}