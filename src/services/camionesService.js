/**
 * Camiones (Buses) Service
 * Handles all bus-related API operations
 */

import apiClient from './apiClient.js';

class CamionesService {
  /**
   * Fetch all buses
   * @returns {Promise<Array>} - Array of buses
   */
  async getAllCamiones() {
    try {
      const response = await apiClient.get('/api/camiones');
      return response.data || response;
    } catch (error) {
      console.error('Error fetching camiones:', error);
      throw error;
    }
  }

  /**
   * Get single bus by ID
   * @param {string} id - Bus ID
   * @returns {Promise<Object>} - Bus data
   */
  async getCamionById(id) {
    try {
      const response = await apiClient.get(`/api/camiones/${id}`);
      return response.data || response;
    } catch (error) {
      console.error(`Error fetching camion ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new bus
   * @param {Object} camion - Bus data
   * @returns {Promise<Object>} - Created bus with ID
   */
  async createCamion(camion) {
    try {
      const response = await apiClient.post('/api/camiones', camion);
      return response.data || response;
    } catch (error) {
      console.error('Error creating camion:', error);
      throw error;
    }
  }

  /**
   * Update bus (location, status, etc)
   * @param {string} id - Bus ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} - Updated bus
   */
  async updateCamion(id, updates) {
    try {
      const response = await apiClient.put(`/api/camiones/${id}`, updates);
      return response.data || response;
    } catch (error) {
      console.error(`Error updating camion ${id}:`, error);
      throw error;
    }
  }

  /**
   * Move bus to new area (used by drag-drop)
   * @param {string} id - Bus ID
   * @param {string} areaId - New area ID
   * @returns {Promise<Object>} - Updated bus
   */
  async moveCamionToArea(id, areaId) {
    try {
      const response = await apiClient.put(`/api/camiones/${id}`, {
        area: areaId,
      });
      return response.data || response;
    } catch (error) {
      console.error(`Error moving camion ${id} to area ${areaId}:`, error);
      throw error;
    }
  }

  /**
   * Finalize bus route (mark as completed)
   * @param {string} id - Bus ID
   * @returns {Promise<Object>} - Updated bus
   */
  async finalizarCamion(id) {
    try {
      const response = await apiClient.put(`/api/camiones/${id}`, {
        finalizado: true,
      });
      return response.data || response;
    } catch (error) {
      console.error(`Error finalizing camion ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mark bus as departed/exit yard
   * @param {string} id - Bus ID
   * @returns {Promise<Object>} - Updated bus
   */
  async sacarCamion(id) {
    try {
      const response = await apiClient.put(`/api/camiones/${id}`, {
        area: 'Fuera',
      });
      return response.data || response;
    } catch (error) {
      console.error(`Error removing camion ${id} from yard:`, error);
      throw error;
    }
  }

  /**
   * Forced relocation (admin only)
   * @param {string} id - Bus ID
   * @param {string} areaId - Destination area
   * @returns {Promise<Object>} - Updated bus
   */
  async reubicacionForzada(id, areaId) {
    try {
      const response = await apiClient.put(`/api/camiones/${id}/reubicacion`, {
        area: areaId,
      });
      return response.data || response;
    } catch (error) {
      console.error(`Error forcing relocation of camion ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete bus (if allowed by backend)
   * @param {string} id - Bus ID
   * @returns {Promise<Object>} - Deletion response
   */
  async deleteCamion(id) {
    try {
      const response = await apiClient.delete(`/api/camiones/${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting camion ${id}:`, error);
      throw error;
    }
  }
}

export default new CamionesService();
