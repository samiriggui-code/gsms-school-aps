#!/bin/bash
# Compat — délégué vers GSMS Storage.
# shellcheck source=scripts/deploy/_gsms-storage.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_gsms-storage.sh"

capture_vps_pre_deploy_backup() {
  capture_gsms_storage_backup rebuild "${1:-rebuild}"
}
