# Demo NFC/QR — check-in sin login

Cada cochecito lleva un tag NFC (registro **URL**) y un QR con la misma URL:

    http://<IP>:8000/checkin?unidad=ADO-101&k=<CHECKIN_TOKEN>

Al abrirla, la unidad avanza al siguiente paso de su ruta (la misma lógica que
el swipe/NFC del operador, `routing.py`): **Desfogue → Diesel → Ad-Blue →
Salida → Desfogue…** El celular ve `✅ ADO-101 → Diesel (14:05)`; si algo
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
