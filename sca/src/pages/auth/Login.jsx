import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Sistema de Control de Autobuses (SCA)</h1>
      <p>Inicio de sesión</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', marginTop: '30px' }}>
        
        {/* Botón para probar la vista de Registro/Recepción */}
        <button 
          onClick={() => navigate('/recepcion')}
          style={{
            padding: '15px 30px', fontSize: '18px', backgroundColor: '#388E3C',
            color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '300px'
          }}
        >
          Entrar a Recepción (Registro)
        </button>

        {/* Botón para probar la vista de un Operador de Patio */}
        <button 
          onClick={() => navigate('/operador')}
          style={{
            padding: '15px 30px', fontSize: '18px', backgroundColor: '#D32F2F',
            color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '300px'
          }}
        >
          Entrar como Operador de Área
        </button>

      </div>
    </div>
  );
}