import { useState, useEffect } from 'react';

export default function TarjetaInfo({ camion, alIniciarArrastre }) {
  const [segundos, setSegundos] = useState(0);

  // Este efecto controla el reloj. Se reinicia AUTOMÁTICAMENTE si el área del camión cambia.
  useEffect(() => {
    setSegundos(0); //Reiniciar el contador

    const cronometro = setInterval(() => {
      setSegundos((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(cronometro);
  }, [camion.area]); // <-- Esta es la clave: el reloj vigila si cambia el "area"

  // Función auxiliar para transformar los segundos totales a formato "MM:SS"
  const formatearTiempo = (totSegundos) => {
    const minutos = Math.floor(totSegundos / 60);
    const seg = totSegundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="tarjeta-camion"
      draggable
      onDragStart={(e) => alIniciarArrastre(e, camion.id)}
    >
      <h4>{camion.codigo}</h4>
      <p className="tipo-camion">{camion.tipo}</p>
      
      {/* Indicador visual del temporizador en tiempo real */}
      <div className="badge-tiempo">
        <span>Tiempo en área: {formatearTiempo(segundos)}</span>
      </div>
    </div>
  );
}