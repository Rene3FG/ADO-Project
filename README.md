# Sistema de Control de Autobuses (SCA)

Sistema web multiusuario para el control operativo de autobuses en el área de mantenimiento de ADO Oaxaca. Digitaliza y centraliza el seguimiento de unidades entre áreas de trabajo y mantiene sincronización bidireccional con el archivo Excel existente en OneDrive/Google Sheets.

Desarrollado como parte del proyecto Practicum I — Universidad Anáhuac Oaxaca, 2026.

---

## Estructura del repositorio

El proyecto está dividido en dos partes, cada una en su propia rama:

| Rama | Descripción | Stack |
|---|---|---|
| `main` | Aplicación web (frontend) | React 19, Vite, react-icons |
| `Excel` | Servicio de sincronización con Google Sheets (backend) | Python, PostgreSQL, gspread, SQLAlchemy |

---

## Frontend — rama `main`

Interfaz web multiusuario para el control de patio. Permite visualizar el estado de las unidades, su movimiento entre áreas y la disponibilidad en tiempo real.

### Requisitos

- Node.js 18+

### Instalación y uso

```bash
git clone https://github.com/Rene3FG/ADO-Project.git
cd ADO-Project
npm install
npm run dev
```

---

## Backend — rama `Excel`

Servicio que corre en segundo plano y sincroniza datos entre Google Sheets y PostgreSQL cada 2 minutos. Consulta el README de esa rama para instrucciones de instalación y configuración:

```bash
git checkout Excel
```

---

## Equipo

- Rosaura Quintana Fenochio
- Jimena Morales Villagómez
- René Fuentes Guzmán
- Sebastián Morales Villagómez
- Luis Daniel Acevedo Herrera
- Alejandro Cinco Prieto
