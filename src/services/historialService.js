/**
 * Historial (History) Service
 * Handles movement history and event logging
 */

import apiClient from './apiClient.js';

class HistorialService {
  /**
   * Fetch all history records
   * @param {Object} filters - Query filters (unidad, tipo, fecha, etc)
   * @returns {Promise<Array>} - Array of history records
   */
  async getHistorial(filters = {}) {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const endpoint = queryString ? `/historial?${queryString}` : '/historial';
      const response = await apiClient.get(endpoint);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching historial:', error);
      throw error;
    }
  }

  /**
   * Get history for specific bus
   * @param {string} unidad - Bus unit code
   * @returns {Promise<Array>} - History records for that bus
   */
  async getHistorialPorUnidad(unidad) {
    try {
      const response = await apiClient.get(`/historial?unidad=${unidad}`);
      return response.data || response;
    } catch (error) {
      console.error(`Error fetching historial for unidad ${unidad}:`, error);
      throw error;
    }
  }

  /**
   * Log movement event
   * @param {Object} movimiento - Movement data
   * @returns {Promise<Object>} - Created record
   */
  async logMovimiento(movimiento) {
    try {
      const response = await apiClient.post('/historial', {
        tipo: 'movimiento',
        ...movimiento,
      });
      return response.data || response;
    } catch (error) {
      console.error('Error logging movimiento:', error);
      throw error;
    }
  }

  /**
   * Log alert event
   * @param {Object} alerta - Alert data
   * @returns {Promise<Object>} - Created record
   */
  async logAlerta(alerta) {
    try {
      const response = await apiClient.post('/historial', {
        tipo: 'alerta',
        ...alerta,
      });
      return response.data || response;
    } catch (error) {
      console.error('Error logging alerta:', error);
      throw error;
    }
  }

  /**
   * Log completion event
   * @param {Object} completado - Completion data
   * @returns {Promise<Object>} - Created record
   */
  async logCompletado(completado) {
    try {
      const response = await apiClient.post('/historial', {
        tipo: 'completado',
        ...completado,
      });
      return response.data || response;
    } catch (error) {
      console.error('Error logging completado:', error);
      throw error;
    }
  }

  /**
   * Log registration event
   * @param {Object} registro - Registration data
   * @returns {Promise<Object>} - Created record
   */
  async logRegistro(registro) {
    try {
      const response = await apiClient.post('/historial', {
        tipo: 'registro',
        ...registro,
      });
      return response.data || response;
    } catch (error) {
      console.error('Error logging registro:', error);
      throw error;
    }
  }

  /**
   * Log exit/departure event
   * @param {Object} salida - Exit data
   * @returns {Promise<Object>} - Created record
   */
  async logSalida(salida) {
    try {
      const response = await apiClient.post('/historial', {
        tipo: 'salida',
        ...salida,
      });
      return response.data || response;
    } catch (error) {
      console.error('Error logging salida:', error);
      throw error;
    }
  }
}

export default new HistorialService();
