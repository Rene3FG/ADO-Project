/**
 * Authentication Service
 * Handles login, logout, and token management
 */

import apiClient from './apiClient.js';

class AuthService {
  /**
   * Login with employee number and password
   * @param {string} empleado - Employee number
   * @param {string} contrasena - Password
   * @returns {Promise<Object>} - User data and token
   */
  async login(empleado, contrasena) {
    try {
      const response = await apiClient.post('/login', {
        username: empleado,
        password: contrasena,
      });

      apiClient.setToken(response.token);

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  logout() {
    apiClient.setToken(null);
    localStorage.removeItem('authToken');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!apiClient.getToken();
  }

  /**
   * Get current token
   */
  getToken() {
    return apiClient.getToken();
  }
}

export default new AuthService();
