import { useState } from "react";
import "./Resgistro.css"; 

export default function Registro({
  agregarCamion,
  agregarHistorial
}) { 
  const [paso, setPaso] = useState(1);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);

  const [camion, setCamion] = useState({
    numero: "",
    tipoUnidad: "",
    observaciones: "",
    area: "",
    conductor: "", 
    origen: "",   
    destino: "", 
    areasRuta: [] 
  });

  const alternarAreaEnRuta = (nombreArea) => {
    let nuevaRuta = [...camion.areasRuta];
    if (nuevaRuta.includes(nombreArea)) {
      nuevaRuta = nuevaRuta.filter(a => a !== nombreArea);
    } else {
      nuevaRuta.push(nombreArea);
    }
    setCamion({
      ...camion,
      areasRuta: nuevaRuta,
      area: nuevaRuta.length > 0 ? nuevaRuta[0] : "" 
    });
  };

  const registrarCamion = () => {
    agregarCamion({ ...camion, id: Date.now().toString(), codigo: camion.numero });
    agregarHistorial({
      id: Date.now(),
      unidad: camion.numero,
      areaFinal: camion.area,
      fecha: new Date().toLocaleDateString('es-MX'),
      hora: new Date().toLocaleTimeString('es-MX'),
      mensaje: `Se registró la unidad ${camion.numero} en el área ${camion.area}`
    });
    setMostrarModalExito(true);
    setCamion({ numero: "", tipoUnidad: "", observaciones: "", area: "", conductor: "", origen: "", destino: "", areasRuta: [] });
    setPaso(1);
  };

  return (
    <div className="registro-page">
      <div className="registro-card">
        <h1 className="registro-title">Registro de Autobús</h1>
        <p className="registro-subtitle">Control de acceso al patio</p>

        <div className="step-indicator">
          {[1,2,3,4].map(s => <div key={s} className={`step ${paso >= s ? "active" : ""}`}>{s}</div>)}
        </div>

        {paso === 1 && (
          <div className="button-group">
            <button className="btn-primary" onClick={() => setPaso(2)}>Registrar Autobús</button>
          </div>
        )}

        {paso === 2 && (
          <>
            <h2 style={{ color: '#ff0000' }}>Datos del Autobús</h2>
            <div className="form-grid">
              <div className="input-group">
                <label>Número de Autobús</label>
                <input type="text" placeholder="Ej: ADO-1001" value={camion.numero} onChange={(e) => setCamion({...camion, numero: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Tipo de Unidad</label>
                <select value={camion.tipoUnidad} onChange={(e) => setCamion({...camion, tipoUnidad: e.target.value})}>
                  <option value="">Seleccione</option>
                  <option value="Foraneo">ADO</option>
                  <option value="Local">OCC</option>
                  <option value="GL">AU</option>
                  <option value="Premium">LUJO</option>
                </select>
              </div>
              <div className="input-group">
                <label>Nombre del Conductor</label>
                <input type="text" placeholder="Nombre completo" value={camion.conductor} onChange={(e) => setCamion({...camion, conductor: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Terminal de Origen</label>
                <input type="text" placeholder="Ej: CDMX TAPO" value={camion.origen} onChange={(e) => setCamion({...camion, origen: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Terminal de Destino</label>
                <input type="text" placeholder="Ej: Oaxaca Centro" value={camion.destino} onChange={(e) => setCamion({...camion, destino: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Observaciones</label>
                <textarea rows="4" placeholder="Detalles de llegada o averías sutiles..." value={camion.observaciones} onChange={(e) => setCamion({...camion, observaciones: e.target.value})} />
              </div>
            </div>
            <div className="button-group">
              <button className="btn-secondary" onClick={() => setPaso(1)}>Atrás</button>
              <button className="btn-primary" onClick={() => setPaso(3)}>Continuar</button>
            </div>
          </>
        )}

        {paso === 3 && (
          <>
            <h2 style={{ color: '#5B177F' }}>Seleccionar las Áreas de Ruta</h2>
            <div className="area-grid">
              {["Desfogue", "Diesel", "Ad-Blue", "Taller", "Lavado Interior", "Lavado Exterior"].map((area) => {
                const index = camion.areasRuta.indexOf(area);
                return (
                  <div key={area} className={`area-card ${index !== -1 ? "selected" : ""}`} onClick={() => alternarAreaEnRuta(area)}>
                    {area}
                    {index !== -1 && <span style={{display: 'block', fontWeight: 'bold', marginTop: '5px'}}>{index + 1}a área</span>}
                  </div>
                );
              })}
            </div>
            <div className="button-group">
              <button className="btn-secondary" onClick={() => setPaso(2)}>Atrás</button>
              <button className="btn-primary" onClick={() => setPaso(4)}>Continuar</button>
            </div>
          </>
        )}

        {paso === 4 && (
          <>
            <h2 style={{ color: '#5B177F' }}>Confirmar Registro</h2>
            <div className="confirm-card">
              <p><strong>Número:</strong> {camion.numero}</p>
              <p><strong>Ruta Planificada:</strong> {camion.areasRuta.length > 0 ? camion.areasRuta.join(" ➔ ") : "Ninguna"}</p>
            </div>
            <div className="button-group">
              <button className="btn-secondary" onClick={() => setPaso(3)}>Atrás</button>
              <button className="btn-success" onClick={registrarCamion}>Confirmar Registro</button>
            </div>
          </>
        )}
      </div>

      {mostrarModalExito && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-card">
            <h2>✅ Registro Exitoso</h2>
            <button className="btn-primary" onClick={() => setMostrarModalExito(false)}>Ok</button>
          </div>
        </div>
      )}
    </div>
  );
}