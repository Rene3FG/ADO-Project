"""PDF carta con los QR de los cochecitos en VECTORES (tamaño físico exacto,
bordes nítidos a cualquier tamaño) + PNG de cada uno.

Uso: python3 demo/qr_mini_pdf.py <salida.pdf> <dir_png> ADO-101=<url> ADO-102=<url>
"""
import subprocess
import sys

from PIL import Image
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas

QUIET = 2  # módulos de margen blanco alrededor
salida, dir_png, *pares = sys.argv[1:]
unidades = [p.split("=", 1) for p in pares]


def matriz(url: str) -> list[list[bool]]:
    txt = subprocess.run(["qrencode", "-l", "L", "-m", str(QUIET), "-t", "ASCII", url],
                         check=True, capture_output=True, text=True).stdout.splitlines()
    return [[ch == "#" for ch in linea[::2]] for linea in txt if linea]


def guardar_png(m, ruta, px=12):
    n = len(m)
    img = Image.new("L", (n, n), 255)
    for y, fila in enumerate(m):
        for x, oscuro in enumerate(fila):
            if oscuro:
                img.putpixel((x, y), 0)
    img.resize((n * px, n * px), Image.NEAREST).save(ruta)


def dibujar(c, m, x, y_top, lado, nombre):
    """QR de `lado` (incluye margen blanco) con esquina superior izquierda en
    (x, y_top), etiqueta abajo y guía de corte punteada."""
    n = len(m)
    mod = lado / n
    c.setFillGray(0)
    for fy, fila in enumerate(m):
        fx = 0
        while fx < n:  # une módulos oscuros contiguos en un solo rectángulo
            if fila[fx]:
                ini = fx
                while fx < n and fila[fx]:
                    fx += 1
                c.rect(x + ini * mod, y_top - (fy + 1) * mod, (fx - ini) * mod, mod, stroke=0, fill=1)
            else:
                fx += 1
    tam = max(4.5, min(8, lado / cm * 4))
    c.setFont("Helvetica-Bold", tam)
    c.drawCentredString(x + lado / 2, y_top - lado - tam * 0.9, nombre)
    alto = lado + tam * 1.3
    c.setDash(1, 2)
    c.setLineWidth(0.3)
    c.setStrokeGray(0.6)
    c.rect(x - 0.1 * cm, y_top - alto - 0.1 * cm, lado + 0.2 * cm, alto + 0.2 * cm, stroke=1, fill=0)
    c.setDash()
    return alto


matrices = [(nombre, matriz(url)) for nombre, url in unidades]
for nombre, m in matrices:
    guardar_png(m, f"{dir_png}/qr_{nombre}.png")

c = canvas.Canvas(salida, pagesize=letter)
W, H = letter
x0, y = 1.5 * cm, H - 1.5 * cm
c.setFont("Helvetica-Bold", 11)
c.drawString(x0, y, "SCA · QR de los cochecitos")
c.setFont("Helvetica", 8)
y -= 0.5 * cm
c.drawString(x0, y, "Imprimir al 100 % / tamaño real (NO 'ajustar a página'). Recortar por la línea punteada.")
y -= 1.0 * cm


def fila(lado_cm, texto):
    global y
    c.setFont("Helvetica-Bold", 8)
    c.drawString(x0, y, texto)
    y -= 0.5 * cm
    x, alto = x0 + 0.1 * cm, 0
    for nombre, m in matrices:
        alto = max(alto, dibujar(c, m, x, y, lado_cm * cm, nombre))
        x += lado_cm * cm + 1.0 * cm
    y -= alto + 0.9 * cm


fila(1.2, "PARA RECORTAR — 1.2 cm")
c.setFont("Helvetica", 8)
c.drawString(x0, y, "Prueba de tamaño: escanea cada par con el celular y quédate con el más chico que lea al instante.")
y -= 0.9 * cm
for lado in (0.8, 1.0, 1.2, 1.5, 2.0):
    fila(lado, f"{lado:.1f} cm")
c.save()
print(salida)
