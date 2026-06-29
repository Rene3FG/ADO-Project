import { useEffect } from 'react';

export default function BusDetailModal({ camion, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!camion) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#11131e',
          borderRadius: '12px',
          padding: '0',
          maxWidth: '500px',
          width: '90%',
          border: '1px solid #2a2f4a',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          animation: 'modalSlideIn 0.3s ease-out',
          overflow: 'hidden'
        }}
      >
        <style>{`
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
        
        <div className="modal-card__header">
          <h2 className="modal-card__header h2" style={{ margin: 0 }}>
            Ficha de Registro: {camion.codigo}
          </h2>
          <button className="modal-card__close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-card__body">
          <div className="modal-data-row">
            <strong>Código:</strong>
            <span>{camion.codigo}</span>
          </div>
          <div className="modal-data-row">
            <strong>Tipo de Autobús:</strong>
            <span>{camion.tipo}</span>
          </div>
          <div className="modal-data-row">
            <strong>Área Actual:</strong>
            <span>{camion.area || 'Sin asignar'}</span>
          </div>
          <div className="modal-data-row">
            <strong>Conductor:</strong>
            <span>{camion.conductor || 'No asignado'}</span>
          </div>
          <div className="modal-data-row">
            <strong>Origen:</strong>
            <span>{camion.origen || 'N/A'}</span>
          </div>
          <div className="modal-data-row">
            <strong>Destino:</strong>
            <span>{camion.destino || 'N/A'}</span>
          </div>
          {camion.ruta && camion.ruta.length > 0 && (
            <div className="modal-data-row">
              <strong>Ruta Planificada:</strong>
              <span>{camion.ruta.join(' → ')}</span>
            </div>
          )}
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          <button
            onClick={onClose}
            className="btn-salida"
            style={{ marginTop: 0 }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
