// Cliente fetch para la SCA API (antes este archivo era supabaseClient.js).
// Ver TODO en useAuthBloc.js: el login no pasa por aquí todavía.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Error ${res.status} en ${path}`);
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
