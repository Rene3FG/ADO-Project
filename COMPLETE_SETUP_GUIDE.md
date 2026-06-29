# ADO Project - Complete Setup & Integration Guide

**Date:** 2026-06-29  
**Branch:** diseno  
**Status:** ✅ Complete - Ready for Backend Development

---

## Overview

The ADO bus management system frontend is now **fully integrated** with:
- ✅ React Router for navigation
- ✅ Authentication context for global auth state
- ✅ Protected routes requiring login
- ✅ API client with token management
- ✅ Service layer for all backend calls
- ✅ UI components for user feedback
- ✅ Toast notifications
- ✅ Modal windows
- ✅ Loading states
- ✅ Error handling

---

## Architecture

```
Frontend (React + Vite)
    ↓
[BrowserRouter + AuthProvider]
    ↓
App Component (Route Configuration)
    ↓
Protected Routes (Auth Guard)
    ↓
Components (Login, Dashboard/DropDrag, Registro, etc.)
    ↓
Hooks (useAuth, useNavigate)
    ↓
Services (Auth, Camiones, Areas, Historial)
    ↓
API Client (Token Management + HTTP)
    ↓
Backend API: https://ado-project.onrender.com
```

---

## New Files Created

### Context
- **`src/context/AuthContext.jsx`** (1.5 KB)
  - Global authentication state management
  - Tracks: user, isAuthenticated, loading
  - Methods: login(), logout()
  - Hook: useAuth()

### Components
- **`src/components/ProtectedRoute.jsx`** (0.5 KB)
  - Route guard component
  - Redirects unauthenticated users to /login
  - Shows loading state while checking auth

- **`src/components/Toast.jsx`** (2 KB)
  - Toast notification component
  - Types: success, error, info
  - Auto-dismiss after 4 seconds
  - Dismissible with close button

- **`src/components/LoadingSpinner.jsx`** (0.9 KB)
  - Loading indicator with animation
  - Customizable message
  - Centered display

- **`src/components/BusDetailModal.jsx`** (5.6 KB)
  - Modal for viewing bus details
  - Double-click bus to open
  - Shows: código, tipo, área, conductor, origen, destino, ruta
  - Styled with animations

---

## Modified Files

### App.jsx (Complete Rewrite)
**Changes:**
- Removed static component rendering
- Implemented React Router with Routes
- Added route configuration:
  - `/login` - Only for unauthenticated users
  - `/dashboard` - Protected route (DropDrag component)
  - `/` - Redirect based on auth state
- Loads auth state and shows spinner while checking

**Key Code:**
```javascript
<Routes>
  <Route path="/login" element={...} />
  <Route path="/dashboard" element={<ProtectedRoute><DropDrag /></ProtectedRoute>} />
  <Route path="/" element={<Navigate to={...} />} />
</Routes>
```

### main.jsx (Enhanced)
**Changes:**
- Wrapped with `BrowserRouter` for routing
- Wrapped with `AuthProvider` for global auth state
- Imports FontSource Inter

**Before:**
```javascript
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**After:**
```javascript
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

### login.jsx (Enhanced with Auth)
**Changes:**
- Added `useAuth()` hook for auth context
- Added `useNavigate()` for redirect
- Integrated `Toast` component for feedback
- Auto-redirect to dashboard after login
- Better error styling
- Loading state management
- Form validation before API call

**New Features:**
- Success toast on login
- Error toast on failure
- Redirect to dashboard after successful login
- User feedback in header

### DropDrag.jsx (Fully Enhanced)
**Changes:**
- Added `useAuth()` hook for user info
- Added `useNavigate()` for logout redirect
- Integrated `BusDetailModal` component
- Integrated `Toast` component for all actions
- Proper logout function with navigation
- Show user name in header
- Modal on double-click bus card
- Toast notifications for:
  - Bus added
  - Bus moved
  - Route completed
  - Bus departed
  - Logout success
  - API errors

**New Methods:**
- `handleLogout()` - Clear auth and navigate to login

**Enhanced UI:**
- User name in header subtitle
- Logout button with user info tooltip
- Toast notifications for all operations
- Modal for viewing full bus details

---

## Authentication Flow

```
1. User visits /
   ├─ If authenticated → Redirect to /dashboard
   └─ If not → Redirect to /login

2. User at /login
   ├─ Enters credentials
   ├─ Clicks "Entrar al sistema"
   └─ POST /api/auth/login
      ├─ Success:
      │  ├─ Store token in localStorage
      │  ├─ Update AuthContext
      │  ├─ Show success toast
      │  └─ Redirect to /dashboard
      └─ Error:
         ├─ Show error toast
         └─ Stay on /login

3. At /dashboard
   ├─ Component mounts
   ├─ Fetch buses & areas from API
   ├─ Display with drag-drop interface
   ├─ All API calls include Bearer token
   └─ Logout:
      ├─ Clear token
      ├─ Update AuthContext
      ├─ Show logout toast
      └─ Redirect to /login
```

---

## Key Features

### 1. Protected Routes
```javascript
<Route path="/dashboard" element={
  <ProtectedRoute>
    <DropDrag />
  </ProtectedRoute>
} />
```
- Only authenticated users can access
- Automatic redirect to login if not authenticated
- Shows loading spinner while checking auth

### 2. Token Management
- Automatic storage in localStorage
- Included in all API requests as `Authorization: Bearer {token}`
- Persists across page reloads
- Cleared on logout

### 3. Toast Notifications
```javascript
<Toast
  message="Success message"
  type="success" // success, error, info
  onClose={() => setToast(null)}
  duration={4000}
/>
```

### 4. Auth Context
```javascript
const { user, isAuthenticated, loading, login, logout } = useAuth();
```

### 5. Loading States
- Form inputs disabled during API calls
- Buttons show "Validando..." / "Registrando..." messages
- Prevents double-submission

### 6. Modal Windows
```javascript
<BusDetailModal
  camion={selectedBus}
  onClose={() => setCamionSeleccionado(null)}
/>
```

---

## How to Use

### For Users
1. Visit the app
2. Login with employee number and password
3. Access dashboard with bus management features
4. Double-click a bus to see full details
5. Drag buses between areas
6. Notifications appear for all actions
7. Click logout to exit

### For Developers

#### Access Auth State
```javascript
import { useAuth } from '@/context/AuthContext.jsx';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  // Use auth data
}
```

#### Show Toast
```javascript
import Toast from '@/components/Toast.jsx';

const [toast, setToast] = useState(null);

const handleAction = () => {
  // Do something
  setToast({
    message: 'Action completed',
    type: 'success'
  });
};
```

#### Call Protected API
```javascript
import camionesService from '@/services/camionesService.js';

try {
  const response = await camionesService.getAllCamiones();
  // Token is automatically included
} catch (error) {
  console.error(error);
}
```

#### Navigate After Action
```javascript
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/dashboard');
  };
}
```

---

## Dependencies

**New:**
- `react-router-dom@^7.0` - For routing and navigation

**Already Installed:**
- `react@^19.2.6`
- `react-dom@^19.2.6`
- `react-icons@^5.6.0`

**Installation:**
```bash
npm install
# React Router is already in package-lock.json
```

---

## Project Structure

```
src/
├── components/              # Reusable UI components
│   ├── BusDetailModal.jsx  # Modal for bus details
│   ├── LoadingSpinner.jsx  # Loading indicator
│   ├── ProtectedRoute.jsx  # Route guard
│   └── Toast.jsx           # Toast notifications
│
├── context/                 # React Context
│   └── AuthContext.jsx     # Authentication state
│
├── services/                # API service layer
│   ├── apiClient.js        # HTTP client
│   ├── authService.js      # Auth methods
│   ├── camionesService.js  # Bus methods
│   ├── areasService.js     # Area methods
│   └── historialService.js # History methods
│
├── pages/                   # Page components
│   ├── login/
│   │   ├── login.jsx       # Login form
│   │   └── login.css
│   ├── Patio/
│   │   ├── DropDrag.jsx    # Main dashboard
│   │   ├── DropDrag.css
│   │   ├── TarjetaInfo.jsx
│   │   └── CamionArea.json # Mock data
│   ├── Registro/
│   │   ├── Registro.jsx    # Bus registration
│   │   └── Resgistro.css
│   ├── Reportes/
│   │   ├── Reportes.jsx    # Reports view
│   │   └── Reportes.css
│   └── ConfAvanz/
│       ├── ConfAvaz.jsx    # Admin config
│       └── ConfAvanz.css
│
├── App.jsx                 # Main router
├── main.jsx                # Entry point
├── App.css
└── index.css
```

---

## Environment Setup

**File:** `src/.env.local` (git-ignored)
```
VITE_API_URL=https://ado-project.onrender.com
VITE_API_TIMEOUT=10000
```

**File:** `src/.env.example` (for team reference)
```
VITE_API_URL=https://ado-project.onrender.com
VITE_API_TIMEOUT=10000
```

---

## API Endpoints Expected

### Authentication
- `POST /api/auth/login` → { token, usuario }

### Buses
- `GET /api/camiones`
- `POST /api/camiones`
- `PUT /api/camiones/:id`
- `PUT /api/camiones/:id/reubicacion`
- `DELETE /api/camiones/:id`

### Areas
- `GET /api/areas`
- `POST /api/areas`
- `PUT /api/areas/:id`
- `DELETE /api/areas/:id`

### History
- `GET /api/historial`
- `POST /api/historial`

---

## Error Handling

All errors are handled with:
1. **Console logging** for debugging
2. **Toast notifications** for user feedback
3. **Inline error messages** in forms
4. **Graceful fallback** to mock data if API unavailable

---

## Testing Checklist

- [ ] Login page loads and is accessible
- [ ] Can login with credentials
- [ ] Token is stored in localStorage
- [ ] Redirects to dashboard after login
- [ ] User name shows in header
- [ ] Can navigate between dashboard tabs
- [ ] Logout clears token and redirects to login
- [ ] Cannot access dashboard without login
- [ ] Page reload keeps user logged in
- [ ] API calls include Bearer token
- [ ] Toast notifications appear
- [ ] Error messages display properly
- [ ] Modal opens on double-click bus
- [ ] Modal closes properly
- [ ] Loading spinner shows during data fetch

---

## Next Steps

1. **Backend Development**
   - Implement all listed API endpoints
   - Add JWT token validation
   - Create database models
   - Deploy to production

2. **Frontend Enhancements** (Optional)
   - Add form validation library
   - Add state management (Zustand, Redux)
   - Add unit tests
   - Add E2E tests
   - Improve performance with React Query

3. **Deployment**
   - Build: `npm run build`
   - Test: `npm run preview`
   - Deploy to production

---

## Commits

**Commit 1 (f352362):** API integration
- 5 services created
- 4 components integrated with API
- Environment setup
- Documentation

**Commit 2 (6271b89):** Routing & Auth
- React Router setup
- AuthContext implementation
- Protected routes
- UI components
- Toast notifications
- Logout functionality

---

## Troubleshooting

**Issue:** "useAuth must be used within AuthProvider"
- **Fix:** Ensure AuthProvider wraps your component tree in main.jsx

**Issue:** "Cannot find module" errors
- **Fix:** Check file paths - use `/` not `\` and include `.jsx` extension

**Issue:** Token not persisting
- **Fix:** Check browser localStorage in DevTools
- **Fix:** Ensure API login returns a `token` field

**Issue:** API calls failing
- **Fix:** Check DevTools Network tab for requests
- **Fix:** Verify backend is running at `https://ado-project.onrender.com`
- **Fix:** Check API response format

**Issue:** "Not authenticated" even after login
- **Fix:** Verify token is in localStorage: `localStorage.getItem('authToken')`
- **Fix:** Check API login response format

---

## Contact & Support

For issues or questions:
1. Check console logs for errors
2. Open DevTools → Network tab to inspect API calls
3. Check localStorage for token: `localStorage.getItem('authToken')`
4. Review the documentation files in the root directory

---

## Summary

This complete setup includes:
- ✅ Full routing system (React Router v7)
- ✅ Global authentication state (Context API)
- ✅ Protected routes requiring login
- ✅ API client with token management
- ✅ 5 service layers for backend communication
- ✅ 4 reusable UI components
- ✅ Toast notifications
- ✅ Modal windows
- ✅ Loading states
- ✅ Error handling
- ✅ Logout functionality
- ✅ User context display
- ✅ Graceful fallback to mock data

**Status:** Ready for backend development!

