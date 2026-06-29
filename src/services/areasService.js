import apiClient from './apiClient.js';

// Nuestra API devuelve nombres en mayúsculas (estilo integracion-vistas).
// Este frontend usa nombres en title-case con iconos propios.
const API_TO_DISPLAY = {
  'DIESEL':         'Diesel',
  'ADDBLUE':        'Ad-Blue',
  'TALLER':         'Taller',
  'DESFOGUE':       'Desfogue',
  'LAVADO EXTERIOR': 'Lavado Exterior',
  'LAVADO INTERIOR': 'Lavado Interior',
  'RECEPCION':      'Descanso',
};

const DISPLAY_TO_API = Object.fromEntries(
  Object.entries(API_TO_DISPLAY).map(([k, v]) => [v, k])
);

class AreasService {
  constructor() {
    this._cache = []; // [{id: "Diesel", dbId: 1, capacidad: 4}, ...]
  }

  async getAllAreas() {
    try {
      const response = await apiClient.get('/areas');
      const raw = response.data || response;
      this._cache = raw.map(a => ({
        id: API_TO_DISPLAY[a.nombre] || a.nombre,
        dbId: a.id,
        capacidad: a.capacidad,
      }));
      // "Descanso" es un área de espera que no existe en la DB;
      // se agrega siempre al final como pseudo-área local.
      if (!this._cache.find(a => a.id === 'Descanso')) {
        this._cache.push({ id: 'Descanso', dbId: null, capacidad: 99 });
      }
      return this._cache;
    } catch (error) {
      console.error('Error fetching areas:', error);
      throw error;
    }
  }

  async getAreaById(id) {
    try {
      const response = await apiClient.get(`/areas/${id}`);
      return response.data || response;
    } catch (error) {
      console.error(`Error fetching area ${id}:`, error);
      throw error;
    }
  }

  async createArea(area) {
    try {
      // area.id es el nombre display; API espera { nombre, capacidad }
      const apiNombre = DISPLAY_TO_API[area.id] || area.id;
      const response = await apiClient.post('/areas', {
        nombre: apiNombre,
        capacidad: area.capacidad,
      });
      const raw = response.data || response;
      // Agregar al caché local
      const created = {
        id: API_TO_DISPLAY[raw.nombre] || raw.nombre || area.id,
        dbId: raw.id,
        capacidad: raw.capacidad ?? area.capacidad,
      };
      this._cache.push(created);
      return created;
    } catch (error) {
      console.error('Error creating area:', error);
      throw error;
    }
  }

  async updateArea(id, updates) {
    try {
      const found = this._cache.find(a => a.id === id || a.dbId === id);
      const dbId = found ? found.dbId : id;
      const response = await apiClient.put(`/areas/${dbId}`, updates);
      return response.data || response;
    } catch (error) {
      console.error(`Error updating area ${id}:`, error);
      throw error;
    }
  }

  async deleteArea(id) {
    try {
      const found = this._cache.find(a => a.id === id || a.dbId === id);
      const dbId = found ? found.dbId : id;
      if (dbId === null) throw new Error('El área "Descanso" no puede eliminarse');
      const response = await apiClient.delete(`/areas/${dbId}`);
      this._cache = this._cache.filter(a => a.dbId !== dbId);
      return response;
    } catch (error) {
      console.error(`Error deleting area ${id}:`, error);
      throw error;
    }
  }

  getAreaCapacity(id, camiones = []) {
    const area = this._cache.find(a => a.id === id) || { capacidad: 4 };
    const camionesEnArea = camiones.filter((c) => c.area === id).length;
    return {
      capacidadMaxima: area.capacidad,
      camionesActuales: camionesEnArea,
      disponible: area.capacidad - camionesEnArea,
    };
  }
}

export default new AreasService();
