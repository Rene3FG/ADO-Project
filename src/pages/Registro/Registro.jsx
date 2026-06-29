import { useState } from "react";
import camionesService from "../../services/camionesService.js";
import historialService from "../../services/historialService.js";
import "./Resgistro.css";

export default function Registro({
  agregarCamion,
  agregarHistorial
}) {
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [camion, setCamion] = useState({
    numero: "",
    tipoUnidad: "",
    observaciones: "",
    area: "",
    conductor: "",
    origen: "",
    destino: "",
    areasRuta: [] // Lista de las áreas seleccionadas
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

  const registrarCamion = async () => {
    setError("");
    setLoading(true);

    try {
      // Validación básica
      if (!camion.numero.trim()) {
        setError("El número de autobús es requerido");
        setLoading(false);
        return;
      }

      if (!camion.conductor.trim()) {
        setError("El conductor es requerido");
        setLoading(false);
        return;
      }

      const nuevoCamion = {
        codigo: camion.numero,
        tipo: camion.tipoUnidad,
        area: camion.areasRuta[0] || "",
        conductor: camion.conductor,
        origen: camion.origen,
        destino: camion.destino,
        ruta: camion.areasRuta,
        observaciones: camion.observaciones
      };

      // Crear camión en la API
      const respuestaAPI = await camionesService.createCamion(nuevoCamion);
      console.log("Camión creado en API:", respuestaAPI);

      // Agregar a estado local también (para UI que lo requiera)
      const camionConId = {
        id: respuestaAPI.id || Date.now().toString(),
        ...nuevoCamion
      };

      agregarCamion(camionConId);

      // Registrar en historial
      const ahora = new Date();
      const registroHistorial = {
        unidad: camion.numero,
        areaFinal: camion.area,
        fecha: ahora.toLocaleDateString('es-MX'),
        hora: ahora.toLocaleTimeString('es-MX'),
        mensaje: `Se registró la unidad ${camion.numero} en el área ${camion.area}`
      };

      await historialService.logRegistro(registroHistorial);
      agregarHistorial(registroHistorial);

      alert("Autobús registrado correctamente");

      // Limpiar formulario
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
    } catch (err) {
      console.error("Error registrando camión:", err);
      setError(err.message || "Error al registrar el autobús. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
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

        {error && <div className="error-message" style={{ color: '#ef4444', marginBottom: '15px', padding: '10px', borderRadius: '4px', backgroundColor: '#fee2e2' }}>{error}</div>}

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
                disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>

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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>

            </div>

            <div className="button-group">
              <button
                className="btn-secondary"
                onClick={() => setPaso(1)}
                disabled={loading}
              >
                Atrás
              </button>

              <button
                className="btn-primary"
                onClick={() => setPaso(3)}
                disabled={loading}
              >
                Continuar
              </button>
            </div>
          </>
        )}

        {paso === 3 && (
          <>
            <h2 style={{ color: '#5B177F' }}>Seleccionar las Áreas de Ruta</h2>

            <div className="area-grid">
              <div
                className={`area-card ${camion.areasRuta.includes("Desfogue") ? "selected" : ""}`}
                onClick={() => alternarAreaEnRuta("Desfogue")}
              >
                Desfogue {camion.areasRuta.includes("Desfogue") && `(#${camion.areasRuta.indexOf("Desfogue") + 1})`}
              </div>

              <div
                className={`area-card ${camion.areasRuta.includes("Diesel") ? "selected" : ""}`}
                onClick={() => alternarAreaEnRuta("Diesel")}
              >
                Diesel {camion.areasRuta.includes("Diesel") && `(#${camion.areasRuta.indexOf("Diesel") + 1})`}
              </div>

              <div
                className={`area-card ${camion.areasRuta.includes("Ad-Blue") ? "selected" : ""}`}
                onClick={() => alternarAreaEnRuta("Ad-Blue")}
              >
                AdBlue {camion.areasRuta.includes("Ad-Blue") && `(#${camion.areasRuta.indexOf("Ad-Blue") + 1})`}
              </div>

              <div
                className={`area-card ${camion.areasRuta.includes("Taller") ? "selected" : ""}`}
                onClick={() => alternarAreaEnRuta("Taller")}
              >
                Taller {camion.areasRuta.includes("Taller") && `(#${camion.areasRuta.indexOf("Taller") + 1})`}
              </div>

              <div
                className={`area-card ${camion.areasRuta.includes("Lavado Interior") ? "selected" : ""}`}
                onClick={() => alternarAreaEnRuta("Lavado Interior")}
              >
                Lavado Interior {camion.areasRuta.includes("Lavado Interior") && `(#${camion.areasRuta.indexOf("Lavado Interior") + 1})`}
              </div>

              <div
                className={`area-card ${camion.areasRuta.includes("Lavado Exterior") ? "selected" : ""}`}
                onClick={() => alternarAreaEnRuta("Lavado Exterior")}
              >
                Lavado Exterior {camion.areasRuta.includes("Lavado Exterior") && `(#${camion.areasRuta.indexOf("Lavado Exterior") + 1})`}
              </div>
            </div>

            <div className="button-group">
              <button
                className="btn-secondary"
                onClick={() => setPaso(2)}
                disabled={loading}
              >
                Atrás
              </button>

              <button
                className="btn-primary"
                onClick={() => setPaso(4)}
                disabled={loading}
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
                <strong>Ruta Planificada:</strong> {camion.areasRuta.length > 0 ? camion.areasRuta.join(" ➔ ") : "Ninguna"}
              </p>
              <p>
                <strong>Observaciones:</strong> {camion.observaciones || "Sin observaciones"}
              </p>
            </div>

            <div className="button-group">
              <button
                className="btn-secondary"
                onClick={() => setPaso(3)}
                disabled={loading}
              >
                Atrás
              </button>

              <button
                className="btn-success"
                onClick={registrarCamion}
                disabled={loading}
              >
                {loading ? "Registrando..." : "Confirmar Registro"}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
