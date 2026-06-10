import { useState } from "react";
import "./Resgistro.css";

export default function Registro() {
  const [paso, setPaso] = useState(1);

  const [camion, setCamion] = useState({
    numero: "",
    tipoUnidad: "",
    observaciones: "",
    area: "",
  });

  const registrarCamion = () => {
    alert("Autobús registrado correctamente");

    setCamion({
      numero: "",
      tipoUnidad: "",
      observaciones: "",
      area: "",
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
            <h2 style={{ color: '#5B177F' }}>Nuevo Registro</h2>

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
            <h2 style={{ color: '#5B177F' }}>Datos del Autobús</h2>

            <div className="form-grid">

              <div className="input-group">
                <label>Número de Autobús</label>

                <input
                  type="text"
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
                  <option value="">
                    Seleccione
                  </option>

                  <option value="Foraneo">
                    Foráneo
                  </option>

                  <option value="Local">
                    Local
                  </option>
                </select>
              </div>

              <div className="input-group">
                <label>Observaciones</label>

                <textarea
                  rows="4"
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
            <h2 style={{ color: '#5B177F' }}>Seleccionar Área</h2>

            <div className="area-grid">

              <div
                className={`area-card ${
                  camion.area === "AREA_ESPERA"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setCamion({
                    ...camion,
                    area: "AREA_ESPERA",
                  })
                }
              >
                Área de Espera
              </div>

              <div
                className={`area-card ${
                  camion.area === "DIESEL"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setCamion({
                    ...camion,
                    area: "DIESEL",
                  })
                }
              >
                Diesel
              </div>

              <div
                className={`area-card ${
                  camion.area === "ADBLUE"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setCamion({
                    ...camion,
                    area: "ADBLUE",
                  })
                }
              >
                AdBlue
              </div>

              <div
                className={`area-card ${
                  camion.area === "DESFOGUE"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setCamion({
                    ...camion,
                    area: "DESFOGUE",
                  })
                }
              >
                Desfogue
              </div>

              <div
                className={`area-card ${
                  camion.area === "LAVADO_INTERIOR"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setCamion({
                    ...camion,
                    area: "LAVADO_INTERIOR",
                  })
                }
              >
                Lavado Interior
              </div>

              <div
                className={`area-card ${
                  camion.area === "LAVADO_EXTERIOR"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setCamion({
                    ...camion,
                    area: "LAVADO_EXTERIOR",
                  })
                }
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
                <strong>Número:</strong>{" "}
                {camion.numero}
              </p>

              <p>
                <strong>Tipo:</strong>{" "}
                {camion.tipoUnidad}
              </p>

              <p>
                <strong>Observaciones:</strong>{" "}
                {camion.observaciones}
              </p>

              <p>
                <strong>Área:</strong>{" "}
                {camion.area}
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