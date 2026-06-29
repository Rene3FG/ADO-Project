/**
 * Loading Spinner Component
 * Shows a loading indicator
 */

export default function LoadingSpinner({ message = "Cargando..." }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px',
      minHeight: '200px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          border: '4px solid #f0f0f0',
          borderTop: '4px solid #aa3bff',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 15px'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: '#666', margin: 0 }}>{message}</p>
      </div>
    </div>
  );
}
