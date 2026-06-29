# ADO Project - Complete Testing Guide

**Branch:** `testing/full-integration`  
**Date:** 2026-06-29  
**Status:** Ready for Full Integration Testing

---

## Overview

This branch contains the **complete, fully integrated** ADO bus management system frontend:
- ✅ React Router for navigation
- ✅ Authentication with JWT tokens
- ✅ Protected routes
- ✅ API client with all services
- ✅ UI components (modals, toasts, spinners)
- ✅ Error handling
- ✅ Mock data fallback

---

## Quick Start

### 1. Setup Environment

```bash
# Clone and navigate to project
cd /home/bebecho/ADO-Project
git checkout testing/full-integration

# Install dependencies
npm install

# Verify React Router installed
npm list react-router-dom
```

### 2. Start Development Server

```bash
# Start Vite dev server
npm run dev

# App will be at: http://localhost:5173
```

### 3. Test Login Flow

**Without Backend (Mock Data):**
```
1. Open http://localhost:5173
2. You should be redirected to /login
3. Try any credentials (e.g., 1001 / password)
4. Should show error toast (API not available)
5. App will fallback to mock data
6. You can still access dashboard with mock buses
```

**With Backend:**
```
1. Ensure backend is running at https://ado-project.onrender.com
2. Backend must implement: POST /api/auth/login
3. Login with valid credentials
4. Token stored in localStorage
5. Redirect to /dashboard
6. See real buses from API
```

---

## Testing Scenarios

### A. Authentication & Routing

#### Scenario 1: Login Page Accessibility
```
✓ Visit http://localhost:5173/
✓ Should redirect to /login (not authenticated)
✓ Login page displays correctly
✓ Can see login form
✓ Can enter credentials
```

#### Scenario 2: Successful Login
```
✓ Enter credentials
✓ Click "Entrar al sistema"
✓ Loading state shows "Validando..."
✓ Toast shows success message
✓ Redirects to /dashboard
✓ Token visible in localStorage
✓ User name shows in header
```

#### Scenario 3: Failed Login
```
✓ Enter invalid credentials
✓ Click "Entrar al sistema"
✓ Error toast appears
✓ Error message displays in form
✓ Stays on /login page
```

#### Scenario 4: Token Persistence
```
✓ Login successfully
✓ Refresh page (F5)
✓ Should stay logged in (no redirect to /login)
✓ Dashboard loads immediately
✓ Token still in localStorage
```

#### Scenario 5: Logout
```
✓ Click logout button in sidebar
✓ Logout toast appears
✓ Redirects to /login
✓ Token removed from localStorage
✓ Cannot access /dashboard without login
```

### B. Dashboard Features

#### Scenario 6: Bus Management (Patio)
```
✓ Dashboard loads with buses
✓ See drag-drop interface
✓ Drag bus to different area
✓ Bus moves in UI
✓ Toast shows "Autobús agregado exitosamente"
```

#### Scenario 7: Bus Details Modal
```
✓ Double-click on a bus card
✓ Modal opens with smooth animation
✓ Shows: código, tipo, área, conductor, origen, destino
✓ Click X or outside modal to close
✓ Modal closes smoothly
```

#### Scenario 8: Bus Registration
```
✓ Click "Registrar camión" in sidebar
✓ Step 1: Click "Registrar Autobús"
✓ Step 2: Fill in bus data
✓ Step 3: Select areas for route
✓ Step 4: Confirm
✓ Success toast appears
✓ Bus added to dashboard
✓ Form resets
```

#### Scenario 9: History Tab
```
✓ Click "Historial" in sidebar
✓ See list of all movements
✓ Each entry shows: message, unit, date/time
✓ Newest entries first
```

#### Scenario 10: Reports Tab
```
✓ Click "Reportes" in sidebar
✓ See KPI cards (total units, completed, active)
✓ See table with bus data
✓ Shows: código, conductor, entrada, salida, estado, progreso
```

#### Scenario 11: Configuration
```
✓ Click "Configuración Avanzada"
✓ See 3 options:
  - Gestor de Áreas
  - Agregar usuario
  - Mover camiones
✓ Click "Gestor de Áreas"
✓ Can create new area
✓ Can delete existing area
✓ Back button returns to menu
```

### C. UI Components

#### Scenario 12: Toast Notifications
```
✓ Success toast appears (green)
✓ Error toast appears (red)
✓ Info toast appears (blue)
✓ Toast auto-dismisses after 4 seconds
✓ Close button works
✓ Toast slides in smoothly
```

#### Scenario 13: Loading Spinner
```
✓ During data fetch, spinner shows
✓ "Cargando datos del sistema..."
✓ Spinner animates
✓ Disappears when data loads
```

#### Scenario 14: Error Handling
```
✓ If API is down, graceful error message
✓ App falls back to mock data
✓ Can still use dashboard
✓ See mock buses and areas
✓ Drag-drop still works
```

### D. API Integration

#### Scenario 15: API Calls with Token
```
✓ Login successfully
✓ Open DevTools → Network tab
✓ Click on bus drag action
✓ See PUT /api/camiones/:id request
✓ Check Authorization header
✓ Should have: Authorization: Bearer {token}
```

#### Scenario 16: Mock Data Fallback
```
✓ Disconnect internet or API
✓ Refresh page
✓ App loads with mock data
✓ Dashboard works normally
✓ Can still drag buses
✓ Notifications work
```

---

## Testing Checklist

### Pre-Testing Setup
- [ ] Clone branch: `git checkout testing/full-integration`
- [ ] Install deps: `npm install`
- [ ] Start server: `npm run dev`
- [ ] Open DevTools (F12)
- [ ] Go to Network tab for API monitoring
- [ ] Go to Console tab for errors
- [ ] Go to Application → Storage → LocalStorage for token

### Authentication
- [ ] Visit `/` redirects to `/login`
- [ ] Login page displays correctly
- [ ] Can enter credentials
- [ ] Successful login shows toast
- [ ] Successful login redirects to `/dashboard`
- [ ] Token stored in localStorage
- [ ] User name displays in header
- [ ] Failed login shows error toast
- [ ] Failed login stays on `/login`
- [ ] Page refresh keeps logged in
- [ ] Logout clears token
- [ ] Logout redirects to `/login`
- [ ] Cannot access `/dashboard` without token

### Navigation
- [ ] Sidebar buttons work
- [ ] "Patio en tiempo real" tab works
- [ ] "Registrar camión" tab works
- [ ] "Historial" tab works
- [ ] "Reportes" tab works
- [ ] "Configuración Avanzada" tab works
- [ ] Each tab shows correct content

### Patio Dashboard
- [ ] Buses display in areas
- [ ] Can drag buses between areas
- [ ] Double-click opens modal
- [ ] Modal shows all bus details
- [ ] Modal closes properly
- [ ] Bus cards show time in area
- [ ] Time counter updates
- [ ] Color changes: green → yellow → red (15+ sec)

### Notifications
- [ ] Success toasts appear
- [ ] Error toasts appear
- [ ] Toasts auto-dismiss
- [ ] Can close toasts manually
- [ ] Toast position (top-right)
- [ ] Animations smooth

### Forms
- [ ] Registration form has 4 steps
- [ ] Can fill each step
- [ ] Validation prevents empty fields
- [ ] Area selection works
- [ ] Confirmation shows summary
- [ ] Submit creates bus
- [ ] Success message appears
- [ ] Form resets after submit

### API Integration
- [ ] Network tab shows API calls
- [ ] Requests have Bearer token
- [ ] Request format is JSON
- [ ] Error responses handled
- [ ] Loading states show
- [ ] Timeout handling works (10s)

### Mock Data
- [ ] 3 test buses load
- [ ] 7 areas load
- [ ] Can interact without API
- [ ] Drag-drop works offline
- [ ] Notifications work offline

### Responsive Design
- [ ] Desktop (1920x1080) - full UI
- [ ] Tablet (768px) - layout adapts
- [ ] Mobile (375px) - stack layout
- [ ] Sidebar collapses on small screens
- [ ] Modals center properly
- [ ] Toasts stay visible

---

## Browser DevTools Debugging

### Check Token
```javascript
// Console tab
localStorage.getItem('authToken')
// Should return: "your-jwt-token" or null
```

### Test API Call
```javascript
// Console tab
import apiClient from './src/services/apiClient.js'
await apiClient.get('/api/camiones')
// Check response in console
```

### Check Auth Context
```javascript
// In any component using useAuth hook
const { user, isAuthenticated, loading } = useAuth();
console.log({ user, isAuthenticated, loading });
```

### Monitor API Calls
```
1. Open DevTools → Network tab
2. Filter: "XHR" or "Fetch"
3. Perform action (login, drag bus, etc.)
4. Click on request to see:
   - Headers (Authorization: Bearer token)
   - Request body (JSON)
   - Response (JSON)
   - Timing
```

---

## API Testing Without Backend

### Step 1: Mock API Responses
```javascript
// Add to apiClient.js for testing
if (endpoint === '/api/auth/login') {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        token: 'test-token-12345',
        usuario: { nombre: 'Test User', email: 'test@example.com' }
      });
    }, 1000);
  });
}
```

### Step 2: Test Offline
```
1. Open DevTools
2. Go to Network tab
3. Click throttling dropdown
4. Select "Offline"
5. Try to login
6. Should gracefully fallback to mock data
7. Dashboard should still work
```

### Step 3: Test Backend Integration
```
1. Ensure backend running at: https://ado-project.onrender.com
2. Verify endpoint: POST /api/auth/login
3. Login with credentials backend expects
4. Token should be stored
5. API calls should include Bearer token
6. Verify Network tab shows correct headers
```

---

## Performance Testing

### Load Time
```
1. Open DevTools
2. Go to Performance tab
3. Click Record
4. Load app
5. Click Stop
6. Check metrics:
   - First Contentful Paint (FCP) < 2s
   - Largest Contentful Paint (LCP) < 2.5s
   - Cumulative Layout Shift (CLS) < 0.1
```

### Memory
```
1. DevTools → Memory tab
2. Take snapshot before actions
3. Perform 10 drag operations
4. Take snapshot after
5. Check no memory leaks
6. Detached DOM nodes should be ~0
```

### Network
```
1. DevTools → Network tab
2. Disable cache (checkbox)
3. Reload page
4. Check:
   - Total requests < 50
   - Total size < 5MB
   - Load time < 3s
```

---

## Error Scenarios to Test

### Scenario A: Network Error
```
1. Open DevTools
2. Set Network throttling to "Offline"
3. Try to login
4. Should show error toast
5. Should fallback to mock data
6. Dashboard should still work
```

### Scenario B: Timeout
```
1. Login with very slow network
2. Should timeout after 10s
3. Show timeout error message
4. Allow retry
```

### Scenario C: Invalid Response
```
1. Backend returns malformed JSON
2. Should catch error
3. Show user-friendly message
4. Log to console for debugging
```

### Scenario D: Unauthorized (401)
```
1. Token expired/invalid
2. API returns 401
3. Should show error
4. Optionally redirect to login
```

---

## Deployment Testing

### Build Test
```bash
npm run build
# Should create dist/ folder
# No errors or warnings
```

### Preview Test
```bash
npm run preview
# Should serve built app
# Open http://localhost:4173
# Test all features
```

### Production Build Checklist
- [ ] npm run lint passes
- [ ] npm run build succeeds
- [ ] dist/ folder created
- [ ] No console errors/warnings
- [ ] All features work in build
- [ ] API calls working
- [ ] Token persistence works
- [ ] Routing works
- [ ] Modals display correctly

---

## Test Report Template

```markdown
# Test Report - testing/full-integration

**Date:** YYYY-MM-DD
**Tester:** Your Name
**Environment:** [Desktop/Tablet/Mobile]
**Browser:** [Chrome/Firefox/Safari/Edge] Version X

## Results

### Authentication
- [x] Login page loads
- [x] Can enter credentials
- [x] Login redirects to dashboard
- [x] Token stored
- [x] Logout clears token

### Patio Dashboard
- [x] Buses display
- [x] Can drag buses
- [x] Modal opens on double-click
- [x] Notifications appear

### Forms
- [x] Registration works
- [x] Validation works
- [x] Success message shows

### UI Components
- [x] Toasts display
- [x] Modals animate
- [x] Spinner shows during load
- [x] Error messages clear

### API Integration
- [x] Authorization header includes token
- [x] Requests timeout after 10s
- [x] Errors handled gracefully
- [x] Fallback to mock data works

## Issues Found

1. Issue #1
   - Description: ...
   - Steps to reproduce: ...
   - Expected: ...
   - Actual: ...

## Notes

- App works great!
- Ready for production

**Status:** ✅ PASS / ⚠️ NEEDS FIXES / ❌ FAIL
```

---

## Known Limitations

1. **No Backend Yet**
   - Implement all endpoints first
   - Test with real data after backend ready

2. **Mock Data Only**
   - 3 test buses (ADO-001, ADO-002, ADO-003)
   - 7 test areas (Desfogue, Diesel, etc.)
   - Can add more to CamionArea.json

3. **No Authentication Persistence**
   - Token stored in localStorage (works)
   - But no real JWT validation (backend job)

4. **No Real-time Updates**
   - Could add polling or WebSockets later
   - For now, manual refresh

---

## Next Steps After Testing

1. **Backend Development**
   - Implement POST /api/auth/login
   - Implement GET/POST /api/camiones
   - Implement GET/POST/PUT/DELETE /api/areas
   - Implement GET/POST /api/historial

2. **Integration Testing**
   - Test frontend with real backend
   - Verify all API calls work
   - Check response formats
   - Test error scenarios

3. **Production Deployment**
   - Build: npm run build
   - Deploy to Render
   - Test in production
   - Monitor errors

---

## Support

**Issues or Questions?**

1. Check browser console (F12) for errors
2. Check DevTools Network tab for API calls
3. Review documentation files (COMPLETE_SETUP_GUIDE.md)
4. Check localStorage for token: `localStorage.getItem('authToken')`
5. Verify .env.local has correct API URL

---

## Summary

This branch includes everything needed for complete integration testing:
- ✅ Full routing system
- ✅ Authentication flow
- ✅ API service layer
- ✅ UI components
- ✅ Error handling
- ✅ Mock data
- ✅ Loading states
- ✅ Comprehensive documentation

**Ready to test!** 

Push this branch and start testing all scenarios.

