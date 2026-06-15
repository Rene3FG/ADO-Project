// src/lib/presentation/pages/RegistroUnidadPage.jsx
import { useRegistroBloc } from '../../logic/useRegistroBloc';

export const RegistroUnidadPage = () => {
  const {
    numeroSerie, setNumeroSerie,
    tipoUnidad, setTipoUnidad,
    tieneBano, setTieneBano,
    cargando, error, exito,
    guardarUnidad
  } = useRegistroBloc();

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
      <h2 style={{ color: '#ce0037', borderBottom: '2px solid #f67b83', paddingBottom: '10px' }}>
        Registro Manual de Unidad
      </h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>Ingresa los datos del autobús para enviarlo a la cola de espera.</p>

      <form onSubmit={guardarUnidad} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Número de Serie */}
        <div className="input-group">
          <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Número de Serie (ID)</label>
          <input 
            type="number" 
            value={numeroSerie}
            onChange={(e) => setNumeroSerie(e.target.value)}
            placeholder="Ej. 1329"
            required
            disabled={cargando}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
        </div>

        {/* Tipo de Unidad */}
        <div className="input-group">
          <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Tipo de Camión</label>
          <select 
            value={tipoUnidad}
            onChange={(e) => setTipoUnidad(e.target.value)}
            disabled={cargando}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: 'white' }}
          >
            <option value="ADO">ADO</option>
            <option value="OCC">OCC</option>
            <option value="AU">AU</option>
          </select>
        </div>

        {/* Características (Baño) */}
        <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input 
            type="checkbox" 
            id="tieneBano"
            checked={tieneBano}
            onChange={(e) => setTieneBano(e.target.checked)}
            disabled={cargando}
            style={{ transform: 'scale(1.5)', accentColor: '#ce0037' }}
          />
          <label htmlFor="tieneBano" style={{ fontWeight: 'bold', cursor: 'pointer' }}>La unidad cuenta con baño</label>
        </div>

        {/* Mensajes de Alerta */}
        {error && <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '6px' }}>⚠️ {error}</div>}
        {exito && <div style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '6px' }}>✅ Unidad registrada exitosamente.</div>}

        {/* Botón Guardar */}
        <button 
          type="submit" 
          disabled={cargando}
          style={{ backgroundColor: '#ce0037', color: 'white', padding: '15px', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: cargando ? 'not-allowed' : 'pointer', marginTop: '10px' }}
        >
          {cargando ? 'Guardando...' : 'Registrar en el Sistema'}
        </button>
      </form>
    </div>
  );
};