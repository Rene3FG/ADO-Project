#!/usr/bin/env bash
# Regresa ADO-101 y ADO-102 a Desfogue (estado inicial) en la base local.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . demo/demo.env; set +a
python3 scripts/reset_demo.py
