#!/usr/bin/env bash
# E2E: lee las URLs exactas de los QR (una tras otra, 6 s entre lecturas de la
# misma unidad) durante un ciclo completo y verifica BD + API del panel.
set -uo pipefail
cd "$(dirname "$0")/.."
set -a; . demo/demo.env; set +a
IP=${IP:-$(ip -4 route get 1.1.1.1 | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}')}
B="http://$IP:$PORT"
python3 scripts/reset_demo.py >/dev/null
TOKEN_ADMIN=$(curl -s "$B/login" -H 'Content-Type: application/json' \
  -d "{\"username\":\"admin\",\"password\":\"${DEMO_PASSWORD:-demo2026}\"}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
fallos=0
esperado=(Diesel Ad-Blue Salida Desfogue)
for paso in 0 1 2 3; do
  for u in 101 102; do
    html=$(curl -s "$B/checkin?unidad=ADO-$u&k=$CHECKIN_TOKEN")
    msg=$(echo "$html" | grep -o '<h1>.*</h1>' | sed 's/<[^>]*>//g')
    db=$(docker exec sca-demo-db psql -U postgres -d sca -tAc \
      "SELECT a.name||'|'||m.is_completed||'|'||r.is_active FROM movements m JOIN area a ON a.id=m.area_id JOIN records r ON r.id=m.record_id WHERE m.serial_number=$u ORDER BY m.id DESC LIMIT 1")
    panel=$(curl -s "$B/camiones" -H "Authorization: Bearer $TOKEN_ADMIN" | python3 -c "import sys,json;print(next((c['area'] for c in json.load(sys.stdin) if c['codigo']=='$u'),'(fuera del patio)'))")
    want=${esperado[$paso]}
    if [[ "$msg" == *"→ $want"* ]] && { [[ $want == Salida && $panel == "(fuera del patio)" ]] || [[ $panel == "$want" ]]; }; then ok=✅; else ok=❌; fallos=$((fallos+1)); fi
    printf '%s ADO-%s  respuesta="%s"  bd=%s  panel=%s\n' "$ok" "$u" "$msg" "$db" "$panel"
  done
  sleep 6
done
python3 scripts/reset_demo.py >/dev/null
echo "Fallos: $fallos (demo reseteada)"
exit $fallos
