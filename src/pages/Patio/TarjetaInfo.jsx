import { useState, useEffect, useRef } from 'react';

//Esta variable vive afuera del componente. 
// Sobrevive aunque se cambie de pestaña y el componente se destruya.
const memoriaTiempos = {};

export default function TarjetaInfo({
  camion,
  alIniciarArrastre,
  crearAlerta,
  progreso
}) {
  const [segundos, setSegundos] = useState(0);
  const alertaGenerada = useRef(false);

  useEffect(() => {
    // Se registra el camion con su hora exacta de entrada en milisegundos.
    if (!memoriaTiempos[camion.id] || memoriaTiempos[camion.id].area !== camion.area) {
      memoriaTiempos[camion.id] = {
        area: camion.area,
        horaEntrada: Date.now(),
        alertaYaSonada: false
      };
    }
    alertaGenerada.current = memoriaTiempos[camion.id].alertaYaSonada;

    //Función que calcula el tiempo real restando la hora actual menos la hora de entrada
    const calcularTiempoReal = () => {
      const segundosReales = Math.floor((Date.now() - memoriaTiempos[camion.id].horaEntrada) / 1000);
      setSegundos(segundosReales);
    };

    calcularTiempoReal();

    const cronometro = setInterval(calcularTiempoReal, 1000);

    return () => clearInterval(cronometro);
  }, [camion.id, camion.area]);

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
      memoriaTiempos[camion.id].alertaYaSonada = true;

      crearAlerta({
        autobus: camion.codigo,
        area: camion.area,
        tiempo: formatearTiempo(segundos),
      });
    }
  }, [segundos, camion.codigo, camion.area, crearAlerta, camion.id]);

  let colorSemaforo = "verde";

  if (segundos >= 10 && segundos < 15) {
    colorSemaforo = "amarillo";
  }

  if (segundos >= 15) {
    colorSemaforo = "rojo";
  }

  return (
    <div 
      className="tarjeta-camion"
      draggable
      onDragStart={(e) => alIniciarArrastre(e, camion.id)}
    >
      {/*Semáforo y Código del Autobús */}
      <div className="tarjeta-header">
        <span className={`estado-semaforo ${colorSemaforo}`}></span>
        <span className="codigo-unidad">{camion.codigo}</span>
      </div>

      {/*Tipo de Autobús */}
      <div className="tipo-unidad">
        {camion.tipo}
      </div>

      {/*Cronómetro */}
      <div className={`tiempo-area ${colorSemaforo}`}>
        Tiempo en área: {formatearTiempo(segundos)}
      </div>

      {/*Barra de Progreso */}
      <div style={{ width: '90%', margin: '10px auto 0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', padding: '0 2px' }}>
          <span style={{ fontSize: '10px', color: '#9ca3af' }}>Avance</span>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: progreso === 100 ? '#10b981' : '#ffffff' }}>
            {progreso}%
          </span>
        </div>
        <div className="tarjeta-progreso-mini-bg" style={{ width: '100%', margin: '0' }}>
          <div 
            className="tarjeta-progreso-mini-fill" 
            style={{ width: `${progreso}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}