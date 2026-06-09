#!/usr/bin/env python3
"""Import GSMS workflows dans le dossier n8n « gsms » — opérationnels uniquement."""
import glob
import sqlite3
import datetime
import subprocess
import sys
import time
from pathlib import Path

CONTAINER = "n8n-k2pw-n8n-1"
PROJECT_ID = "qRRKIBKP4Foknqq6"
FOLDER_NAME = "gsms"
DB_IN_CONTAINER = "/home/node/.n8n/database.sqlite"
LOCAL_DB = "/tmp/n8n-gsms.sqlite"
LOCAL_WAL = LOCAL_DB + "-wal"
LOCAL_SHM = LOCAL_DB + "-shm"

OPERATIONAL = [
    "gsms-00-standard-webhooks.json",
    "gsms-02-cron-stats-worker.json",
    "gsms-03-sonde-disponibilite.json",
]

DELETE_IDS = [
    "a1b1c1d1-e001-4000-8000-000000000001",  # hub legacy
    "a1b1c1d1-e004-4000-8000-000000000004",  # devis gap doc
    "a1b1c1d1-e005-4000-8000-000000000005",  # parcours ref doc
]

DEPRECATE_IDS = DELETE_IDS

ACTIVATE_IDS = [
    "a1b1c1d1-e000-4000-8000-000000000000",  # webhook standard
    "a1b1c1d1-e003-4000-8000-000000000003",  # sonde 5 min
    "a1b1c1d1-e002-4000-8000-000000000002",  # cron stats 1h
]

_WORKFLOW_ID_TABLES = (
    "workflows_tags",
    "shared_workflow",
    "webhook_entity",
    "workflow_history",
    "workflow_statistics",
    "workflow_publish_history",
    "workflow_published_version",
    "processed_data",
    "test_run",
    "evaluation_collection",
    "evaluation_config",
    "insights_metadata",
    "chat_hub_messages",
    "chat_hub_sessions",
    "ai_builder_temporary_workflow",
    "workflow_builder_session",
    "workflow_dependency",
    "execution_entity",
)


def run(cmd, check=True):
    print("+", " ".join(cmd))
    return subprocess.run(cmd, check=check, text=True, capture_output=not check)


def copy_db_from_container():
    """Copie sqlite + WAL pour ne pas perdre les écritures n8n."""
    run(["docker", "cp", f"{CONTAINER}:{DB_IN_CONTAINER}", LOCAL_DB])
    run(["docker", "cp", f"{CONTAINER}:{DB_IN_CONTAINER}-wal", LOCAL_WAL], check=False)
    run(["docker", "cp", f"{CONTAINER}:{DB_IN_CONTAINER}-shm", LOCAL_SHM], check=False)


def copy_db_to_container():
    """Réinjecte la DB et supprime WAL/SHM (évite restauration des legacy)."""
    run(["docker", "cp", LOCAL_DB, f"{CONTAINER}:{DB_IN_CONTAINER}"])
    run(["docker", "exec", CONTAINER, "rm", "-f", f"{DB_IN_CONTAINER}-wal", f"{DB_IN_CONTAINER}-shm"], check=False)
    for f in glob.glob("/var/lib/docker/volumes/n8n-k2pw_n8n_data/_data/database.sqlite*"):
        subprocess.run(["chown", "1000:1000", f], check=False)


def delete_workflows_from_db(conn: sqlite3.Connection, workflow_ids: list[str]) -> None:
    if not workflow_ids:
        return
    cur = conn.cursor()
    deleted = []
    for wid in workflow_ids:
        row = cur.execute(
            "SELECT id, name FROM workflow_entity WHERE id=?",
            (wid,),
        ).fetchone()
        if not row:
            continue
        for table in _WORKFLOW_ID_TABLES:
            try:
                cur.execute(f"DELETE FROM {table} WHERE workflowId=?", (wid,))
            except sqlite3.OperationalError:
                pass
        cur.execute("DELETE FROM workflow_entity WHERE id=?", (wid,))
        deleted.append(f"{row[1]} ({wid})")
    conn.commit()
    if deleted:
        print("Supprimés:", *deleted, sep="\n  - ")
    else:
        print("Aucun workflow legacy à supprimer (déjà absents).")


def finalize_sqlite(path: str) -> None:
    """Fusionne WAL dans le fichier principal (sinon les deletes disparaissent au redémarrage)."""
    conn = sqlite3.connect(path)
    conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    conn.execute("VACUUM")
    conn.commit()
    conn.close()
    for suffix in ("-wal", "-shm"):
        p = path + suffix
        try:
            Path(p).unlink()
        except FileNotFoundError:
            pass


def main():
    src = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/gsms-n8n")
    if not src.is_dir():
        print(f"ERREUR: dossier introuvable {src}", file=sys.stderr)
        sys.exit(1)

    run(["docker", "network", "connect", "gsms", CONTAINER], check=False)

    for name in OPERATIONAL:
        f = src / name
        if not f.is_file():
            print(f"ERREUR: manquant {f}", file=sys.stderr)
            sys.exit(1)
        run(["docker", "cp", str(f), f"{CONTAINER}:/tmp/gsms-n8n/{name}"])
        run([
            "docker", "exec", CONTAINER, "n8n", "import:workflow",
            f"--input=/tmp/gsms-n8n/{name}",
            f"--projectId={PROJECT_ID}",
        ])

    run(["docker", "stop", CONTAINER])
    copy_db_from_container()

    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    c = sqlite3.connect(LOCAL_DB)
    delete_workflows_from_db(c, DELETE_IDS)

    row = c.execute(
        "SELECT id FROM folder WHERE name=? AND projectId=?",
        (FOLDER_NAME, PROJECT_ID),
    ).fetchone()
    if row:
        folder_id = row[0]
    else:
        folder_id = "gsms-folder-personal"
        c.execute(
            "INSERT INTO folder (id, name, parentFolderId, projectId, createdAt, updatedAt) "
            "VALUES (?,?,?,?,?,?)",
            (folder_id, FOLDER_NAME, None, PROJECT_ID, now, now),
        )
    names = (
        "GSMS — Webhook standard (landing + CRM)",
        "GSMS — Cron stats (équiv. worker)",
        "GSMS — Sonde apps (5 min)",
    )
    for n in names:
        c.execute(
            "UPDATE workflow_entity SET parentFolderId=? WHERE name=?",
            (folder_id, n),
        )
    for wid in ACTIVATE_IDS:
        c.execute("UPDATE workflow_entity SET active=1 WHERE id=?", (wid,))
    c.commit()
    c.close()

    finalize_sqlite(LOCAL_DB)

    print("Dossier:", folder_id)
    verify = sqlite3.connect(LOCAL_DB)
    for r in verify.execute(
        "SELECT id, name, active FROM workflow_entity WHERE name LIKE 'GSMS%' ORDER BY name"
    ):
        print(r)
    verify.close()

    copy_db_to_container()
    run(["docker", "start", CONTAINER])
    time.sleep(14)
    for wid in ACTIVATE_IDS:
        run(["docker", "exec", CONTAINER, "n8n", "publish:workflow", f"--id={wid}"], check=False)
    run(["docker", "restart", CONTAINER])
    time.sleep(12)
    run(["docker", "exec", CONTAINER, "n8n", "list:workflow", "--active=true"], check=False)
    print("=== OK — 3 workflows GSMS publiés (legacy supprimés de la DB) ===")


if __name__ == "__main__":
    main()
