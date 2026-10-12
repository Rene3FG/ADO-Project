import { useState, useRef, useEffect } from 'react'
import { apiFetch } from '../lib/data/apiClient.js'
import './ChatWidget.css'

const MAX_HISTORIAL = 10

// Solo orienta la interfaz; el acceso real lo valida el servidor con el token.
function rolActual() {
  try {
    return JSON.parse(localStorage.getItem('sesionAdo'))?.rol
  } catch {
    return undefined
  }
}

function opcionesMenu(esOperador) {
  const opciones = esOperador
    ? [
        { titulo: 'Estado de mi área', pregunta: '¿Cómo está mi área ahora? Capacidad, ocupados y camiones presentes.' },
        { titulo: 'Corridas de hoy en mi área', pregunta: '¿Qué corridas de hoy requieren mi área?' },
        { titulo: 'Resumen del turno', pregunta: 'Dame el resumen del turno de hoy en mi área.' },
      ]
    : [
        { titulo: 'Ocupación de todas las áreas', pregunta: '¿Cuántos camiones hay en cada área?' },
        { titulo: 'Estado del desfogue', pregunta: '¿Cómo está el desfogue?' },
        { titulo: 'Corridas de hoy', pregunta: '¿Qué corridas hay programadas hoy?' },
        { titulo: 'Resumen del turno', pregunta: 'Dame el resumen del turno de hoy.' },
        { titulo: 'KPIs generales', pregunta: 'Dame los KPIs generales del patio.' },
      ]
  return opciones
}

// Asistente de consulta (solo lectura). El rol y el área los resuelve el
// servidor a partir del token; aquí solo se envía el texto.
export default function ChatWidget() {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [verMenu, setVerMenu] = useState(false)
  const fin = useRef(null)
  const menu = opcionesMenu(rolActual() === 'Operador')

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, cargando, abierto])

  const enviarTexto = async (pregunta) => {
    if (!pregunta || cargando) return
    setVerMenu(false)
    const historial = mensajes.slice(-MAX_HISTORIAL).map(({ role, content }) => ({ role, content }))
    setMensajes((m) => [...m, { role: 'user', content: pregunta }])
    setTexto('')
    setError('')
    setCargando(true)
    try {
      const { respuesta } = await apiFetch('/chat', {
        method: 'POST',
        body: JSON.stringify({ mensaje: pregunta, historial }),
      })
      setMensajes((m) => [...m, { role: 'assistant', content: respuesta }])
    } catch (err) {
      setError(err.message || 'No se pudo consultar al asistente.')
    } finally {
      setCargando(false)
    }
  }

  const enviar = (e) => {
    e.preventDefault()
    enviarTexto(texto.trim())
  }

  return (
    <div className="chat-widget">
      {abierto && (
        <section className="chat-panel" aria-label="Asistente SCA">
          <header className="chat-header">
            <span>Asistente SCA</span>
            <span className="chat-acciones">
              <button type="button" className="chat-btn-menu" onClick={() => setVerMenu((v) => !v)}>Menú</button>
              <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar asistente">×</button>
            </span>
          </header>
          <div className="chat-mensajes">
            {(mensajes.length === 0 || verMenu) && (
              <div className="chat-menu">
                <p className="chat-vacio">¿Qué quieres consultar? También puedes escribir tu pregunta.</p>
                {menu.map((o) => (
                  <button type="button" key={o.titulo} className="chat-opcion" onClick={() => enviarTexto(o.pregunta)}>
                    {o.titulo}
                  </button>
                ))}
              </div>
            )}
            {mensajes.map((m, i) => (
              <div key={i} className={`chat-burbuja chat-${m.role}`}>{m.content}</div>
            ))}
            {cargando && <div className="chat-burbuja chat-assistant chat-cargando">Consultando…</div>}
            {error && <div className="chat-error" role="alert">{error}</div>}
            <div ref={fin} />
          </div>
          <form className="chat-form" onSubmit={enviar}>
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe tu pregunta…"
              maxLength={1000}
              disabled={cargando}
            />
            <button type="submit" disabled={cargando || !texto.trim()}>Enviar</button>
          </form>
        </section>
      )}
      {!abierto && (
        <button type="button" className="chat-fab" onClick={() => setAbierto(true)} aria-label="Abrir asistente">
          💬
        </button>
      )}
    </div>
  )
}
