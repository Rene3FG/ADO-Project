import { useState, useEffect } from 'react';

export default function OperatorDashboard() {
  const [busesQueue, setBusesQueue] = useState([]);
  const [areaCapacities, setAreaCapacities] = useState({});
  const [nextAreas, setNextAreas] = useState({});
  const assignedArea = "Lavado Interior"; 
  const MAX_CAPACITY = 3;

  const WORKFLOW_ORDER = [
    'Desfogue', 'Diesel', 'Ad-blue', 'Taller', 'Lavado Interior', 'Lavado Exterior'
  ];

  const fetchData = async () => {
    try {
      // Fetch buses
      const resBuses = await fetch(`http://localhost:3000/api/buses/${assignedArea}`);
      const dataBuses = await resBuses.json();
      setBusesQueue(dataBuses);

      // Fetch capacities
      const resCap = await fetch('http://localhost:3000/api/areas/capacity');
      const dataCap = await resCap.json();
      setAreaCapacities(dataCap);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [assignedArea]);

  // Smart Recommendation for Operator
  const getSmartNextArea = (bus) => {
    const safeCompleted = bus.completedAreas || [];
    
    //  Evaluate normal workflow areas
    for (const area of WORKFLOW_ORDER) {
      if (bus.requiredAreas.includes(area) && !safeCompleted.includes(area) && area !== bus.currentArea) {
        const currentOccupancy = areaCapacities[area] || 0;
        if (currentOccupancy < MAX_CAPACITY) {
          return area; // Found an empty required area
        }
      }
    }

    //  Are all required areas completed?
    const isFullyCompleted = bus.requiredAreas.every(area => safeCompleted.includes(area) || area === bus.currentArea);
    if (isFullyCompleted) return 'Salida';

    //  If there are pending areas but all are full, send to Espera
    return 'Espera';
  };

  useEffect(() => {
    const defaultNext = {};
    busesQueue.forEach(bus => {
      defaultNext[bus.busId] = getSmartNextArea(bus);
    });
    setNextAreas(defaultNext);
  }, [busesQueue, areaCapacities]);

  const handleSelectChange = (busId, value) => {
    setNextAreas(prev => ({ ...prev, [busId]: value }));
  };

  const handleStartService = (busId) => { alert(`Servicio INICIADO para autobús ${busId}`); };

  const handleMoveToNextArea = async (busId) => {
    const targetArea = nextAreas[busId];
    if (!targetArea) return alert("Por favor, selecciona destino.");

    try {
      const response = await fetch(`http://localhost:3000/api/buses/${busId}/move`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextArea: targetArea })
      });
      if (response.ok) {
        alert(`Autobús ${busId} enviado a ${targetArea}`);
        fetchData(); 
      }
    } catch (error) {
      console.error("Error moving bus:", error);
    }
  };

  const currentOccupancy = areaCapacities[assignedArea] || 0;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Área: {assignedArea}</h1>
        <p style={styles.headerSubtitle}>
          Ocupación: {currentOccupancy}/{MAX_CAPACITY} camiones
        </p>
      </header>

      <div style={styles.listContainer}>
        {busesQueue.length === 0 ? (
          <p style={styles.emptyText}>No hay unidades en la cola.</p>
        ) : (
          busesQueue.map((bus) => {
            const recommendedArea = getSmartNextArea(bus);
            const safeCompleted = bus.completedAreas || [];

            return (
              <div key={bus.busId} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h2 style={styles.busId}>Unidad #{bus.busId}</h2>
                  {/*  Tipo de Autobús */}
                  <span style={styles.busType}>{bus.busType}</span>
                </div>
                
                <div style={styles.cardBody}>
                  {/*Estado, Hora límite y Prioridad */}
                  <p><strong>Estado:</strong> {bus.currentStatus}</p>
                  <p><strong>Hora límite:</strong> {bus.departureTime}</p>
                  {bus.isPriority && (
                    <p style={{ color: '#D32F2F', fontWeight: 'bold' }}>¡PRIORIDAD ALTA!</p>
                  )}

                  <div style={styles.routeContainer}>
                    <p style={styles.routeLabel}>Ruta asignada:</p>
                    <div style={styles.boxesWrapper}>
                      {bus.requiredAreas.map(area => {
                        let boxStyle = safeCompleted.includes(area) ? styles.boxCompleted : 
                                       (bus.currentArea === area ? styles.boxCurrent : styles.boxPending);
                        return <div key={area} style={{...styles.areaBox, ...boxStyle}}>{area}</div>;
                      })}
                    </div>
                  </div>
                  
                  {/*Barra visual de porcentaje */}
                  <div style={styles.progressContainer}>
                    <p style={{ margin: '0 0 5px 0' }}><strong>Avance:</strong> {bus.progressPercentage}%</p>
                    <div style={styles.progressBarBackground}>
                      <div style={{...styles.progressBarFill, width: `${bus.progressPercentage}%`}}></div>
                    </div>
                  </div>
                </div>

                <button style={{...styles.button, ...styles.btnStart, marginBottom: '15px'}} onClick={() => handleStartService(bus.busId)}>
                  INICIAR SERVICIO
                </button>

                <div style={styles.transferSection}>
                  <label style={styles.label}>Siguiente estación:</label>
                  <select style={styles.select} value={nextAreas[bus.busId] || ""} onChange={(e) => handleSelectChange(bus.busId, e.target.value)}>
                    <option value="" disabled>Seleccione un área...</option>
                    {WORKFLOW_ORDER.map(area => {
                      const occupancy = areaCapacities[area] || 0;
                      const isFull = occupancy >= MAX_CAPACITY;
                      return (
                        <option key={area} value={area} disabled={isFull}>
                          {area} ({occupancy}/{MAX_CAPACITY}) {isFull ? '- LLENO' : ''} {area === recommendedArea ? '(Sugerido)' : ''}
                        </option>
                      );
                    })}
                    <option value="Espera">Espera {recommendedArea === 'Espera' ? '(Por Saturación)' : ''}</option>
                    <option value="Salida">Salida {recommendedArea === 'Salida' ? '(No hay espacio en ningun area)' : ''}</option>
                  </select>
                  <button style={{...styles.button, ...styles.btnEnd}} onClick={() => handleMoveToNextArea(bus.busId)}>
                    FINALIZAR SERVICIO Y ENVIAR
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


const styles = {
  container: { fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f4f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { backgroundColor: '#D32F2F', color: '#ffffff', padding: '20px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
  headerTitle: { margin: 0, fontSize: '24px' },
  headerSubtitle: { margin: '5px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#FFEB3B' }, // Resaltado en amarillo
  listContainer: { padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' },
  card: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderLeft: '6px solid #1976D2' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eeeeee', paddingBottom: '10px', marginBottom: '10px' },
  busId: { margin: 0, fontSize: '22px', color: '#333333' },
  cardBody: { fontSize: '16px', color: '#555555', marginBottom: '15px', lineHeight: '1.5' },
  routeContainer: { marginTop: '15px', marginBottom: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' },
  routeLabel: { margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '14px', color: '#333' },
  boxesWrapper: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  areaBox: { padding: '6px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' },
  boxCompleted: { backgroundColor: '#388E3C', color: '#fff' }, 
  boxCurrent: { backgroundColor: '#FFB74D', color: '#000' },   
  boxPending: { backgroundColor: '#E0E0E0', color: '#555' },   
  progressContainer: { marginTop: '10px' },
  progressBarBackground: { width: '100%', backgroundColor: '#e0e0e0', borderRadius: '10px', height: '10px', overflow: 'hidden' },
  progressBarFill: { backgroundColor: '#388E3C', height: '100%', transition: 'width 0.3s ease' },
  button: { width: '100%', padding: '15px', fontSize: '18px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#ffffff' },
  btnStart: { backgroundColor: '#388E3C' },
  btnEnd: { backgroundColor: '#1976D2', marginTop: '10px' },
  transferSection: { backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginTop: '10px', border: '1px solid #eeeeee' },
  label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' },
  select: { width: '100%', padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#000' },
  emptyText: { textAlign: 'center', color: '#777', fontSize: '18px', marginTop: '20px' }
};