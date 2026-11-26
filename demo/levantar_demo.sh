#!/usr/bin/env bash
# Levanta la demo NFC: Postgres local (Docker) + API en 0.0.0.0:8000.
# Uso: demo/levantar_demo.sh            (deja la API en primer plano)
set -euo pipefail
cd "$(dirname "$0")/.."

if ! docker ps -a --format '{{.Names}}' | grep -qx sca-demo-db; then
  docker run -d --name sca-demo-db -e POSTGRES_PASSWORD=scademo -e POSTGRES_DB=sca \
    -p 5433:5432 -v sca-demo-pg:/var/lib/postgresql/data --restart unless-stopped postgres:17-alpine
  until docker exec sca-demo-db psql -U postgres -d sca -qc 'select 1' >/dev/null 2>&1; do sleep 1; done
  docker exec -i sca-demo-db psql -U postgres -d sca -q < demo/schema_local.sql
else
  docker start sca-demo-db >/dev/null
  until docker exec sca-demo-db psql -U postgres -d sca -qc 'select 1' >/dev/null 2>&1; do sleep 1; done
fi

set -a; . demo/demo.env; set +a
IP=$(ip -4 route get 1.1.1.1 | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}')
if [ "$IP" != "${DEMO_IP:-}" ]; then
  echo "⚠️  La IP cambió: ahora es $IP y los NFC/QR apuntan a ${DEMO_IP:-?}."
  echo "    Opciones: reservar ${DEMO_IP:-la IP} en el router, o regrabar NFC y correr"
  echo "    DEMO_IP=$IP demo/generar_qr.sh (y actualizar DEMO_IP en demo/demo.env)."
fi
echo "API:   http://$IP:$PORT   (panel: cd ~/ADO-Project && VITE_API_URL=http://$IP:$PORT npx vite --host 0.0.0.0)"
for u in 101 102; do echo "NFC/QR ADO-$u: http://$IP:$PORT/checkin?unidad=ADO-$u&k=$CHECKIN_TOKEN"; done
exec python3 -m uvicorn api:app --host 0.0.0.0 --port "$PORT"
