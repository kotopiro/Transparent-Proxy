#!/usr/bin/env bash
set -euo pipefail
ZIPNAME="transparent-proxy-$(date +%Y%m%d-%H%M).zip"
zip -r ${ZIPNAME} web worker docker scripts README.md LICENSE -x "*.git/*" "*.DS_Store"
echo "Created ${ZIPNAME}"
