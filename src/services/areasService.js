/**
 * Areas Service
 * Handles maintenance areas management
 */

import apiClient from './apiClient.js';

class AreasService {
  /**
   * Fetch all maintenance areas
   * @returns {Promise<Array>} - Array of areas
   */
  async getAllAreas() {
    try {
      const response = await apiClient.get('/api/areas');
      return response.data || response;
    } catch (error) {
      console.error('Error fetching areas:', error);
      throw error;
    }
  }

  /**
   * Get single area by ID
   * @param {string} id - Area ID
   * @returns {Promise<Object>} - Area data
   */
  async getAreaById(id) {
    try {
      const response = await apiClient.get(`/api/areas/${id}`);
      return response.data || response;
    } catch (error) {
      console.error(`Error fetching area ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new maintenance area
   * @param {Object} area - Area data { id, capacidad }
   * @returns {Promise<Object>} - Created area
   */
  async createArea(area) {
    try {
      const response = await apiClient.post('/api/areas', area);
      return response.data || response;
    } catch (error) {
      console.error('Error creating area:', error);
      throw error;
    }
  }

  /**
   * Update area (name, capacity, etc)
   * @param {string} id - Area ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} - Updated area
   */
  async updateArea(id, updates) {
    try {
      const response = await apiClient.put(`/api/areas/${id}`, updates);
      return response.data || response;
    } catch (error) {
      console.error(`Error updating area ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete area
   * @param {string} id - Area ID
   * @returns {Promise<Object>} - Deletion response
   */
  async deleteArea(id) {
    try {
      const response = await apiClient.delete(`/api/areas/${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting area ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get current capacity of an area
   * @param {string} id - Area ID
   * @param {Array} camiones - Array of all buses
   * @returns {Object} - { capacidadMaxima, camionesActuales, disponible }
   */
  getAreaCapacity(id, camiones = []) {
    const area = { capacidad: 4 }; // Default if not found
    const camionesEnArea = camiones.filter((c) => c.area === id).length;
    return {
      capacidadMaxima: area.capacidad,
      camionesActuales: camionesEnArea,
      disponible: area.capacidad - camionesEnArea,
    };
  }
}

export default new AreasService();
