#!/bin/sh
set -eu

data_dir="${VANE_DATA_DIR:-}"

if [ -z "$data_dir" ] && [ -n "${VANE_DATABASE_PATH:-}" ] && [ "${VANE_DATABASE_PATH}" != ":memory:" ]; then
  data_dir="$(dirname "$VANE_DATABASE_PATH")"
fi

data_dir="${data_dir:-/data}"

if [ "$(id -u)" = "0" ]; then
  mkdir -p "$data_dir"
  chown node:node "$data_dir"
  chmod u+rwx "$data_dir"

  if [ -n "${VANE_DATABASE_PATH:-}" ] && [ "${VANE_DATABASE_PATH}" != ":memory:" ]; then
    database_file="$(basename "$VANE_DATABASE_PATH")"

    for file in "$data_dir/$database_file" "$data_dir/$database_file-wal" "$data_dir/$database_file-shm"; do
      if [ -e "$file" ]; then
        chown node:node "$file"
      fi
    done
  fi

  exec gosu node "$@"
fi

exec "$@"
