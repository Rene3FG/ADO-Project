import { useState } from "react";
import "./Resgistro.css"; 

export default function Registro() {
  const [paso, setPaso] = useState(1);

  const [camion, setCamion] = useState({
    numero: "",
    tipoUnidad: "",
    observaciones: "",
    area: "",
    conductor: "", 
    origen: "",   
    destino: "", 
  });

  const registrarCamion = () => {
    alert("Autobús registrado correctamente");

    setCamion({
      numero: "",
      tipoUnidad: "",
      observaciones: "",
      area: "",
      conductor: "",
      origen: "",
      destino: "",
    });

    setPaso(1);
  };

  return (
    <div className="registro-page">
      <div className="registro-card">

        <h1 className="registro-title">
          Registro de Autobús
        </h1>

        <p className="registro-subtitle">
          Control de acceso al patio
        </p>

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
              <button
                className="btn-primary"
                onClick={() => setPaso(2)}
              >
                Registrar Autobús
              </button>
            </div>
          </>
        )}

        {paso === 2 && (
          <>
            <h2 style={{ color: '#ff0000' }}>Datos del Autobús</h2>

            <div className="form-grid">

              <div className="input-group">
                <label>Número de Autobús</label>
                <input
                  type="text"
                  placeholder="Ej: ADO-1001"
                  value={camion.numero}
                  onChange={(e) =>
                    setCamion({
                      ...camion,
                      numero: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-group">
                <label>Tipo de Unidad</label>
                <select
                  value={camion.tipoUnidad}
                  onChange={(e) =>
                    setCamion({
                      ...camion,
                      tipoUnidad: e.target.value,
                    })
                  }
                >
                  <option value="">Seleccione</option>
                  <option value="Foraneo">ADO</option>
                  <option value="Local">OCC</option>
                  <option value="GL">AU</option>
                  <option value="Premium">LUJO</option>
                  <option value="Premium">SUR</option>
                  <option value="Premium">TXO</option>
                </select>
              </div>

              <div className="input-group">
                <label>Nombre del Conductor</label>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={camion.conductor}
                  onChange={(e) =>
                    setCamion({
                      ...camion,
                      conductor: e.target.value,
                    })
                  }
                />
              </div>

              {/* --- NUEVO CAMPO: ORIGEN --- */}
              <div className="input-group">
                <label>Terminal de Origen</label>
                <input
                  type="text"
                  placeholder="Ej: CDMX TAPO"
                  value={camion.origen}
                  onChange={(e) =>
                    setCamion({
                      ...camion,
                      origen: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-group">
                <label>Terminal de Destino</label>
                <input
                  type="text"
                  placeholder="Ej: Oaxaca Centro"
                  value={camion.destino}
                  onChange={(e) =>
                    setCamion({
                      ...camion,
                      destino: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-group">
                <label>Observaciones</label>
                <textarea
                  rows="4"
                  placeholder="Detalles de llegada o averías sutiles..."
                  value={camion.observaciones}
                  onChange={(e) =>
                    setCamion({
                      ...camion,
                      observaciones: e.target.value,
                    })
                  }
                />
              </div>                  

            </div>

            <div className="button-group">
              <button
                className="btn-secondary"
                onClick={() => setPaso(1)}
              >
                Atrás
              </button>

              <button
                className="btn-primary"
                onClick={() => setPaso(3)}
              >
                Continuar
              </button>
            </div>
          </>
        )}

        {paso === 3 && (
          <>
            <h2 style={{ color: '#5B177F' }}>Seleccionar Área Inicial</h2>

            <div className="area-grid">
              <div
                className={`area-card ${camion.area === "Desfogue" ? "selected" : ""}`}
                onClick={() => setCamion({ ...camion, area: "Desfogue" })}
              >
                Desfogue
              </div>

              <div
                className={`area-card ${camion.area === "Diesel" ? "selected" : ""}`}
                onClick={() => setCamion({ ...camion, area: "Diesel" })}
              >
                Diesel
              </div>

              <div
                className={`area-card ${camion.area === "Ad-Blue" ? "selected" : ""}`}
                onClick={() => setCamion({ ...camion, area: "Ad-Blue" })}
              >
                AdBlue
              </div>

              <div
                className={`area-card ${camion.area === "Taller" ? "selected" : ""}`}
                onClick={() => setCamion({ ...camion, area: "Taller" })}
              >
                Taller
              </div>

              <div
                className={`area-card ${camion.area === "Lavado Interior" ? "selected" : ""}`}
                onClick={() => setCamion({ ...camion, area: "Lavado Interior" })}
              >
                Lavado Interior
              </div>

              <div
                className={`area-card ${camion.area === "Lavado Exterior" ? "selected" : ""}`}
                onClick={() => setCamion({ ...camion, area: "Lavado Exterior" })}
              >
                Lavado Exterior
              </div>
            </div>

            <div className="button-group">
              <button
                className="btn-secondary"
                onClick={() => setPaso(2)}
              >
                Atrás
              </button>

              <button
                className="btn-primary"
                onClick={() => setPaso(4)}
              >
                Continuar
              </button>
            </div>
          </>
        )}

        {paso === 4 && (
          <>
            <h2 style={{ color: '#5B177F' }}>Confirmar Registro</h2>

            <div className="confirm-card">
              <p>
                <strong>Número:</strong> {camion.numero || "No especificado"}
              </p>
              <p>
                <strong>Tipo:</strong> {camion.tipoUnidad || "No seleccionado"}
              </p>
              <p>
                <strong>Conductor:</strong> {camion.conductor || "No asignado"}
              </p>
              <p>
                <strong>Ruta:</strong> {camion.origen || "N/A"} &rarr; {camion.destino || "N/A"}
              </p>
              <p>
                <strong>Área Inicial Asignada:</strong> {camion.area || "Ninguna"}
              </p>
              <p>
                <strong>Observaciones:</strong> {camion.observaciones || "Sin observaciones"}
              </p>
            </div>

            <div className="button-group">
              <button
                className="btn-secondary"
                onClick={() => setPaso(3)}
              >
                Atrás
              </button>

              <button
                className="btn-success"
                onClick={registrarCamion}
              >
                Confirmar Registro
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}