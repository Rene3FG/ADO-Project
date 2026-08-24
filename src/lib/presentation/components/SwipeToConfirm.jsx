// src/lib/presentation/components/SwipeToConfirm.jsx
// Slider de confirmación por gesto (touch/mouse vía Pointer Events), sin
// librerías externas — reemplaza el botón + modal "¿Estás seguro?" del
// flujo anterior. Deslizar hasta el final = confirmar; soltar antes = cancela
// y el thumb regresa a su posición inicial.
import { useRef, useState, useCallback } from 'react';

const UMBRAL_CONFIRMACION = 0.85; // % del recorrido para disparar onConfirm

export const SwipeToConfirm = ({ label = 'Desliza para confirmar', onConfirm, disabled = false }) => {
  const trackRef = useRef(null);
  const [dragX, setDragX] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const inicioRef = useRef(0);
  // maxX se usa tanto en handlers como para el cálculo de opacidad en el
  // render — por eso es estado (leer un ref durante el render no está
  // permitido), aunque solo cambia una vez por gesto (en alBajar).
  const [maxX, setMaxX] = useState(0);

  const alBajar = useCallback((e) => {
    if (disabled || confirmado) return;
    const track = trackRef.current;
    if (!track) return;
    setMaxX(track.clientWidth - 56); // 56px = ancho del thumb
    inicioRef.current = e.clientX;
    setArrastrando(true);
    e.target.setPointerCapture?.(e.pointerId);
  }, [disabled, confirmado]);

  const alMover = useCallback((e) => {
    if (!arrastrando) return;
    const delta = e.clientX - inicioRef.current;
    setDragX(Math.max(0, Math.min(delta, maxX)));
  }, [arrastrando, maxX]);

  const alSoltar = useCallback(() => {
    if (!arrastrando) return;
    setArrastrando(false);
    if (maxX > 0 && dragX / maxX >= UMBRAL_CONFIRMACION) {
      setDragX(maxX);
      setConfirmado(true);
      Promise.resolve(onConfirm?.()).finally(() => {
        setTimeout(() => { setConfirmado(false); setDragX(0); }, 300);
      });
    } else {
      setDragX(0);
    }
  }, [arrastrando, dragX, maxX, onConfirm]);

  const progreso = maxX > 0 ? dragX / maxX : 0;

  return (
    <div
      ref={trackRef}
      style={{
        position: 'relative', width: '100%', height: '56px', borderRadius: '28px',
        backgroundColor: disabled ? '#e5e7eb' : '#e0f2fe', overflow: 'hidden',
        border: `1px solid ${disabled ? '#d1d5db' : '#bae6fd'}`, userSelect: 'none', touchAction: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute', top: 0, left: 0, height: '100%',
          width: `${dragX + 56}px`, backgroundColor: confirmado ? '#22c55e' : '#1976D2',
          opacity: 0.25 + progreso * 0.5, transition: arrastrando ? 'none' : 'width 0.2s ease',
        }}
      />
      <span style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: '15px', color: disabled ? '#9ca3af' : '#0c4a6e', pointerEvents: 'none',
      }}>
        {confirmado ? '✓ Enviado' : label}
      </span>
      <div
        onPointerDown={alBajar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        style={{
          position: 'absolute', top: '3px', left: '3px', width: '50px', height: '50px', borderRadius: '50%',
          backgroundColor: disabled ? '#9ca3af' : confirmado ? '#16a34a' : '#1976D2', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
          cursor: disabled ? 'not-allowed' : 'grab', boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
          transform: `translateX(${dragX}px)`, transition: arrastrando ? 'none' : 'transform 0.2s ease',
        }}
      >
        {confirmado ? '✓' : '➜'}
      </div>
    </div>
  );
};
