import { useState, useEffect } from 'react';

export default function TarjetaInfo({ camion, alIniciarArrastre }) {
  const [segundos, setSegundos] = useState(0);

  // Mantiene tu excelente lógica de reinicio por área
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
    return `${minutos.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="bus-card" // Cambiado para el rectángulo contenedor oscuro
      draggable
      onDragStart={(e) => alIniciarArrastre(e, camion.id)}
    >
      <div className="bus-card__eco">{camion.codigo}</div>
      <div className="bus-card__type">{camion.tipo}</div>
      
      {/* Tu indicador del temporizador estilizado en el ecosistema oscuro */}
      <div className="bus-card__status">
        Tiempo en área: {formatearTiempo(segundos)}
      </div>
    </div>
  );
}