#!/usr/bin/env bash

set -euo pipefail

generatePassword() {
  openssl rand -hex 16
}

ENV_FILE="$(cd "$(dirname "$0")" && pwd)/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing .env — copy .env.example to .env first." >&2
  exit 1
fi

JICOFO_AUTH_PASSWORD=$(generatePassword)
JVB_AUTH_PASSWORD=$(generatePassword)
JIGASI_XMPP_PASSWORD=$(generatePassword)
JIGASI_TRANSCRIBER_PASSWORD=$(generatePassword)
JIBRI_RECORDER_PASSWORD=$(generatePassword)
JIBRI_XMPP_PASSWORD=$(generatePassword)

sed -i.bak \
  -e "s#JICOFO_AUTH_PASSWORD=.*#JICOFO_AUTH_PASSWORD=${JICOFO_AUTH_PASSWORD}#g" \
  -e "s#JVB_AUTH_PASSWORD=.*#JVB_AUTH_PASSWORD=${JVB_AUTH_PASSWORD}#g" \
  -e "s#JIGASI_XMPP_PASSWORD=.*#JIGASI_XMPP_PASSWORD=${JIGASI_XMPP_PASSWORD}#g" \
  -e "s#JIGASI_TRANSCRIBER_PASSWORD=.*#JIGASI_TRANSCRIBER_PASSWORD=${JIGASI_TRANSCRIBER_PASSWORD}#g" \
  -e "s#JIBRI_RECORDER_PASSWORD=.*#JIBRI_RECORDER_PASSWORD=${JIBRI_RECORDER_PASSWORD}#g" \
  -e "s#JIBRI_XMPP_PASSWORD=.*#JIBRI_XMPP_PASSWORD=${JIBRI_XMPP_PASSWORD}#g" \
  "${ENV_FILE}"

rm -f "${ENV_FILE}.bak"

echo "Passwords written to ${ENV_FILE}"
