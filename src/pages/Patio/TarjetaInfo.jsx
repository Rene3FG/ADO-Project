import { useState, useEffect } from 'react';

export default function TarjetaInfo({
  camion,
  alIniciarArrastre,
  crearAlerta
}) {
  const [segundos, setSegundos] = useState(0);

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

const generarAlerta = () => {
  crearAlerta({
    autobus: camion.codigo,
    area: camion.area,
    tiempo: formatearTiempo(segundos),
  });
  };

  return (
    <div
      className="bus-card"
      draggable
      onDragStart={(e) => alIniciarArrastre(e, camion.id)}
    >
      <div className="bus-card__eco">
        {camion.codigo}
      </div>

      <div className="bus-card__type">
        {camion.tipo}
      </div>

      <div className="bus-card__status">
        Tiempo en área: {formatearTiempo(segundos)}
      </div>

      <button
        className="alerta-btn"
        onClick={generarAlerta}
      >
        Crear alerta
      </button>
    </div>
  );
}