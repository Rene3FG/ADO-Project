// src/lib/presentation/pages/ConfiguracionPage.jsx
import { useState } from 'react';
import { useUsuariosBloc } from '../../logic/useUsuariosBloc';
import { useAreasBloc } from '../../logic/useAreasBloc';

export const ConfiguracionPage = ({ autobuses = [] }) => {
  const [tabActiva, setTabActiva] = useState('usuarios');

  const {
    usuarios, cargando: cargandoUsuarios, modalAbierto: modalUsuAbierto, esEdicion: esEdicionUsu, guardando: guardandoUsu, formData: formUsu,
    abrirModalNuevo: abrirModNuevoUsu, abrirModalEditar: abrirModEditarUsu, cerrarModal: cerrarModUsu, handleInputChange: handleUsuChange, guardarUsuario, eliminarUsuario
  } = useUsuariosBloc();

  const {
    areas, cargandoAreas, modalAreaAbierto, esEdicionArea, guardandoArea, formDataArea,
    abrirModalNuevaArea, abrirModalEditarArea, cerrarModalArea, handleAreaInputChange, guardarArea, eliminarArea
  } = useAreasBloc();

  // Estilos responsivos
  const btnTabInactivo = { padding: '12px 15px', backgroundColor: 'transparent', border: 'none', borderBottom: '3px solid transparent', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' };
  const btnTabActivo = { ...btnTabInactivo, color: 'var(--ado-purple)', borderBottom: '3px solid var(--ado-purple)' };
  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '5px', boxSizing: 'border-box' };
  const thStyle = { padding: '12px', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '12px', whiteSpace: 'nowrap' };

  // Filtramos áreas internas
  const areasVisibles = areas.filter(a => 
    a.nombre_area !== 'Salida' && 
    a.nombre_area !== 'General' && 
    !a.nombre_area.startsWith('Taller - ')
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* HEADER Y TABS (Permite scroll en celulares si las pestañas no caben) */}
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem', fontWeight: 800 }}>Configuración Avanzada</h2>
        <p style={{ margin: '5px 0 20px 0', color: 'var(--text-muted)' }}>Administra los parámetros generales del sistema.</p>
        
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', gap: '10px' }}>
          <button style={tabActiva === 'usuarios' ? btnTabActivo : btnTabInactivo} onClick={() => setTabActiva('usuarios')}>
            👥 Gestión de Personal
          </button>
          <button style={tabActiva === 'areas' ? btnTabActivo : btnTabInactivo} onClick={() => setTabActiva('areas')}>
            📍 Estaciones de Patio
          </button>
        </div>
      </div>

      {/* ======================= PESTAÑA: USUARIOS ======================= */}
      {tabActiva === 'usuarios' && (
        <div className="tab-content">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
            <button onClick={abrirModNuevoUsu} style={{ backgroundColor: 'var(--ado-purple)', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>+ NUEVO USUARIO</button>
          </div>
          {cargandoUsuarios ? <p>Cargando personal...</p> : (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              {/* Contenedor que permite el scroll horizontal en móviles */}
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-light)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={thStyle}>ID</th>
                      <th style={thStyle}>Nombre</th>
                      <th style={thStyle}>Rol</th>
                      <th style={thStyle}>Área Asignada</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map(user => (
                      <tr key={user.id_empleado} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{user.id_empleado}</td>
                        <td style={tdStyle}>{user.nombre}</td>
                        <td style={tdStyle}>
                          <span style={{ backgroundColor: user.id_rol === 1 ? '#e0e7ff' : user.id_rol === 3 ? '#fef3c7' : '#f1f5f9', color: user.id_rol === 1 ? '#3730a3' : user.id_rol === 3 ? '#b45309' : '#475569', padding: '4px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.8rem' }}>
                            {user.rol?.nombre_rol || (user.id_rol === 1 ? 'Administrador' : user.id_rol === 3 ? 'Supervisor' : 'Operador')}
                          </span>
                        </td>
                        <td style={tdStyle}>{user.area_asignada || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>General</span>}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button onClick={() => abrirModEditarUsu(user)} style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 800, cursor: 'pointer' }}>Editar</button>
                            {user.id_empleado !== '1' && (
                              <button onClick={() => eliminarUsuario(user.id_empleado, user.nombre)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, cursor: 'pointer' }}>Borrar</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= PESTAÑA: ÁREAS ======================= */}
      {tabActiva === 'areas' && (
        <div className="tab-content">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
            <button onClick={abrirModalNuevaArea} style={{ backgroundColor: '#0284c7', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>+ NUEVA ÁREA</button>
          </div>
          {cargandoAreas ? <p>Cargando áreas...</p> : (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              {/* Contenedor que permite el scroll horizontal en móviles */}
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-light)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={thStyle}>Icono</th>
                      <th style={thStyle}>Área</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Ocupados</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Disponibles</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Total</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {areasVisibles.map(area => {
                      const capacidadTotal = area.capacidad || 0;
                      const ocupados = autobuses.filter(bus => bus.currentArea === area.nombre_area).length;
                      const disponibles = capacidadTotal - ocupados;

                      return (
                        <tr key={area.id_area} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ ...tdStyle, fontSize: '1.2rem' }}>{area.icono || '📍'}</td>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{area.nombre_area}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <span style={{ backgroundColor: ocupados > 0 ? '#fef3c7' : '#f1f5f9', color: ocupados > 0 ? '#b45309' : '#64748b', padding: '6px 12px', borderRadius: '8px', fontWeight: 800 }}>
                              {ocupados}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <span style={{ backgroundColor: disponibles > 0 ? '#dcfce7' : '#fee2e2', color: disponibles > 0 ? '#166534' : '#991b1b', padding: '6px 12px', borderRadius: '8px', fontWeight: 800 }}>
                              {disponibles > 0 ? disponibles : 0}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '6px 12px', borderRadius: '8px', fontWeight: 800 }}>
                              {capacidadTotal}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                              <button onClick={() => abrirModalEditarArea(area)} style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 800, cursor: 'pointer' }}>Modificar</button>
                              <button onClick={() => eliminarArea(area.id_area, area.nombre_area)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, cursor: 'pointer' }}>Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL PARA USUARIOS */}
      {modalUsuAbierto && (
        <div onClick={cerrarModUsu} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: '20px', boxSizing: 'border-box' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--ado-purple)' }}>{esEdicionUsu ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
            <form onSubmit={guardarUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div><label style={{ fontWeight: 600 }}>ID Empleado</label><input type="text" name="id_empleado" value={formUsu.id_empleado} onChange={handleUsuChange} disabled={esEdicionUsu} required style={inputStyle} /></div>
              <div><label style={{ fontWeight: 600 }}>Nombre</label><input type="text" name="nombre" value={formUsu.nombre} onChange={handleUsuChange} required style={inputStyle} /></div>
              
              {/* Grilla responsiva que se apila en móviles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                <div><label style={{ fontWeight: 600 }}>Rol</label>
                  <select name="id_rol" value={formUsu.id_rol} onChange={handleUsuChange} style={{...inputStyle, backgroundColor: 'white'}}>
                    <option value="1">Admin</option><option value="3">Supervisor</option><option value="2">Operador</option>
                  </select>
                </div>
                <div><label style={{ fontWeight: 600 }}>Contraseña</label><input type="password" name="password" value={formUsu.password} onChange={handleUsuChange} required style={inputStyle} /></div>
              </div>
              
              <div>
                <label style={{ fontWeight: 600 }}>Área Asignada (Solo Operadores)</label>
                <select name="area_asignada" value={formUsu.area_asignada} onChange={handleUsuChange} disabled={formUsu.id_rol === '1' || formUsu.id_rol === '3'} style={{...inputStyle, backgroundColor: (formUsu.id_rol === '1' || formUsu.id_rol === '3') ? '#f1f5f9' : 'white'}}>
                  <option value="">General (Sin área fija)</option>
                  {areasVisibles.map(a => <option key={a.id_area} value={a.nombre_area}>{a.nombre_area}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={cerrarModUsu} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'white', color: '#333', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={guardandoUsu} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--ado-purple)', color: 'white', fontWeight: 800, cursor: 'pointer' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA ÁREAS */}
      {modalAreaAbierto && (
        <div onClick={cerrarModalArea} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: '20px', boxSizing: 'border-box' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#0284c7' }}>{esEdicionArea ? 'Modificar Área' : 'Crear Nueva Área'}</h3>
            <form onSubmit={guardarArea} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontWeight: 600 }}>Nombre de la Estación</label>
                <input type="text" name="nombre_area" value={formDataArea.nombre_area} onChange={handleAreaInputChange} placeholder="Ej. Lavado Express" required style={inputStyle} />
              </div>
              
              {/* Grilla responsiva que se apila en móviles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ fontWeight: 600 }}>Icono</label>
                  <input type="text" name="icono" value={formDataArea.icono} onChange={handleAreaInputChange} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontWeight: 600 }}>Capacidad</label>
                  <input type="number" min="1" name="capacidad" value={formDataArea.capacidad} onChange={handleAreaInputChange} required style={inputStyle} />
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>⚠️ Modificar la capacidad impactará cuántos vehículos pueden ingresar a esta estación simultáneamente en el patio central.</p>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={cerrarModalArea} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'white', color: '#333', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={guardandoArea} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: 'white', fontWeight: 800, cursor: 'pointer' }}>Guardar Área</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};