#!/bin/sh
set -e
docker cp n8n-k2pw-n8n-1:/home/node/.n8n/database.sqlite /tmp/n8n.sqlite
python3 <<'PY'
import sqlite3
c = sqlite3.connect("/tmp/n8n.sqlite")
cur = c.cursor()
for table in ("project", "folder", "workflow_entity"):
    try:
        cur.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
        if cur.fetchone():
            print(f"=== {table} ===")
            cur.execute(f"PRAGMA table_info({table})")
            cols = [r[1] for r in cur.fetchall()]
            print("cols:", cols)
            cur.execute(f"SELECT * FROM {table} LIMIT 20")
            for row in cur.fetchall():
                print(row)
    except Exception as e:
        print(table, e)
PY
