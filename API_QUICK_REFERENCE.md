# API Integration - Quick Reference Guide

## Quick Start for Developers

### Environment Setup
```bash
# Already configured in src/.env.local
VITE_API_URL=https://ado-project.onrender.com
VITE_API_TIMEOUT=10000
```

### Importing Services
```javascript
// Authentication
import authService from '@/services/authService.js';

// Buses
import camionesService from '@/services/camionesService.js';

// Areas
import areasService from '@/services/areasService.js';

// History
import historialService from '@/services/historialService.js';

// API Client (for custom requests)
import apiClient from '@/services/apiClient.js';
```

## Common Usage Patterns

### Fetch Buses
```javascript
const camiones = await camionesService.getAllCamiones();
```

### Register New Bus
```javascript
const nuevoCamion = {
  codigo: 'ADO-1001',
  tipo: 'Ejecutivo',
  conductor: 'Juan Pérez',
  origen: 'CDMX',
  destino: 'Oaxaca',
  area: 'Desfogue',
  ruta: ['Desfogue', 'Diesel', 'Descanso']
};

const resultado = await camionesService.createCamion(nuevoCamion);
```

### Move Bus to Area
```javascript
await camionesService.moveCamionToArea(camionId, 'Diesel');
```

### Log Movement to History
```javascript
await historialService.logMovimiento({
  unidad: 'ADO-001',
  fecha: '2026-06-29',
  hora: '10:30:00',
  mensaje: 'Movimiento de Desfogue a Diesel'
});
```

### Create Maintenance Area
```javascript
const newArea = {
  id: 'Bahía 1',
  capacidad: 4
};

await areasService.createArea(newArea);
```

### Login
```javascript
const response = await authService.login('1001', 'password123');
// Returns: { token, usuario: {...} }
```

### Check Authentication
```javascript
if (authService.isAuthenticated()) {
  // User is logged in
}
```

## Error Handling Pattern
```javascript
try {
  const resultado = await camionesService.getAllCamiones();
  // Use resultado
} catch (error) {
  console.error('Error:', error.message);
  setError(error.message);
}
```

## API Response Format

Services handle both response formats:
```javascript
// Format 1: { data: [...] }
const buses = await camionesService.getAllCamiones();

// Format 2: Direct array
// Both work seamlessly
```

## Loading & Error States

Always handle async operations with loading states:
```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const handleSubmit = async () => {
  setLoading(true);
  setError("");
  try {
    // API call here
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

## Available Endpoints

### Authentication
- `POST /api/auth/login` → `authService.login(empleado, contrasena)`

### Buses
- `GET /api/camiones` → `getAllCamiones()`
- `POST /api/camiones` → `createCamion(data)`
- `PUT /api/camiones/:id` → `updateCamion(id, data)`
- `PUT /api/camiones/:id/reubicacion` → `reubicacionForzada(id, areaId)`

### Areas
- `GET /api/areas` → `getAllAreas()`
- `POST /api/areas` → `createArea(data)`
- `PUT /api/areas/:id` → `updateArea(id, data)`
- `DELETE /api/areas/:id` → `deleteArea(id)`

### History
- `GET /api/historial` → `getHistorial(filters)`
- `POST /api/historial` → `logMovimiento/Alerta/Completado/Registro/Salida(data)`

## Token Management

The token is automatically managed:
```javascript
// After login, token is stored
// After logout, token is cleared
// Token is automatically included in all requests

// Manual access if needed:
const token = authService.getToken();
authService.logout(); // Clears token
```

## Mock Data Fallback

If API is unavailable, the app automatically falls back to mock data:
- 3 test buses in `src/pages/Patio/CamionArea.json`
- 7 maintenance areas
- Useful for development/testing

## Debugging

Enable API debugging:
```javascript
// In browser console
localStorage.setItem('debug', 'api');
// Check DevTools Network tab for requests
// Check console logs for errors
```

Check current token:
```javascript
localStorage.getItem('authToken');
```

## Performance Notes

- Timeout set to 10 seconds per request
- All requests use async/await (no callbacks)
- Error handling is centralized in each service
- Services automatically handle JSON serialization

## Best Practices

1. **Always use try-catch** when calling services
2. **Show loading states** during async operations
3. **Display user-facing errors** from `error.message`
4. **Log errors to console** for debugging
5. **Disable form inputs** while loading
6. **Clear error messages** before new requests
7. **Use services, not apiClient directly** for consistency
8. **Pass complete objects** when creating/updating

## Testing the Integration

```javascript
// Test in browser console
import camionesService from './src/services/camionesService.js'
camionesService.getAllCamiones().then(console.log).catch(console.error)
```

