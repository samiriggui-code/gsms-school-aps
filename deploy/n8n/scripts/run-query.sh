#!/bin/sh
set -e
docker cp n8n-k2pw-n8n-1:/home/node/.n8n/database.sqlite /tmp/n8n.sqlite
python3 /tmp/query-n8n-db.py
