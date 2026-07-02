// src/lib/logic/useUsuariosBloc.js
import { useState, useEffect } from 'react';
import { UsuarioRepository } from '../data/repositories/UsuarioRepository';

export const useUsuariosBloc = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const disponible = true;

  const [modalAbierto, setModalAbierto] = useState(false);
  const [esEdicion, setEsEdicion] = useState(false);
  const [usuarioEditandoId, setUsuarioEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // La tabla roles guarda nombres en inglés (Administrator/Supervisor/Operator);
  // el ROLE_MAP de api.py solo los traduce al español en /login, no en el CRUD.
  const estadoInicial = { id_empleado: '', nombre: '', rol: 'Operator', password: '' };
  const [formData, setFormData] = useState(estadoInicial);

  const cargar = async () => {
    setCargando(true);
    try {
      const [lista, listaRoles] = await Promise.all([
        UsuarioRepository.listar().catch(() => []),
        UsuarioRepository.listarRoles().catch(() => []),
      ]);
      setUsuarios(lista);
      setRoles(listaRoles);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirModalNuevo = () => {
    setEsEdicion(false);
    setUsuarioEditandoId(null);
    setFormData(estadoInicial);
    setModalAbierto(true);
  };

  const abrirModalEditar = (user) => {
    setEsEdicion(true);
    setUsuarioEditandoId(user.id);
    setFormData({
      id_empleado: user.id_empleado,
      nombre: user.nombre,
      rol: user.rol,
      password: '***',
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => setModalAbierto(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (esEdicion) {
        await UsuarioRepository.editar(usuarioEditandoId, formData);
      } else {
        await UsuarioRepository.crear({
          username: formData.id_empleado,
          password: formData.password,
          nombre: formData.nombre,
          rol: formData.rol,
        });
      }
      cerrarModal();
      await cargar();
    } catch (e) {
      alert(e.message || 'Error al guardar usuario');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarUsuario = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar a ${nombre}?`)) return;
    try {
      await UsuarioRepository.eliminar(id);
      await cargar();
    } catch (e) {
      alert(e.message || 'Error al eliminar usuario');
    }
  };

  return {
    usuarios, roles, cargando, disponible, modalAbierto, esEdicion, guardando, formData,
    abrirModalNuevo, abrirModalEditar, cerrarModal, handleInputChange, guardarUsuario, eliminarUsuario,
  };
};
