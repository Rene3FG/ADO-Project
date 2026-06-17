import { useState, useEffect, useRef } from 'react';

export default function TarjetaInfo({
  camion,
  alIniciarArrastre,
  crearAlerta
}) {
  const [segundos, setSegundos] = useState(0);
  const alertaGenerada = useRef(false);

  useEffect(() => {
    setSegundos(0);

    const cronometro = setInterval(() => {
      setSegundos((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(cronometro);
  }, [camion.area]);

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

    crearAlerta({
      autobus: camion.codigo,
      area: camion.area,
      tiempo: formatearTiempo(segundos),
    });
  }
}, [segundos, camion.codigo, camion.area, crearAlerta]);

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
      onDragStart={(e) => alIniciarArrastre(e, camion.id)}
    >
      <div className="bus-card__header">
  <div className={`semaforo semaforo--${colorSemaforo}`}></div>

  <div className="bus-card__eco">
    {camion.codigo}
  </div>
    </div>

      <div className="bus-card__type">
        {camion.tipo}
      </div>

      <div className="bus-card__status">
        Tiempo en área: {formatearTiempo(segundos)}
      </div>

    </div>
  );
}