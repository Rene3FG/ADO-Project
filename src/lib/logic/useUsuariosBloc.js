// src/lib/logic/useUsuariosBloc.js
import { useState, useEffect } from 'react';
import { UsuarioRepository } from '../data/repositories/UsuarioRepository';

export const useUsuariosBloc = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estados para el Modal de Crear/Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [esEdicion, setEsEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  
  const estadoInicial = { id_empleado: '', nombre: '', id_rol: '2', area_asignada: '', password: '' };
  const [formData, setFormData] = useState(estadoInicial);

  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const data = await UsuarioRepository.obtenerTodos();
      setUsuarios(data);
    } catch (error) {
      alert("Error al cargar usuarios: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const abrirModalNuevo = () => {
    setEsEdicion(false);
    setFormData(estadoInicial);
    setModalAbierto(true);
  };

  const abrirModalEditar = (user) => {
    setEsEdicion(true);
    setFormData({
      id_empleado: user.id_empleado,
      nombre: user.nombre,
      id_rol: user.id_rol.toString(),
      area_asignada: user.area_asignada || '',
      password: '***' // Enmascaramos la contraseña por seguridad visual
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => { setModalAbierto(false); };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await UsuarioRepository.guardarUsuario(formData, !esEdicion);
      await cargarUsuarios();
      cerrarModal();
    } catch (error) {
      alert("Error al guardar: Verifica que el ID no esté duplicado.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarUsuario = async (id, nombre) => {
    if(window.confirm(`¿Estás seguro de que deseas eliminar permanentemente al usuario ${nombre}?`)) {
      try {
        await UsuarioRepository.eliminarUsuario(id);
        await cargarUsuarios();
      } catch(error) {
        alert("Error al eliminar usuario.");
      }
    }
  };

  return {
    usuarios, cargando, modalAbierto, esEdicion, guardando, formData,
    abrirModalNuevo, abrirModalEditar, cerrarModal, handleInputChange, guardarUsuario, eliminarUsuario
  };
};