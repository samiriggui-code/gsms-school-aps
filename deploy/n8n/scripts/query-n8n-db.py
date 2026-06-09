import sqlite3
c = sqlite3.connect("/tmp/n8n.sqlite")
print("folders:", c.execute("SELECT id,name,projectId FROM folder").fetchall())
print("workflows:")
for r in c.execute("SELECT id,name,active,parentFolderId FROM workflow_entity ORDER BY name"):
    print(r)
