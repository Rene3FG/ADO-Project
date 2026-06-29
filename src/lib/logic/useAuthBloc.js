// src/lib/logic/useAuthBloc.js
import { useState } from 'react';
import { UsuarioRepository } from '../data/repositories/UsuarioRepository';

export const useAuthBloc = (onLoginSuccess) => {
  const [idEmpleado, setIdEmpleado] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const iniciarSesion = async (e) => {
    e.preventDefault(); // Evita que la página se recargue
    setError('');
    setCargando(true);

    try {
      // Llamamos a Supabase a través de nuestro repositorio
      const data = await UsuarioRepository.autenticar(idEmpleado, password);
      
      // Si todo sale bien, notificamos a la aplicación que ya entramos
      if (onLoginSuccess) {
        onLoginSuccess(data.usuario);
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Verifica tus datos.');
    } finally {
      setCargando(false);
    }
  };

  return {
    idEmpleado,
    setIdEmpleado,
    password,
    setPassword,
    error,
    cargando,
    iniciarSesion
  };
};