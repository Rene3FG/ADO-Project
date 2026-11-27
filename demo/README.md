# Demo NFC/QR — check-in sin login

## Producción (Render + Vercel) — modo principal

- URL de los NFC/QR: `https://ado-project.onrender.com/checkin?unidad=ADO-101&k=<CHECKIN_TOKEN>`
- En Render → Environment: `CHECKIN_TOKEN=<token>` y `DISABLE_SYNC=1` (que el
  sync con el Sheet no meta camiones fantasma al patio durante la demo).
- `ADO-101`/`ADO-102` se dan de alta solas en Desfogue con la primera lectura
  del día (`CHECKIN_UNIDADES`, default `101,102`); cualquier otra serie no
  registrada hoy → 404.
- Reset antes de la demo (con el `DATABASE_URL` de producción del `.env`):
  `python3 scripts/reset_demo.py --produccion` — solo toca esas 2 series.
- Operadores por área: `python3 scripts/crear_operadores.py` (usuarios 3001–3006;
  imprime contraseñas nuevas cada vez que se corre).
- QR: `BASE_URL=https://ado-project.onrender.com demo/generar_qr.sh`
- Render gratis se duerme a los 15 min: abre el panel (refresca cada 3 s y lo
  mantiene despierto) unos minutos antes.

## Local (plan B, sin internet en el lugar)

Cada cochecito lleva un tag NFC (registro **URL**) y un QR con la misma URL:

    http://<IP>:8000/checkin?unidad=ADO-101&k=<CHECKIN_TOKEN>

Al abrirla, la unidad avanza al siguiente paso de su ruta (la misma lógica que
el swipe/NFC del operador, `routing.py`). Rutas en `checkin.RUTAS_DEMO`:
**ADO-101** Desfogue → Diesel → Ad-Blue → Taller → Lavado Interior → Lavado
Exterior → Salida; **ADO-102** Desfogue → Diesel → Ad-Blue → Salida. Desde
Salida, Desfogue la vuelve a recibir (nuevo ciclo). El celular ve `✅ ADO-101 → Diesel (14:05)`; si algo
falla, un mensaje en rojo. Lecturas de la misma unidad a menos de 5 s se
ignoran. El movimiento queda en `movements` (sale en Historial/Reportes).

- **Token:** `CHECKIN_TOKEN` en `demo/demo.env`. Sin él, `/checkin` responde 503.
  Token incorrecto o ausente → 403. Es un secreto compartido para la demo, no
  un login: quien tenga la URL puede mover las 2 unidades.
- **Base:** Postgres local en Docker (`sca-demo-db`, puerto 5433) con el
  esquema real (`schema_local.sql`, volcado de Supabase). La demo NO toca
  Supabase ni el Google Sheet (`DISABLE_SYNC=1`).
- **Usuarios:** `admin`, `op_desfogue`, `op_diesel`, `op_adblue` — contraseña
  `demo2026` (o `DEMO_PASSWORD`).

## Comandos

    cp demo/demo.env.example demo/demo.env   # solo la primera vez, y llenar valores
    demo/levantar_demo.sh                    # BD + API en 0.0.0.0:8000 (imprime las URLs)
    cd ~/ADO-Project && VITE_API_URL=http://<IP>:8000 npx vite --host 0.0.0.0   # panel
    demo/reset_demo.sh                       # ADO-101 y ADO-102 de vuelta a Desfogue
    demo/generar_qr.sh                       # demo/qr/qr_ADO-*.png + printable.html
    demo/e2e_curl.sh                         # ciclo completo con curl + verificación
    python3 -m pytest tests/test_checkin.py  # (con demo/demo.env cargado)

Desde el celular (misma Wi-Fi): abrir `http://<IP>:8000/areas`. Si no carga,
el firewall: `sudo ufw allow 8000/tcp && sudo ufw allow 5173/tcp`.

## Plan B (la red no deja ver la laptop)

    cloudflared tunnel --url http://localhost:8000
    BASE_URL=https://<lo-que-imprima>.trycloudflare.com demo/generar_qr.sh

La URL del túnel cambia en cada arranque: hay que regrabar los NFC (o usar
solo los QR reimpresos). Con ngrok es igual: `ngrok http 8000`.
