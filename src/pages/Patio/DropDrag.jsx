import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TarjetaInfo from './TarjetaInfo.jsx';
import './DropDrag.css';
import Registro from '../Registro/Registro.jsx';
import ConfAvaz from '../ConfAvanz/ConfAvaz.jsx';
import Reportes from '../Reportes/Reportes.jsx';
import BusDetailModal from '../../components/BusDetailModal.jsx';
import Toast from '../../components/Toast.jsx';
import camionesService from '../../services/camionesService.js';
import areasService from '../../services/areasService.js';
import historialService from '../../services/historialService.js';
import { useAuth } from '../../context/AuthContext.jsx';

import { MdDashboard, MdAssignmentTurnedIn, MdSwapHoriz, MdHistory, MdBarChart, MdSettings, MdExitToApp } from "react-icons/md";
import { TbWash, TbWashDryDip } from "react-icons/tb";
import { BsFillFuelPumpDieselFill } from "react-icons/bs";
import { CiDroplet } from "react-icons/ci";
import { MdLocalCarWash } from "react-icons/md";
import { HiMiniWrenchScrewdriver } from "react-icons/hi2";
import { SiBlockbench } from "react-icons/si";
import { MdAddAlert } from "react-icons/md";

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
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const esAdmin = user?.rol === 'Administrador';
  const esSupervisor = user?.rol === 'Supervisor';
  const esOperador = user?.rol === 'Operador';

  const [pestanaActiva, setPestanaActiva] = useState('patio');
  const [camiones, setCamiones] = useState([]);
  const [areasConfig, setAreasConfig] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [camionSeleccionado, setCamionSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  // Cargar datos iniciales desde la API
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      setError("");

      const mockDB = (await import('./CamionArea.json')).default;

      const [resC, resA, resH] = await Promise.allSettled([
        camionesService.getAllCamiones(),
        areasService.getAllAreas(),
        historialService.getHistorial(),
      ]);

      const camionesData = resC.status === 'fulfilled' && Array.isArray(resC.value)
        ? resC.value
        : mockDB.camiones;

      const areasData = resA.status === 'fulfilled' && Array.isArray(resA.value)
        ? resA.value
        : mockDB.areas;

      const historialData = resH.status === 'fulfilled' && Array.isArray(resH.value)
        ? resH.value
        : [];

      if (resC.status === 'rejected') console.warn('Camiones API no disponible, usando mock:', resC.reason?.message);
      if (resA.status === 'rejected') console.warn('Areas API no disponible, usando mock:', resA.reason?.message);

      setCamiones(camionesData);
      setAreasConfig(areasData);
      setHistorial(historialData);
      setLoading(false);
    };

    cargarDatos();
  }, []);

  const handleLogout = () => {
    logout();
    setToast({
      message: 'Sesión cerrada correctamente',
      type: 'success'
    });
    setTimeout(() => {
      navigate('/login');
    }, 500);
  };

  const agregarCamion = (nuevoCamion) => {
    const areaDestino = nuevoCamion.area;
    if (areaDestino && areaDestino !== 'Descanso') {
      const infoArea = areasConfig.find(a => a.id === areaDestino);
      const capacidad = infoArea ? infoArea.capacidad : 4;
      const actual = camiones.filter(c => c.area === areaDestino).length;
      if (actual >= capacidad) {
        setToast({ message: `Área "${areaDestino}" llena (máx ${capacidad}). Elige otra área.`, type: 'error' });
        return;
      }
    }
    setCamiones((prev) => [...prev, nuevoCamion]);
    setToast({
      message: 'Autobús agregado exitosamente',
      type: 'success'
    });
  };

  const crearAlerta = async (alertaNueva) => {
    setAlertas((prev) => [...prev, alertaNueva]);
    const ahora = new Date();

    const registroAlerta = {
      id: Date.now(),
      tipo: "alerta",
      unidad: alertaNueva.autobus,
      fecha: ahora.toLocaleDateString('es-MX'),
      hora: ahora.toLocaleTimeString('es-MX'),
      mensaje: `Alerta: la unidad ${alertaNueva.autobus} excedió el tiempo permitido en ${alertaNueva.area}`
    };

    setHistorial(prev => [registroAlerta, ...prev]);

    // Log alerta en API
    try {
      await historialService.logAlerta(registroAlerta);
    } catch (err) {
      console.error("Error logging alerta:", err);
    }

    setTimeout(() => {
      setAlertas((prev) =>
        prev.filter((alerta) => alerta !== alertaNueva)
      );
    }, 5000);
  };

  const sacarCamion = async (idCamion) => {
    const camion = camiones.find(c => c.id === idCamion);

    if (!camion) return;

    const ahora = new Date();
    const horaSalidaTexto = ahora.toLocaleTimeString('es-MX');

    const registroSalida = {
      id: Date.now(),
      unidad: camion.codigo,
      areaFinal: camion.area,
      fecha: ahora.toLocaleDateString('es-MX'),
      hora: horaSalidaTexto,
      mensaje: `La unidad ${camion.codigo} salió de la terminal ADO`
    };

    setHistorial(prev => [registroSalida, ...prev]);

    // Actualizar en API
    try {
      await camionesService.sacarCamion(idCamion);
      await historialService.logSalida(registroSalida);
      setToast({
        message: `Unidad ${camion.codigo} ha salido`,
        type: 'success'
      });
    } catch (err) {
      console.error("Error updating camion en API:", err);
      setToast({
        message: 'Error al registrar salida',
        type: 'error'
      });
    }

    setCamiones(prev =>
      prev.map(c =>
        c.id === idCamion
          ? { ...c, area: "Fuera", horaSalidaTerminal: horaSalidaTexto }
          : c
      )
    );
  };

  const agregarHistorial = (registro) => {
    setHistorial(prev => [registro, ...prev]);
  };

  const alIniciarArrastre = (e, idCamion) => {
    e.dataTransfer.setData('text/plain', idCamion);
  };

  const permitirSoltar = (e) => {
    e.preventDefault();
  };

  const alSoltar = async (e, nuevaAreaId) => {
    e.preventDefault();
    const idCamion = e.dataTransfer.getData('text/plain');

    const camionQueSeMueve = camiones.find(c => c.id === idCamion);
    if (!camionQueSeMueve) return;

    const areaActual = camionQueSeMueve.area;
    if (areaActual === nuevaAreaId) return;

    if (camionQueSeMueve.ruta && camionQueSeMueve.ruta.length > 0) {
      if (camionQueSeMueve.finalizado) {
        if (nuevaAreaId !== "Descanso") {
          alert(`Movimiento incorrecto.\nLa unidad ${camionQueSeMueve.codigo} ya completó su ciclo. Solo puede moverse a "Descanso" para esperar su salida.`);
          return;
        }
      } else {
        const indiceActual = camionQueSeMueve.ruta.indexOf(areaActual);
        const siguienteAreaEsperada = camionQueSeMueve.ruta[indiceActual + 1];

        if (nuevaAreaId !== siguienteAreaEsperada) {
          alert(`Movimiento incorrecto.\nEl autobús ${camionQueSeMueve.codigo} tiene asignado ir a: "${siguienteAreaEsperada || 'Completar ciclo'}".`);
          return;
        }
      }
    } else {
      const reglasFlujo = {
        "Desfogue": ["Diesel", "Ad-Blue", "Descanso"],
        "Diesel": ["Ad-Blue", "Descanso"],
        "Ad-Blue": ["Lavado Interior", "Lavado Exterior", "Taller", "Descanso"],
        "Lavado Exterior": ["Lavado Interior", "Taller", "Descanso"],
        "Lavado Interior": ["Lavado Exterior", "Taller", "Descanso"],
        "Taller": ["Lavado Exterior", "Lavado Interior", "Descanso"],
        "Descanso": ["Desfogue"]
      };

      const movimientosPermitidos = reglasFlujo[areaActual] || [];
      if (!movimientosPermitidos.includes(nuevaAreaId)) {
        alert(`Movimiento no autorizado.\nUn autobús en "${areaActual}" solo puede avanzar a: ${movimientosPermitidos.join(" o ")}.`);
        return;
      }
    }

    const infoAreaDestino = areasConfig.find(a => a.id === nuevaAreaId);
    const limiteMaximoArea = infoAreaDestino ? infoAreaDestino.capacidad : 4;

    const camionesEnAreaDestino = camiones.filter(c => c.area === nuevaAreaId).length;

    if (camionesEnAreaDestino >= limiteMaximoArea) {
      alert(`El área de ${nuevaAreaId} ya alcanzó su límite máximo de ${limiteMaximoArea} lugares.`);
      return;
    }

    const camionesActualizados = camiones.map((camion) => {
      if (camion.id === idCamion) {
        return { ...camion, area: nuevaAreaId };
      }
      return { ...camion };
    });

    const camionMovido = camiones.find(c => c.id === idCamion);

    if (camionMovido) {
      const ahora = new Date();

      const registroMovimiento = {
        id: Date.now(),
        tipo: "movimiento",
        unidad: camionMovido.codigo,
        fecha: ahora.toLocaleDateString('es-MX'),
        hora: ahora.toLocaleTimeString('es-MX'),
        mensaje: `La unidad ${camionMovido.codigo} fue movida de ${camionMovido.area} a ${nuevaAreaId}`
      };

      setHistorial(prev => [registroMovimiento, ...prev]);

      // Registrar movimiento en API
      try {
        await camionesService.moveCamionToArea(idCamion, nuevaAreaId);
        await historialService.logMovimiento(registroMovimiento);
      } catch (err) {
        console.error("Error updating camion movement en API:", err);
      }
    }

    setCamiones(camionesActualizados);
  };

  const generarDatosDeReporte = () => {
    return camiones.map((camion) => {
      const movimientosDelCamion = historial.filter(
        (mov) => mov.unidad === camion.codigo
      );

      const horaEntrada = movimientosDelCamion.length > 0
        ? movimientosDelCamion[movimientosDelCamion.length - 1].hora
        : "Recién registrado";

      const areaActual = camion.area ? camion.area.trim() : "";

      let horaSalida = "En proceso...";
      if (areaActual === "Fuera" && camion.horaSalidaTerminal) {
        horaSalida = camion.horaSalidaTerminal;
      }

      let estadoActual = "En flujo";
      if (areaActual === "Fuera") {
        estadoActual = "Completado";
      } else if (camion.finalizado) {
        estadoActual = "Finalizado";
      } else if (areaActual === "Descanso") {
        estadoActual = "En descanso";
      }

      let porcentajeProgreso = 0;

      if (areaActual === "Fuera") {
      } else {
        const indiceArea = areasConfig.findIndex(a => a.id === areaActual);

        if (indiceArea !== -1 && areasConfig.length > 0) {
          porcentajeProgreso = Math.round(((indiceArea + 1) / areasConfig.length) * 100);
        }
      }

      return {
        id: camion.id,
        codigo: camion.codigo,
        conductor: camion.conductor,
        horaEntrada: horaEntrada,
        horaSalida: horaSalida,
        estado: estadoActual,
        status: estadoActual,
        estatus: estadoActual,
        progreso: porcentajeProgreso
      };
    });
  };

  const obtenerProgresoCamion = (camion) => {
    if (!camion) return 0;

    if (camion.finalizado || camion.area === "Fuera") return 100;

    if (camion.ruta && camion.ruta.length > 0) {
      const indiceArea = camion.ruta.indexOf(camion.area);
      if (indiceArea !== -1) {
        return Math.round((indiceArea / camion.ruta.length) * 100);
      }
    } else {
      const indiceArea = areasConfig.findIndex(a => a.id === camion.area);
      if (indiceArea !== -1 && areasConfig.length > 0) {
        return Math.round((indiceArea / areasConfig.length) * 100);
      }
    }
    return 0;
  };

  const finalizarRecorrido = async (idCamion) => {
    const camion = camiones.find(c => c.id === idCamion);
    if (!camion) return;

    const ahora = new Date();
    const horaSalidaTexto = ahora.toLocaleTimeString('es-MX');

    const registroCompletado = {
      id: Date.now(),
      tipo: "completado",
      unidad: camion.codigo,
      fecha: ahora.toLocaleDateString('es-MX'),
      hora: horaSalidaTexto,
      mensaje: `La unidad ${camion.codigo} completó su ruta en ${camion.area}`
    };

    setHistorial(prev => [
      registroCompletado,
      ...prev
    ]);

    // Actualizar en API
    try {
      await camionesService.finalizarCamion(idCamion);
      await historialService.logCompletado(registroCompletado);
      setToast({
        message: `Ruta completada: ${camion.codigo}`,
        type: 'success'
      });
    } catch (err) {
      console.error("Error finalizing camion:", err);
    }

    setCamiones(prev =>
      prev.map(c =>
        c.id === idCamion
          ? { ...c, finalizado: true, horaSalidaTerminal: horaSalidaTexto }
          : c
      )
    );
  };

  const renderizarContenido = () => {
    switch (pestanaActiva) {
      case 'patio':
        return (
          <div className="drag-board">
            {areasConfig.map((areaInfo) => {
              const nombreArea = areaInfo.id;
              const capacidadMaxima = areaInfo.capacidad;
              const camionesActuales = camiones.filter((c) => c.area === nombreArea).length;

              return (
                <div
                  key={nombreArea}
                  className="drag-zone"
                  onDragOver={permitirSoltar}
                  onDrop={(e) => alSoltar(e, nombreArea)}
                >
                  <div className="drag-zone__header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="sidebar__icon-active">
                        {areaIcons[nombreArea]}
                      </span>
                      <h3>{nombreArea}</h3>
                    </div>
                    <span className="zone-counter">
                      Capacidad: {camionesActuales}/{capacidadMaxima}
                    </span>
                  </div>

                  <div className="drag-zone__content">
                    {camiones.filter((camion) => camion.area === nombreArea).length === 0 ? (
                      <div className="no-buses">No hay autobuses</div>
                    ) : (
                      camiones
                        .filter((camion) => camion.area === nombreArea)
                        .map((camion) => (
                          <div
                            key={camion.id}
                            onDoubleClick={() => setCamionSeleccionado(camion)}
                            title="Doble clic para ver detalles del Registro"
                          >
                            <TarjetaInfo
                              camion={camion}
                              alIniciarArrastre={alIniciarArrastre}
                              crearAlerta={crearAlerta}
                              progreso={obtenerProgresoCamion(camion)}
                            />

                            {nombreArea === "Descanso" && !camion.finalizado && (
                              <button
                                className="btn-salida"
                                style={{ backgroundColor: '#10b981' }}
                                onClick={() => sacarCamion(camion.id)}
                              >
                                Finalizar y dar salida
                              </button>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      case 'registrar':
        return (
          <Registro
            agregarCamion={agregarCamion}
            agregarHistorial={agregarHistorial}
          />
        );
      case 'historial':
        return (
          <div className="historial-container">
            <h2>Historial de Movimientos</h2>

            {historial.length === 0 ? (
              <p>No hay registros disponibles.</p>
            ) : (
              <div className="historial-grid">
                {historial.map((registro) => (
                  <div
                    key={registro.id}
                    className="historial-card"
                  >
                    <div className="historial-card__mensaje">
                      {registro.mensaje}
                    </div>

                    <div className="historial-card__info">
                      <span>Unidad: {registro.unidad}</span>
                    </div>

                    <div className="historial-card__fecha">
                      {registro.fecha} · {registro.hora}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'reportes':
        return <Reportes datos={generarDatosDeReporte()} />;

      case 'configuracion':
        return (
          <ConfAvaz
            areasConfig={areasConfig}
            setAreasConfig={setAreasConfig}
            camiones={camiones}
            setCamiones={setCamiones}
          />
        );
      default:
        return <div className="pantalla-vacia"><h2>Selecciona una opción</h2></div>;
    }
  };

  if (loading) {
    return (
      <div className="layout-container">
        <main className="main-content">
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>Cargando datos del sistema...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="layout-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {camionSeleccionado && (
        <BusDetailModal
          camion={camionSeleccionado}
          onClose={() => setCamionSeleccionado(null)}
        />
      )}

      <aside className="sidebar">
        <div className="sidebar__logo">
          <img
            src="/logo-ado.png"
            alt="ADO"
            className="sidebar__logo-img"
          />
        </div>

        <nav className="sidebar__nav">
          <button
            className={`sidebar__item ${pestanaActiva === 'patio' ? 'sidebar__item--active' : ''}`}
            onClick={() => setPestanaActiva('patio')}
          >
            <MdDashboard className="sidebar__icon" />
            <span>Patio en tiempo real</span>
          </button>
          {(esAdmin || esOperador) && (
            <button
              className={`sidebar__item ${pestanaActiva === 'registrar' ? 'sidebar__item--active' : ''}`}
              onClick={() => setPestanaActiva('registrar')}
            >
              <MdAssignmentTurnedIn className="sidebar__icon" />
              <span>Registrar camión</span>
            </button>
          )}
          {(esAdmin || esSupervisor) && (
            <button
              className={`sidebar__item ${pestanaActiva === 'historial' ? 'sidebar__item--active' : ''}`}
              onClick={() => setPestanaActiva('historial')}
            >
              <MdHistory className="sidebar__icon" />
              <span>Historial</span>
            </button>
          )}
          {(esAdmin || esSupervisor) && (
            <button
              className={`sidebar__item ${pestanaActiva === 'reportes' ? 'sidebar__item--active' : ''}`}
              onClick={() => setPestanaActiva('reportes')}
            >
              <MdBarChart className="sidebar__icon" />
              <span>Reportes</span>
            </button>
          )}
          {esAdmin && (
            <button
              className={`sidebar__item ${pestanaActiva === 'configuracion' ? 'sidebar__item--active' : ''}`}
              onClick={() => setPestanaActiva('configuracion')}
            >
              <MdSettings className="sidebar__icon" />
              <span>Configuración Avanzada</span>
            </button>
          )}
        </nav>

        <button 
          className="sidebar__logout" 
          onClick={handleLogout}
          title={`Cerrar sesión (${user?.nombre || user?.id || 'Usuario'})`}
        >
          <MdExitToApp className="sidebar__icon" />
          <span>Cerrar sesión</span>
        </button>
      </aside>

      <main className="main-content">
        <header className="main-content__header">
          <h1>Control de Patio - Oaxaca</h1>
          <p>Sesión de {user?.nombre || user?.id}</p>
        </header>
        <div className="content-scroll-area">
          {alertas.length > 0 && (
            <div className="alertas-container">
              {alertas.map((alerta, index) => (
                <div key={index} className="alerta-toast">
                  <MdAddAlert />
                  <span>
                    El autobús {alerta.autobus} está en {alerta.area} y lleva {alerta.tiempo}
                  </span>
                </div>
              ))}
            </div>
          )}
          {renderizarContenido()}
        </div>
      </main>
    </div>
  );
}
