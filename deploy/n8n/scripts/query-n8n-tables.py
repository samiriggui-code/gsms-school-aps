import sqlite3
c = sqlite3.connect("/tmp/n8n.sqlite")
tables = [r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall()]
for t in tables:
    if "workflow" in t.lower() or "folder" in t.lower():
        n = c.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        print(f"{t}: {n} rows")
        if n and n <= 30:
            cur = c.execute(f"SELECT * FROM {t} LIMIT 5")
            cols = [d[0] for d in cur.description]
            print("  cols:", cols[:12])
            for row in cur.fetchall():
                brief = row[:4] if len(row) > 4 else row
                print(" ", brief)
