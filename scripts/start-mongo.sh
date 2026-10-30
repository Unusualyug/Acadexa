#!/usr/bin/env bash
# Starts a local MongoDB for development, downloading a static binary if needed.
# Usage: ./scripts/start-mongo.sh   (then Ctrl-C or `mongod --shutdown` to stop)
set -euo pipefail

VERSION="7.0.14"
ARCHIVE="mongodb-linux-x86_64-ubuntu2204-${VERSION}.tgz"
BIN_DIR="${HOME}/.local/mongo/mongodb-linux-x86_64-ubuntu2204-${VERSION}/bin"
DB_PATH="$(cd "$(dirname "$0")/.." && pwd)/server/.data/db"

if [ ! -x "${BIN_DIR}/mongod" ]; then
  echo "==> Downloading MongoDB ${VERSION}"
  mkdir -p "${HOME}/.local/mongo"
  curl -sSL "https://fastdl.mongodb.org/linux/${ARCHIVE}" -o /tmp/mongo.tgz
  tar xzf /tmp/mongo.tgz -C "${HOME}/.local/mongo"
  rm /tmp/mongo.tgz
fi

mkdir -p "${DB_PATH}" "$(dirname "${DB_PATH}")/logs"
if pgrep -f "mongod --dbpath ${DB_PATH}" >/dev/null 2>&1; then
  echo "==> MongoDB already running on 27017"
  exit 0
fi

echo "==> Starting mongod (dbpath: ${DB_PATH})"
exec "${BIN_DIR}/mongod" --dbpath "${DB_PATH}" --port 27017 --bind_ip 127.0.0.1 \
  --logpath "$(dirname "${DB_PATH}")/logs/mongod.log" --fork && echo "==> mongod up on 127.0.0.1:27017"
