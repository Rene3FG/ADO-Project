const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = './db.json';

// Función auxiliar para leer la BD
const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
// Función auxiliar para escribir en la BD
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
 
// 1. endpoint para obtener camiones por area
app.get('/api/buses/:area', (req, res) => {
  const { area } = req.params;
  const db = readDB();
  const busesInArea = db.buses.filter(bus => bus.currentArea === area);
  res.json(busesInArea);
});

// 1.5 ENDPOINT: Obtener la ocupación actual de todas las áreas
app.get('/api/areas/capacity', (req, res) => {
  const db = readDB();
  
  // Inicializamos las capacidades en 0
  const capacities = {
    'Desfogue': 0, 'Diesel': 0, 'Ad-blue': 0,
    'Taller': 0, 'Lavado Interior': 0, 'Lavado Exterior': 0, 'Espera': 0
  };

  // Contamos cuántos camiones hay en cada área
  db.buses.forEach(bus => {
    // Solo contamos los que no han salido del sistema
    if (bus.currentArea !== 'Salida') {
      if (capacities[bus.currentArea] !== undefined) {
        capacities[bus.currentArea]++;
      } else {
        capacities[bus.currentArea] = 1;
      }
    }
  });

  res.json(capacities);
});

// 2. ENDPOINT: Mover camión a otra área y actualizar porcentaje automáticamente
app.post('/api/buses/:id/move', (req, res) => {
  const { id } = req.params;
  const { nextArea } = req.body; 
  
  const db = readDB();
  const busIndex = db.buses.findIndex(bus => bus.busId === id);
  
  if (busIndex !== -1) {
    const bus = db.buses[busIndex];

    // Si el área actual estaba en sus áreas requeridas y no está en las completadas, la agregamos
    if (bus.requiredAreas.includes(bus.currentArea) && !bus.completedAreas.includes(bus.currentArea)) {
      bus.completedAreas.push(bus.currentArea);
    }
    
    // Lo movemos a la nueva área
    bus.currentArea = nextArea;

    // Calculamos el nuevo porcentaje de avance real
    const totalRequired = bus.requiredAreas.length;
    const totalCompleted = bus.completedAreas.length;
    bus.progressPercentage = totalRequired === 0 ? 100 : Math.round((totalCompleted / totalRequired) * 100);

    writeDB(db);
    res.json({ message: "Unidad movida con éxito", bus: db.buses[busIndex] });
  } else {
    res.status(404).json({ error: "Autobús no encontrado" });
  }
});

// 3. ENDPOINT: Registrar un nuevo camión
app.post('/api/buses', (req, res) => {
  const { busId, busType, departureTime, requiredAreas, initialArea, observations } = req.body;
  const db = readDB();

  const now = new Date();
  const [hours, minutes] = departureTime.split(':');
  const depDate = new Date();
  depDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  if (depDate < now) depDate.setDate(depDate.getDate() + 1);
  const isPriority = ((depDate - now) / (1000 * 60)) <= 60;

  const newBus = {
    busId, 
    busType,
    departureTime,
    requiredAreas, 
    completedAreas: [], //Arreglo para guardar las áreas por las que ya pasó
    currentStatus: "En Espera",
    arrivalTime: new Date().toLocaleTimeString('es-MX', { hour12: false }),
    currentArea: initialArea,
    progressPercentage: 0,
    isPriority,
    observations: observations || null
  };

  db.buses.push(newBus);
  writeDB(db);
  res.status(201).json({ message: "Unidad registrada con éxito", bus: newBus });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(` Servidor backend corriendo en http://localhost:${PORT}`);
});