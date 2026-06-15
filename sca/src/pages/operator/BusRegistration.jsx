import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BusRegistration() {
  const navigate = useNavigate();
  const MAX_CAPACITY = 3;
  
  const WORKFLOW_ORDER = [
    'Desfogue', 'Diesel', 'Ad-blue', 'Taller', 'Lavado Interior', 'Lavado Exterior'
  ];

  const [step, setStep] = useState(1);
  const [areaCapacities, setAreaCapacities] = useState({});

  const [formData, setFormData] = useState({
    busId: '', busType: '', departureTime: '',
    requiredAreas: {
      'Desfogue': false, 'Diesel': false, 'Ad-blue': false,
      'Taller': false, 'Lavado Interior': false, 'Lavado Exterior': false
    },
    initialArea: '', observations: ''
  });

  // Fetch current capacities from the server
  const fetchCapacities = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/areas/capacity');
      const data = await response.json();
      setAreaCapacities(data);
    } catch (error) {
      console.error("Error fetching capacities:", error);
    }
  };

  useEffect(() => {
    fetchCapacities();
    // Refrescar cada 5 segundos para mantener las capacidades actualizadas
    const interval = setInterval(fetchCapacities, 5000);
    return () => clearInterval(interval);
  }, []);

  // Smart Recommendation Logic (Order + Capacity)
  const getRecommendedArea = () => {
    for (const area of WORKFLOW_ORDER) {
      // If area is required and has space, recommend it
      if (formData.requiredAreas[area]) {
        const currentOccupancy = areaCapacities[area] || 0;
        if (currentOccupancy < MAX_CAPACITY) {
          return area;
        }
      }
    }
    // If all required areas are full (or none selected), recommend 'Espera'
    const hasSelections = Object.values(formData.requiredAreas).some(val => val);
    return hasSelections ? 'Espera' : '';
  };

  const recommendedArea = getRecommendedArea();
  const isAllSelected = WORKFLOW_ORDER.every((area) => formData.requiredAreas[area]);

  useEffect(() => {
    setFormData((prevData) => ({ ...prevData, initialArea: recommendedArea }));
  }, [formData.requiredAreas, recommendedArea]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleCheckboxChange = (area) => {
    setFormData((prevData) => ({
      ...prevData,
      requiredAreas: { ...prevData.requiredAreas, [area]: !prevData.requiredAreas[area] }
    }));
  };

  const handleToggleAll = () => {
    const newValue = !isAllSelected;
    const updatedAreas = {};
    WORKFLOW_ORDER.forEach((area) => updatedAreas[area] = newValue);
    setFormData((prevData) => ({ ...prevData, requiredAreas: updatedAreas }));
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    const hasSelectedAreas = Object.values(formData.requiredAreas).some(value => value === true);
    if (!formData.busId || !formData.busType || !formData.departureTime || !hasSelectedAreas || !formData.initialArea) {
      alert("Por favor, llena los campos obligatorios y selecciona destino.");
      return;
    }
    setStep(2);
  };

  const handleRegister = async () => {
    const selectedAreasArray = Object.keys(formData.requiredAreas).filter((area) => formData.requiredAreas[area]);
    const payload = {
      busId: formData.busId, busType: formData.busType, departureTime: formData.departureTime,
      requiredAreas: selectedAreasArray, initialArea: formData.initialArea, observations: formData.observations || null
    };

    try {
      const response = await fetch('http://localhost:3000/api/buses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(`¡Autobús ${formData.busId} registrado! Enviado a: ${formData.initialArea}`);
        setFormData({
          busId: '', busType: '', departureTime: '',
          requiredAreas: { 'Desfogue': false, 'Diesel': false, 'Ad-blue': false, 'Taller': false, 'Lavado Interior': false, 'Lavado Exterior': false },
          initialArea: '', observations: ''
        });
        setStep(1);
        fetchCapacities(); // Actualizamos las capacidades al instante
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Recepción de Unidades</h1>
        <p style={styles.headerSubtitle}>{step === 1 ? "Paso 1: Captura" : "Paso 2: Confirmación"}</p>
      </header>

      <div style={styles.formContainer}>
        {step === 1 && (
          <form onSubmit={handleNextStep} style={styles.form}>
            {/* ID, Type, Time Inputs...  */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Número de Autobús *</label>
              <input type="number" name="busId" value={formData.busId} onChange={handleInputChange} style={styles.input} required />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Tipo de Unidad *</label>
              <select name="busType" value={formData.busType} onChange={handleInputChange} style={styles.select} required>
                <option value="" disabled>Seleccione...</option>
                <option value="ADO">ADO</option><option value="OCC">OCC</option><option value="AU">AU</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Hora de salida *</label>
              <input type="time" name="departureTime" value={formData.departureTime} onChange={handleInputChange} style={styles.input} required />
            </div>

            <div style={styles.inputGroup}>
              <div style={styles.checklistHeader}>
                <label style={styles.label}>Checklist de Áreas Necesarias *</label>
                <button type="button" onClick={handleToggleAll} style={styles.btnText}>
                  {isAllSelected ? 'Desmarcar todas' : 'Marcar todas'}
                </button>
              </div>
              <div style={styles.checklistContainer}>
                {WORKFLOW_ORDER.map((area) => (
                  <label key={area} style={styles.checkboxLabel}>
                    <input type="checkbox" checked={formData.requiredAreas[area]} onChange={() => handleCheckboxChange(area)} style={styles.checkbox} />
                    {area}
                  </label>
                ))}
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Área Inicial Destino *</label>
              <select name="initialArea" value={formData.initialArea} onChange={handleInputChange} style={styles.select} required>
                <option value="" disabled>Seleccione destino...</option>
                {WORKFLOW_ORDER.map((area) => {
                  const occupancy = areaCapacities[area] || 0;
                  const isFull = occupancy >= MAX_CAPACITY;
                  return (
                    <option key={area} value={area} disabled={isFull}>
                      {area} (Ocupado: {occupancy}/{MAX_CAPACITY}) {isFull ? '- LLENO' : ''} {area === recommendedArea ? ' (Recomendada)' : ''}
                    </option>
                  );
                })}
                <option value="Espera">Espera {recommendedArea === 'Espera' ? ' (Recomendada por saturación)' : ''}</option>
              </select>
            </div>

            <button type="submit" style={{...styles.button, ...styles.btnPrimary}}>REVISAR DATOS</button>
          </form>
        )}

        {step === 2 && (
          <div style={styles.summaryContainer}>
            <h2 style={styles.summaryTitle}>Revisa la información</h2>
            
            <div style={styles.summaryCard}>
              <p><strong>Unidad:</strong> #{formData.busId}</p>
              <p><strong>Tipo:</strong> {formData.busType}</p>
              <p><strong>Hora de Salida:</strong> {formData.departureTime}</p>
              <p><strong>Áreas a visitar:</strong></p>
              <ul>
                {Object.keys(formData.requiredAreas)
                  .filter(area => formData.requiredAreas[area])
                  .map(area => <li key={area}>{area}</li>)
                }
              </ul>
              <p>
                <strong>Se enviará primero a:</strong> <span style={{color: '#D32F2F', fontWeight: 'bold'}}>{formData.initialArea}</span>
                {formData.initialArea !== recommendedArea && formData.initialArea !== 'Espera' && (
                  <span style={{fontSize: '14px', color: '#E65100', marginLeft: '10px'}}>(Modificado manualmente)</span>
                )}
              </p>
              <p><strong>Notas:</strong> {formData.observations || "Sin observaciones"}</p>
            </div>

            <div style={styles.buttonGroup}>
              <button 
                onClick={() => setStep(1)} 
                style={{...styles.button, ...styles.btnSecondary}}
              >
                MODIFICAR
              </button>
              <button 
                onClick={handleRegister} 
                style={{...styles.button, ...styles.btnSuccess}}
              >
                CONFIRMAR REGISTRO
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


const styles = {
  container: { fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f4f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { backgroundColor: '#D32F2F', color: '#ffffff', padding: '20px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
  headerTitle: { margin: 0, fontSize: '24px' },
  headerSubtitle: { margin: '5px 0 0 0', fontSize: '16px', opacity: 0.9 },
  formContainer: { padding: '20px', flex: 1 },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontWeight: 'bold', color: '#333', fontSize: '16px' },
  input: { padding: '15px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#000' },
  select: { padding: '15px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#000' },
  checklistHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnText: { background: 'none', border: 'none', color: '#1976D2', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline', padding: 0 },
  checklistContainer: { display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ccc' },
  checkboxLabel: { display: 'flex', alignItems: 'center', fontSize: '16px', color: '#000', cursor: 'pointer' },
  checkbox: { width: '20px', height: '20px', marginRight: '10px' },
  button: { padding: '16px', fontSize: '18px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', color: '#ffffff' },
  btnPrimary: { backgroundColor: '#1976D2' },
  summaryContainer: { display: 'flex', flexDirection: 'column', gap: '20px' },
  summaryCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '18px', lineHeight: '1.6', color: '#444', borderLeft: '6px solid #FFB74D' },
  buttonGroup: { display: 'flex', gap: '10px', marginTop: '10px' },
  btnSecondary: { backgroundColor: '#757575', flex: 1 },
  btnSuccess: { backgroundColor: '#388E3C', flex: 2 }
};