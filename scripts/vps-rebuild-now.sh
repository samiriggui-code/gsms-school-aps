#!/bin/bash
set -euo pipefail
APP_ROOT=/opt/gsms-school
GSMS_DIR=/opt/gsms
GIT_REPO=https://github.com/samiriggui-code/gsms-school-final.git

cd "$APP_ROOT"
if [[ ! -d .git ]]; then
  git init
  git remote add origin "$GIT_REPO"
else
  git remote set-url origin "$GIT_REPO" 2>/dev/null || git remote add origin "$GIT_REPO"
fi
git fetch origin main
git reset --hard origin/main

export APP_ROOT GSMS_DIR SKIP_DB_INIT=1 REBUILD_WORKER=1
bash "$APP_ROOT/deploy/gsms/deploy.sh"
