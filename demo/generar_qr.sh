#!/usr/bin/env bash
# Genera demo/qr/qr_ADO-101.png, qr_ADO-102.png y printable.html (QR de 3×3 cm).
# Usa DEMO_IP de demo/demo.env (o BASE_URL=https://... para el túnel de respaldo).
# Las salidas llevan el token: están en .gitignore, no se suben al repo.
set -euo pipefail
cd "$(dirname "$0")/.."
_ip=${DEMO_IP:-}; set -a; . demo/demo.env; set +a; DEMO_IP=${_ip:-$DEMO_IP}
BASE=${BASE_URL:-http://$DEMO_IP:$PORT}
mkdir -p demo/qr
filas=""
for u in 101 102; do
  url="$BASE/checkin?unidad=ADO-$u&k=$CHECKIN_TOKEN"
  qrencode -l M -s 12 -m 2 -o "demo/qr/qr_ADO-$u.png" "$url"
  echo "ADO-$u  $url"
  filas+="<figure><img src=\"qr_ADO-$u.png\" alt=\"QR ADO-$u\"><figcaption>ADO-$u</figcaption></figure>"
done
cat > demo/qr/printable.html <<HTML
<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>QR demo SCA</title>
<style>
  @page { size: letter; margin: 2cm; }
  body { font-family: system-ui, sans-serif; }
  .hoja { display: flex; gap: 2cm; }
  figure { margin: 0; text-align: center; border: 1px dashed #999; padding: .4cm; }
  img { width: 3cm; height: 3cm; image-rendering: pixelated; display: block; }
  figcaption { margin-top: .2cm; font-weight: 700; font-size: 14pt; }
  p { color: #666; font-size: 9pt; }
</style></head>
<body><div class="hoja">$filas</div>
<p>Imprimir al 100 % (sin "ajustar a página") para que cada QR mida 3×3 cm.</p>
</body></html>
HTML
echo "Listo: $(pwd)/demo/qr/printable.html"
