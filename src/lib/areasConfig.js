// Definición compartida de áreas del patio (capacidades) usada por ambas
// vistas (PatioPage.jsx en mobile, DropDrag.jsx en desktop). La API no
// expone capacidad por área (no existe esa columna en `area`), así que se
// define aquí del lado del cliente, igual que ya lo hacía Backup.
export const AREAS_PATIO = [
  { id: 'Desfogue', nombre: 'Desfogue', capacidad: 4, icono: '💨' },
  { id: 'Diesel', nombre: 'Diesel', capacidad: 3, icono: '⛽' },
  { id: 'Lavado Exterior', nombre: 'Lavado Exterior', capacidad: 4, icono: '🚿' },
  { id: 'Lavado Interior', nombre: 'Lavado Interior', capacidad: 3, icono: '🧽' },
  { id: 'Ad-blue', nombre: 'Ad-blue', capacidad: 2, icono: '💧' },
  { id: 'Taller', nombre: 'Taller', capacidad: 2, icono: '🛠️' },
  { id: 'Espera', nombre: 'Área de Espera', capacidad: 6, icono: '🚏' },
];
