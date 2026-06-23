import { useState, useEffect, useRef } from 'react';

//Esta variable vive afuera del componente. 
// Sobrevive aunque se cambie de pestaña y el componente se destruya.
const memoriaTiempos = {};

export default function TarjetaInfo({
  camion,
  alIniciarArrastre,
  crearAlerta
}) {
  const [segundos, setSegundos] = useState(0);
  const alertaGenerada = useRef(false);

  useEffect(() => {
    // Se registra el camion con su hora exacta de entrada en milisegundos.
    if (!memoriaTiempos[camion.busId] || memoriaTiempos[camion.busId].area !== camion.currentArea) {
      memoriaTiempos[camion.busId] = {
        area: camion.currentArea,
        horaEntrada: Date.now(),
        alertaYaSonada: false
      };
    }
    alertaGenerada.current = memoriaTiempos[camion.busId].alertaYaSonada;

    //Función que calcula el tiempo real restando la hora actual menos la hora de entrada
    const calcularTiempoReal = () => {
      const segundosReales = Math.floor((Date.now() - memoriaTiempos[camion.busId].horaEntrada) / 1000);
      setSegundos(segundosReales);
    };

    calcularTiempoReal();

    const cronometro = setInterval(calcularTiempoReal, 1000);

    return () => clearInterval(cronometro);
  }, [camion.busId, camion.currentArea]);

  const formatearTiempo = (totSegundos) => {
    const minutos = Math.floor(totSegundos / 60);
    const seg = totSegundos % 60;

    return `${minutos.toString().padStart(2, '0')}:${seg
      .toString()
      .padStart(2, '0')}`;
  };

  useEffect(() => {
    if (segundos >= 15 && !alertaGenerada.current) {
      alertaGenerada.current = true;

      //La alerta se guarda para que no vuelva a sonar
      memoriaTiempos[camion.busId].alertaYaSonada = true;

      crearAlerta({
        autobus: camion.busId,
        area: camion.currentArea,
        tiempo: formatearTiempo(segundos),
      });
    }
  }, [segundos, camion.busId, camion.currentArea, crearAlerta]);

  let colorSemaforo = "verde";

  if (segundos >= 10 && segundos < 15) {
    colorSemaforo = "amarillo";
  }

  if (segundos >= 15) {
    colorSemaforo = "rojo";
  }

  return (
    <div
      className="bus-card"
      draggable
      onDragStart={(e) => alIniciarArrastre(e, camion.busId)}
    >
      <div className="bus-card__header">
        <div className={`semaforo semaforo--${colorSemaforo}`}></div>

        <div className="bus-card__eco">
          {camion.busId}
        </div>
      </div>

      <div className="bus-card__type">
        {camion.busType}
      </div>

      <div className="bus-card__status">
        Tiempo en área: {formatearTiempo(segundos)}
      </div>
    </div>
  );
}