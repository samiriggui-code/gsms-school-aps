#!/usr/bin/env python3
import sqlite3
import sys

db = sys.argv[1] if len(sys.argv) > 1 else "/tmp/n8n-now.sqlite"
c = sqlite3.connect(db)
rows = c.execute(
    "SELECT id, name, active FROM workflow_entity WHERE name LIKE 'GSMS%' ORDER BY name"
).fetchall()
print(f"Total GSMS: {len(rows)}")
for r in rows:
    print(r)
