import { useState, useRef, useEffect } from 'react'
import { apiFetch } from '../lib/data/apiClient.js'
import './ChatWidget.css'

const MAX_HISTORIAL = 10

// Asistente de consulta (solo lectura). El rol y el área los resuelve el
// servidor a partir del token; aquí solo se envía el texto.
export default function ChatWidget() {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const fin = useRef(null)

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, cargando, abierto])

  const enviar = async (e) => {
    e.preventDefault()
    const pregunta = texto.trim()
    if (!pregunta || cargando) return
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

  return (
    <div className="chat-widget">
      {abierto && (
        <section className="chat-panel" aria-label="Asistente SCA">
          <header className="chat-header">
            <span>Asistente SCA</span>
            <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar asistente">×</button>
          </header>
          <div className="chat-mensajes">
            {mensajes.length === 0 && (
              <p className="chat-vacio">Pregunta por corridas, turno, desfogue o el estado de un área.</p>
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
