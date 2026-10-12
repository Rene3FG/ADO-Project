const API_URL = import.meta.env.VITE_API_URL || 'https://ado-project.onrender.com';
const FETCH_TIMEOUT_MS = 80000; // > peor caso del backend (~65 s) y < corte del proxy de Render (~100 s)

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('sca_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers,
      signal: ctrl.signal,
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });
  } catch (err) {
    throw new Error(
      err.name === 'AbortError'
        ? 'El servidor tardó demasiado en responder. Intenta de nuevo.'
        : 'No se pudo contactar al servidor. Revisa tu conexión o intenta de nuevo.',
      { cause: err }
    );
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    // JWT vencido (la API lo emite por 12 h): mismo cierre que "Cerrar sesión".
    // Solo con token guardado y fuera de /login, para que credenciales malas
    // sigan mostrando su error en vez de recargar la página.
    if (res.status === 401 && token && path !== '/login') {
      localStorage.removeItem('sca_token');
      localStorage.removeItem('sesionAdo');
      window.location.reload();
      throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
    }
    const body = await res.json().catch(() => ({}));
    if (typeof body.detail === 'string') throw new Error(body.detail);
    if (res.status === 429) throw new Error('Demasiadas consultas, espera un momento.');
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error('El servicio no está disponible por ahora. Intenta de nuevo en un momento.');
    }
    throw new Error(`Error ${res.status} en ${path}`);
  }
  return res.status === 204 ? null : res.json();
}

// La API expone los nombres de área en mayúsculas (ver AREA_NOMBRE_DB en db_client.py);
// Backup usa nombres con mayúscula inicial. Este es el único punto de traducción.
export const AREA_API_TO_LOCAL = {
  DIESEL: 'Diesel',
  ADDBLUE: 'Ad-blue',
  TALLER: 'Taller',
  DESFOGUE: 'Desfogue',
  'LAVADO EXTERIOR': 'Lavado Exterior',
  'LAVADO INTERIOR': 'Lavado Interior',
  RECEPCION: 'Recepcion',
};

export const AREA_LOCAL_TO_API = Object.fromEntries(
  Object.entries(AREA_API_TO_LOCAL).map(([api, local]) => [local, api])
);
