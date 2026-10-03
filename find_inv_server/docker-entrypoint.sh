#!/bin/sh
# Przy pierwszym starcie (pusta baza) wgrywa dane: forum i wyzwania demo, potem 114 innowacji ROPS.
# Kolejne starty nic nie nadpisują — dane z panelu admina zostają.
set -e
mkdir -p /data

if python -c "
import sqlite3, sys
try:
    c = sqlite3.connect('/data/findinv.db')
    n = c.execute('select count(*) from innovations').fetchone()[0]
except Exception:
    n = 0
sys.exit(0 if n == 0 else 1)
"; then
    echo "[hubmi] Pusta baza — wgrywam dane startowe…"
    python -m data.seed_demo || echo "[hubmi] seed_demo pominięty"
    python -m data.seed_innovations || echo "[hubmi] seed ROPS nieudany — zostają dane demo"
fi

exec "$@"
