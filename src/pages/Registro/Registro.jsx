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

  // Función auxiliar para obtener el texto del orden (ej. "1a área")
  const obtenerTextoOrden = (nombreArea) => {
    const index = camion.areasRuta.indexOf(nombreArea);
    return index !== -1 ? `${index + 1}a área` : "";
  };

  const registrarCamion = () => {
    const nuevoCamion = {
      id: Date.now().toString(),
      codigo: camion.numero,
      tipo: camion.tipoUnidad,
      area: camion.areasRuta[0] || "", 
      conductor: camion.conductor,
      origen: camion.origen,
      destino: camion.destino,
      ruta: camion.areasRuta 
    };

    agregarCamion(nuevoCamion);
    
    const ahora = new Date();
    agregarHistorial({
      id: Date.now(),
      unidad: camion.numero,
      areaFinal: camion.area,
      fecha: ahora.toLocaleDateString('es-MX'),
      hora: ahora.toLocaleTimeString('es-MX'),
      mensaje: `Se registró la unidad ${camion.numero} en el área ${camion.area}`
    });

    setMostrarModalExito(true);
    setCamion({
      numero: "",
      tipoUnidad: "",
      observaciones: "",
      area: "",
      conductor: "",
      origen: "",
      destino: "",
      areasRuta: []
    });
    setPaso(1);
  };

  return (
    <div className="registro-page">
      <div className="registro-card">
        <h1 className="registro-title">Registro de Autobús</h1>
        <p className="registro-subtitle">Control de acceso al patio</p>

        <div className="step-indicator">
          <div className={`step ${paso >= 1 ? "active" : ""}`}>1</div>
          <div className={`step ${paso >= 2 ? "active" : ""}`}>2</div>
          <div className={`step ${paso >= 3 ? "active" : ""}`}>3</div>
          <div className={`step ${paso >= 4 ? "active" : ""}`}>4</div>
        </div>

        {paso === 1 && (
          <>
            <h2 style={{ color: '#ff0000' }}>Nuevo Registro</h2>
            <div className="button-group">
              <button className="btn-primary" onClick={() => setPaso(2)}>Registrar Autobús</button>
            </div>
          </>
        )}

        {paso === 2 && (
          <>
            <h2 style={{ color: '#ff0000' }}>Datos del Autobús</h2>
            <div className="form-grid">
              {/* Campos de formulario iguales */}
              <div className="input-group">
                <label>Número de Autobús</label>
                <input type="text" value={camion.numero} onChange={(e) => setCamion({...camion, numero: e.target.value})} />
              </div>
              {/* ... (resto de tus inputs) ... */}
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
              {["Desfogue", "Diesel", "Ad-Blue", "Taller", "Lavado Interior", "Lavado Exterior"].map(area => (
                <div
                  key={area}
                  className={`area-card ${camion.areasRuta.includes(area) ? "selected" : ""}`}
                  onClick={() => alternarAreaEnRuta(area)}
                >
                  {area} 
                  {camion.areasRuta.includes(area) && (
                    <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>
                      ({obtenerTextoOrden(area)})
                    </span>
                  )}
                </div>
              ))}
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
              <p><strong>Ruta Planificada:</strong> {camion.areasRuta.length > 0 ? camion.areasRuta.map((a, i) => `${i + 1}a(${a})`).join(" ➔ ") : "Ninguna"}</p>
            </div>
            <div className="button-group">
              <button className="btn-secondary" onClick={() => setPaso(3)}>Atrás</button>
              <button className="btn-success" onClick={registrarCamion}>Confirmar Registro</button>
            </div>
          </>
        )}
      </div>

      {mostrarModalExito && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>✅ Registro Exitoso</h2>
            <p>La unidad <strong>{camion.numero}</strong> ha sido registrada.</p>
            <button onClick={() => setMostrarModalExito(false)}>Ok</button>
          </div>
        </div>
      )}
    </div>
  );
}