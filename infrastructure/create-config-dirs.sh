#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "${ROOT}"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

CONFIG="${CONFIG:-./jitsi-cfg}"

mkdir -p \
  "${CONFIG}/web" \
  "${CONFIG}/web/crontabs" \
  "${CONFIG}/transcripts" \
  "${CONFIG}/prosody/config" \
  "${CONFIG}/prosody/prosody-plugins-custom" \
  "${CONFIG}/jicofo" \
  "${CONFIG}/jvb" \
  "${CONFIG}/jibri"

echo "Created Jitsi config directories under ${CONFIG}"
