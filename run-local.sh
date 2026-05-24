#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_SITE_PACKAGES="$BACKEND_DIR/.venv/lib/python3.9/site-packages"

if [ ! -d "$BACKEND_SITE_PACKAGES" ]; then
  echo "Backend site-packages not found at: $BACKEND_SITE_PACKAGES"
  echo "Recreate the backend virtualenv and install requirements first."
  exit 1
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "Frontend dependencies are missing in $FRONTEND_DIR/node_modules"
  echo "Run: cd \"$FRONTEND_DIR\" && npm install"
  exit 1
fi

cleanup() {
  if [ -n "${BACKEND_PID:-}" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starting backend on http://localhost:8000 ..."
cd "$BACKEND_DIR"
PYTHONPATH="$BACKEND_SITE_PACKAGES" python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Starting frontend on http://localhost:8080 ..."
cd "$FRONTEND_DIR"
npm run dev -- --host 0.0.0.0 --port 8080
