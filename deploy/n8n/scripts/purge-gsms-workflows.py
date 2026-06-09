#!/usr/bin/env python3
"""Supprime tous les workflows GSMS de la base n8n (n8n arrêté)."""
import sqlite3
import sys

db = sys.argv[1] if len(sys.argv) > 1 else "/var/lib/docker/volumes/n8n-k2pw_n8n_data/_data/database.sqlite"

conn = sqlite3.connect(db)
cur = conn.cursor()
rows = cur.execute("SELECT id, name FROM workflow_entity WHERE name LIKE 'GSMS%'").fetchall()
if not rows:
    print("Aucun workflow GSMS.")
    sys.exit(0)

ids = [r[0] for r in rows]
print(f"Suppression de {len(ids)} workflow(s):")
for wid, name in rows:
    print(f"  - {name}")

tables = [
    "workflows_tags", "shared_workflow", "webhook_entity", "workflow_history",
    "workflow_statistics", "workflow_publish_history", "workflow_published_version",
    "processed_data", "test_run", "evaluation_collection", "evaluation_config",
    "insights_metadata", "chat_hub_messages", "chat_hub_sessions",
    "ai_builder_temporary_workflow", "workflow_builder_session", "workflow_dependency",
    "execution_entity",
]

for wid in ids:
    for table in tables:
        try:
            cur.execute(f"DELETE FROM {table} WHERE workflowId=?", (wid,))
        except sqlite3.OperationalError:
            pass
    cur.execute("DELETE FROM workflow_entity WHERE id=?", (wid,))

conn.commit()
remaining = cur.execute("SELECT COUNT(*) FROM workflow_entity WHERE name LIKE 'GSMS%'").fetchone()[0]
conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
conn.execute("VACUUM")
conn.commit()
conn.close()
print(f"OK — restants GSMS: {remaining}")
