// src/lib/logic/useUsuariosBloc.js
//
// TODO (gestión de usuarios deshabilitada): UsuarioRepository sigue escrito
// contra las tablas viejas en español (usuario/rol), que ya no existen en la
// Supabase compartida — el equipo de Formularios las reemplazó por users/roles
// en inglés. La SCA API tampoco expone endpoints de usuarios (no es su
// dominio). Hasta que se decida con ese equipo cómo se va a administrar
// usuarios (endpoint nuevo, o que ellos mismos lo resuelvan), esta pantalla
// no hace ninguna llamada real — ver UsuarioRepository.js para el detalle.
import { useState } from 'react';

export const useUsuariosBloc = () => {
  const [usuarios] = useState([]);
  const [cargando] = useState(false);
  const disponible = false;

  // Estados para el Modal de Crear/Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [esEdicion, setEsEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const estadoInicial = { id_empleado: '', nombre: '', id_rol: '2', area_asignada: '', password: '' };
  const [formData, setFormData] = useState(estadoInicial);

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
    alert('Gestión de usuarios no disponible todavía (pendiente de coordinar con Formularios).');
  };

  const eliminarUsuario = async () => {
    alert('Gestión de usuarios no disponible todavía (pendiente de coordinar con Formularios).');
  };

  return {
    usuarios, cargando, disponible, modalAbierto, esEdicion, guardando, formData,
    abrirModalNuevo, abrirModalEditar, cerrarModal, handleInputChange, guardarUsuario, eliminarUsuario
  };
};