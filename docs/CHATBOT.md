# Asistente de chat (SCA)

`POST /chat` — solo usuarios autenticados (Administrador, Supervisor, Operador). Sin sesión: 401.
Body: `{"mensaje": "...", "historial": [{"role": "user|assistant", "content": "..."}]}` (máx. 10 mensajes, 1000 caracteres c/u).
Respuesta: `{"respuesta": "..."}`. Errores: 401 sin sesión · 403 rol no permitido / operador sin área · 429 límite propio o cuota del proveedor · 502 fallo del proveedor.

## Variables de entorno
| Variable | Uso |
|---|---|
| `LLM_PROVIDER` | Proveedor (hoy `gemini`) |
| `LLM_MODEL` | Modelo (hoy `gemini-3.5-flash`) |
| `LLM_API_KEY` | Llave del proveedor. Solo en `.env` local / variables de Render; nunca en el repo |
| `CHAT_RATE_LIMIT_PER_MIN` | Consultas por usuario por minuto (default 10) |

## Control de acceso
Rol y área salen del JWT y de `users.assigned_area_id` en el servidor (`get_operador_area`), nunca del mensaje ni del modelo. Para Operador, el parámetro `area` de toda herramienta se sobrescribe con su área (y se devuelve un `aviso`). Supervisor = Administrador. Todas las herramientas son SELECT parametrizados; no hay SQL generado por el modelo. No se devuelven conductor, terminales, notas ni nombres de operadores.

## Registro
Cada consulta escribe una línea de log (loguru): `user`, `rol`, `area`, `herramientas`, `resultado`. No se guarda el texto del mensaje ni de la respuesta.

## Agregar una herramienta
1. En `chat_tools.py` escribe `def get_x(ctx, area=None, ...)` (solo SELECT; usa `ctx.resolver_area(area)` si es por área).
2. Agrégala a `DECLARACIONES` (nombre, descripción, parámetros) y a `HERRAMIENTAS`.
3. Agrega una prueba en `tests/test_chat.py`.

## Cambiar de proveedor
En `chat.py` escribe `_nuevo(modelo, llave, system, mensajes, herramientas) -> {"texto", "llamadas", "raw"}`, regístrala en `_PROVEEDORES` y pon `LLM_PROVIDER=nuevo`. Nada más cambia.

## Reemplazar la llave de prueba
Cambia `LLM_API_KEY` en `.env` (local) y en las variables de entorno de Render; reinicia el servicio. Si cambia el modelo, ajusta `LLM_MODEL`.

## Pruebas
`JWT_SECRET=<32+ caracteres> pytest tests/test_chat.py` (el modelo se simula; no consume cuota).
