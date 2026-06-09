import { useState } from 'react'
import './App.css'

function App() {
  //Creación del estado. Por defecto está en 'false'
  const [menuAbierto, setMenuAbierto] = useState(false)

  // 2. Función que cambia el estado
  const alternarMenu = () => {
    setMenuAbierto(!menuAbierto)
  }

  return (
    <>
      {/* Barra de navegación superior */}
      <nav className="navbar">
        <button className="boton-hamburguesa" onClick={alternarMenu}>
          {}
          ☰ 
        </button>
        <span className="titulo-nav">MENU</span>
      </nav>

      {}
      <div className={`menu-lateral ${menuAbierto ? 'abierto' : ''}`}>
        <button className="boton-cerrar" onClick={alternarMenu}>✖</button>
        <ul>

          {/* Igual y podemos agregar una miniatura para el menu */}
          <li><a href="#lavado" onClick={alternarMenu}>Patio 🌲</a></li> 
          <li><a href="#mantenimiento" onClick={alternarMenu}>Registrar Unidad 🚘</a></li>
          <li><a href="#reportes" onClick={alternarMenu}>Movimientos 🔃</a></li>
        </ul>
      </div>

      {/* {Contenido principal y original } */}
      <main className="contenido-principal">
        <header className="header-patio">
          <h1>¡Bienvenido al patio!</h1>
        </header>
        <p>Sistema de monitoreo listo.</p>
      </main>
    </>
  )
}

export default App