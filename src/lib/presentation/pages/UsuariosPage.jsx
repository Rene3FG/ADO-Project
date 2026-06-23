// src/lib/presentation/pages/UsuariosPage.jsx
import { useUsuariosBloc } from '../../logic/useUsuariosBloc';

export const UsuariosPage = () => {
  const {
    usuarios, cargando, disponible, modalAbierto, esEdicion, guardando, formData,
    abrirModalNuevo, abrirModalEditar, cerrarModal, handleInputChange, guardarUsuario, eliminarUsuario
  } = useUsuariosBloc();

  // Definición de áreas para el selector
  const AREAS = ['Desfogue', 'Diesel', 'Ad-blue', 'Taller', 'Lavado Interior', 'Lavado Exterior', 'General'];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem', fontWeight: 800 }}>Gestión de Usuarios</h2>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)' }}>Administra los accesos, roles y áreas del personal.</p>
        </div>
        <button onClick={abrirModalNuevo} style={{ backgroundColor: 'var(--ado-purple)', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
          + NUEVO USUARIO
        </button>
      </div>

      {!disponible && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '8px', padding: '12px 15px', marginBottom: '20px', fontSize: '0.9rem', color: '#92400e' }}>
          Pendiente: la gestión de usuarios todavía no está conectada — las tablas que usaba esta pantalla (esquema viejo en español) ya no existen. Falta coordinar con el equipo de Formularios.
        </div>
      )}

      {cargando ? (
        <p style={{ textAlign: 'center', padding: '20px' }}>Cargando personal...</p>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-light)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '15px' }}>ID / Empleado</th>
                  <th style={{ padding: '15px' }}>Nombre</th>
                  <th style={{ padding: '15px' }}>Rol</th>
                  <th style={{ padding: '15px' }}>Área Asignada</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(user => (
                  <tr key={user.id_empleado} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '15px', fontWeight: 600 }}>{user.id_empleado}</td>
                    <td style={{ padding: '15px' }}>{user.nombre}</td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ backgroundColor: user.id_rol === 1 ? '#e0e7ff' : '#f1f5f9', color: user.id_rol === 1 ? '#3730a3' : '#475569', padding: '4px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.8rem' }}>
                        {user.rol?.nombre_rol || (user.id_rol === 1 ? 'Administrador' : 'Operador')}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>{user.area_asignada || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>General (Todo)</span>}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <button onClick={() => abrirModalEditar(user)} style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 800, cursor: 'pointer', marginRight: '10px' }}>Editar</button>
                      {user.id_empleado !== '1' && ( // Protegemos al "SuperAdmin"
                        <button onClick={() => eliminarUsuario(user.id_empleado, user.nombre)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, cursor: 'pointer' }}>Borrar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      {modalAbierto && (
        <div onClick={cerrarModal} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: '20px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--ado-purple)' }}>{esEdicion ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>
            
            <form onSubmit={guardarUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>ID Empleado (Usuario)</label>
                <input type="text" name="id_empleado" value={formData.id_empleado} onChange={handleInputChange} disabled={esEdicion} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '5px', backgroundColor: esEdicion ? '#f1f5f9' : 'white', boxSizing: 'border-box' }} />
              </div>
              
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Nombre Completo</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Rol del Sistema</label>
                  <select name="id_rol" value={formData.id_rol} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '5px', boxSizing: 'border-box', backgroundColor: 'white' }}>
                    <option value="1">Administrador</option>
                    <option value="2">Operador</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Contraseña</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '5px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Área Asignada (Solo Operadores)</label>
                <select name="area_asignada" value={formData.area_asignada} onChange={handleInputChange} disabled={formData.id_rol === '1'} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '5px', boxSizing: 'border-box', backgroundColor: formData.id_rol === '1' ? '#f1f5f9' : 'white' }}>
                  <option value="">General (Sin área fija)</option>
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={cerrarModal} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={guardando} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--ado-purple)', color: 'white', fontWeight: 800, cursor: guardando ? 'not-allowed' : 'pointer' }}>
                  {guardando ? 'Guardando...' : 'Guardar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};