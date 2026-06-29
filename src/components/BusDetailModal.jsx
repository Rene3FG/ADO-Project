/**
 * Bus Detail Modal Component
 * Shows detailed information about a selected bus
 */

export default function BusDetailModal({ camion, onClose }) {
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
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '30px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          animation: 'modalSlideIn 0.3s ease-out'
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
        
        <div 
          className="modal-card__header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '2px solid #e5e4e7'
          }}
        >
          <h2 style={{ margin: 0, color: '#08060d' }}>
            Ficha de Registro: {camion.codigo}
          </h2>
          <button 
            className="modal-card__close" 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#999',
              padding: 0,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            &times;
          </button>
        </div>

        <div className="modal-card__body" style={{ marginBottom: '20px' }}>
          <div 
            className="modal-data-row"
            style={{
              display: 'flex',
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0',
              justifyContent: 'space-between'
            }}
          >
            <strong>Código:</strong>
            <span>{camion.codigo}</span>
          </div>

          <div 
            className="modal-data-row"
            style={{
              display: 'flex',
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0',
              justifyContent: 'space-between'
            }}
          >
            <strong>Tipo de Autobús:</strong>
            <span>{camion.tipo}</span>
          </div>

          <div 
            className="modal-data-row"
            style={{
              display: 'flex',
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0',
              justifyContent: 'space-between'
            }}
          >
            <strong>Área Actual:</strong>
            <span>{camion.area || 'Sin asignar'}</span>
          </div>

          <div 
            className="modal-data-row"
            style={{
              display: 'flex',
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0',
              justifyContent: 'space-between'
            }}
          >
            <strong>Conductor:</strong>
            <span>{camion.conductor || 'No asignado'}</span>
          </div>

          <div 
            className="modal-data-row"
            style={{
              display: 'flex',
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0',
              justifyContent: 'space-between'
            }}
          >
            <strong>Origen:</strong>
            <span>{camion.origen || 'N/A'}</span>
          </div>

          <div 
            className="modal-data-row"
            style={{
              display: 'flex',
              padding: '12px 0',
              justifyContent: 'space-between'
            }}
          >
            <strong>Destino:</strong>
            <span>{camion.destino || 'N/A'}</span>
          </div>

          {camion.ruta && camion.ruta.length > 0 && (
            <div 
              className="modal-data-row"
              style={{
                display: 'flex',
                padding: '12px 0',
                borderTop: '1px solid #f0f0f0',
                marginTop: '10px',
                paddingTop: '15px',
                justifyContent: 'space-between'
              }}
            >
              <strong>Ruta Planificada:</strong>
              <span>{camion.ruta.join(' → ')}</span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px 20px',
            backgroundColor: '#aa3bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#8f2bd6'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#aa3bff'}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
