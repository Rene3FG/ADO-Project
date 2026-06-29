# ADO Project - API Integration Summary

**Date:** 2026-06-29  
**Branch:** diseno  
**Status:** API Integration Complete

## Overview
All frontend components have been integrated with API services. The application now communicates with the backend API at `https://ado-project.onrender.com` for all data operations.

## Environment Configuration

**File:** `src/.env.local`
```
VITE_API_URL=https://ado-project.onrender.com
VITE_API_TIMEOUT=10000
```

## API Services Architecture

### 1. **API Client** (`src/services/apiClient.js`)
- Centralized HTTP request handler
- Automatic token management (Bearer token)
- Request timeout (10s default)
- Error handling
- JSON serialization

**Methods:**
- `get(endpoint, options)`
- `post(endpoint, data, options)`
- `put(endpoint, data, options)`
- `patch(endpoint, data, options)`
- `delete(endpoint, options)`
- `setToken(token)` - Store JWT
- `getToken()` - Retrieve JWT

### 2. **Auth Service** (`src/services/authService.js`)
**Endpoints:**
- `POST /api/auth/login` - Authenticate employee

**Methods:**
- `login(empleado, contrasena)` - Returns `{ token, usuario }`
- `logout()` - Clear token
- `isAuthenticated()` - Check if logged in
- `getToken()` - Get current token

### 3. **Camiones (Buses) Service** (`src/services/camionesService.js`)
**Endpoints:**
- `GET /api/camiones` - Fetch all buses
- `GET /api/camiones/:id` - Fetch single bus
- `POST /api/camiones` - Create new bus
- `PUT /api/camiones/:id` - Update bus (location, status)
- `PUT /api/camiones/:id/reubicacion` - Forced relocation (admin)
- `DELETE /api/camiones/:id` - Delete bus

**Methods:**
- `getAllCamiones()` - Fetch all
- `getCamionById(id)` - Fetch one
- `createCamion(camion)` - Create
- `updateCamion(id, updates)` - Update fields
- `moveCamionToArea(id, areaId)` - Move bus
- `finalizarCamion(id)` - Complete route
- `sacarCamion(id)` - Exit yard
- `reubicacionForzada(id, areaId)` - Admin force move
- `deleteCamion(id)` - Delete

### 4. **Areas Service** (`src/services/areasService.js`)
**Endpoints:**
- `GET /api/areas` - Fetch all maintenance areas
- `GET /api/areas/:id` - Fetch single area
- `POST /api/areas` - Create new area
- `PUT /api/areas/:id` - Update area
- `DELETE /api/areas/:id` - Delete area

**Methods:**
- `getAllAreas()` - Fetch all
- `getAreaById(id)` - Fetch one
- `createArea(area)` - Create { id, capacidad }
- `updateArea(id, updates)` - Update fields
- `deleteArea(id)` - Delete
- `getAreaCapacity(id, camiones)` - Calculate occupancy

### 5. **Historial (History) Service** (`src/services/historialService.js`)
**Endpoints:**
- `GET /api/historial` - Fetch history
- `POST /api/historial` - Log event

**Methods:**
- `getHistorial(filters)` - Fetch with filters
- `getHistorialPorUnidad(unidad)` - Fetch by bus
- `logMovimiento(movimiento)` - Log movement
- `logAlerta(alerta)` - Log alert
- `logCompletado(completado)` - Log completion
- `logRegistro(registro)` - Log registration
- `logSalida(salida)` - Log departure

## Component Integration

### Login (`src/pages/login/login.jsx`)
**Status:** ✅ Fully Integrated

**Features:**
- Form state management (numeroEmpleado, contrasena)
- API call to `POST /api/auth/login`
- Loading state during request
- Error message display
- Token storage (automatic via authService)

**Data Flow:**
1. User enters credentials
2. Form submission triggers `authService.login()`
3. API returns token and user data
4. Token stored in localStorage
5. Success/error feedback to user

### Registration (`src/pages/Registro/Registro.jsx`)
**Status:** ✅ Fully Integrated

**Features:**
- Multi-step form (4 steps)
- API call to `POST /api/camiones`
- Historial logging to `POST /api/historial`
- Form validation
- Loading state and error handling
- Form reset after successful submission

**Data Flow:**
1. User fills registration form (4 steps)
2. On confirmation, calls `camionesService.createCamion()`
3. If successful, logs to history via `historialService.logRegistro()`
4. Local state updated for UI
5. Form cleared and reset to step 1

### Patio Dashboard (`src/pages/Patio/DropDrag.jsx`)
**Status:** ✅ Fully Integrated

**Features:**
- Initial data load from API (useEffect on mount)
- Fetch buses via `GET /api/camiones`
- Fetch areas via `GET /api/areas`
- Fallback to mock data if API fails
- Drag-drop bus movements with API update
- Movement logging to historial
- Time-based alerts with historial logging
- Route completion with API update
- Bus departure with API update
- Reports generated from API data

**Data Flow:**
1. Component mounts → Fetch buses and areas
2. User drags bus → `moveCamionToArea()` → API update + historial
3. Bus time alert → `logAlerta()` → historial
4. Route completion → `finalizarCamion()` → API update + historial
5. Bus departure → `sacarCamion()` → API update + historial

### Configuration (`src/pages/ConfAvanz/ConfAvaz.jsx`)
**Status:** ✅ Fully Integrated

**Features - Areas Management:**
- Create area: `POST /api/areas`
- Delete area: `DELETE /api/areas/:id`
- Validation (no duplicates, capacity)
- Loading state and error handling

**Features - Forced Relocation:**
- Forced move: `PUT /api/camiones/:id/reubicacion`
- Capacity validation
- Loading state and error handling

**Data Flow:**
1. User selects admin function
2. For areas: Create/Delete triggers API calls
3. For relocation: Select bus and area → `reubicacionForzada()` → API update
4. Local state updated for UI

### Reports (`src/pages/Reportes/Reportes.jsx`)
**Status:** ✅ Display Ready

**Features:**
- Receives pre-formatted data from DropDrag
- Shows KPIs (total, completed, active)
- Displays bus table with status
- No direct API calls (uses data from parent)

## Data Flow Diagram

```
Frontend Components
    ↓
Services Layer (camionesService, areasService, historialService, authService)
    ↓
API Client (apiClient.js)
    ↓
Backend API (https://ado-project.onrender.com)
    ↓
Database/External Services
```

## Error Handling

All services include try-catch blocks with:
- Console error logging
- User-facing error messages
- Graceful fallback (mock data if API fails)
- Loading states during async operations

## Local Fallback

If API fails, DropDrag component automatically falls back to mock data from `CamionArea.json`:
- 3 test buses (ADO-001, ADO-002, ADO-003)
- 7 maintenance areas

## Authentication Flow

1. User logs in via login form
2. API returns JWT token
3. Token stored in localStorage
4. All subsequent API calls include token in Authorization header
5. Token persists across page reloads
6. Logout clears token

## Next Steps for Backend

The backend API must implement these endpoints:

```
Auth:
  POST /api/auth/login
  
Buses:
  GET /api/camiones
  GET /api/camiones/:id
  POST /api/camiones
  PUT /api/camiones/:id
  PUT /api/camiones/:id/reubicacion
  DELETE /api/camiones/:id
  
Areas:
  GET /api/areas
  GET /api/areas/:id
  POST /api/areas
  PUT /api/areas/:id
  DELETE /api/areas/:id
  
History:
  GET /api/historial
  POST /api/historial
```

## Testing Endpoints

To test the integration locally:

1. Check env variables:
   ```bash
   cat src/.env.local
   ```

2. Monitor API calls in browser DevTools → Network tab

3. Check localStorage for token:
   ```javascript
   localStorage.getItem('authToken')
   ```

4. Test API client directly:
   ```javascript
   import apiClient from './services/apiClient.js'
   await apiClient.get('/api/camiones')
   ```

## Files Modified/Created

**Created:**
- `src/.env.local` - Environment config
- `src/services/apiClient.js` - Base HTTP client
- `src/services/authService.js` - Authentication
- `src/services/camionesService.js` - Bus management
- `src/services/areasService.js` - Area management
- `src/services/historialService.js` - History logging

**Modified (UI unchanged):**
- `src/pages/login/login.jsx` - Added API integration
- `src/pages/Registro/Registro.jsx` - Added API integration
- `src/pages/Patio/DropDrag.jsx` - Added API integration
- `src/pages/ConfAvanz/ConfAvaz.jsx` - Added API integration

**Unchanged:**
- All CSS files (styling preserved)
- Component structure (layout preserved)
- UI/UX (visual design preserved)

## Notes

- All forms remain visually identical
- Component distribution unchanged
- Colors and styling preserved
- All API calls use modern async/await syntax
- Error messages display inline without changing layout
- Loading states added via disabled attributes on buttons/inputs
- Mock data fallback ensures app works even if API is down
