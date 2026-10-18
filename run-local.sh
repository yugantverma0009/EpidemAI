#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_PYTHON="$BACKEND_DIR/.venv-py312/bin/python"
if [ ! -x "$BACKEND_PYTHON" ]; then
  BACKEND_PYTHON="$BACKEND_DIR/.venv/bin/python"
fi
if [ ! -x "$BACKEND_PYTHON" ]; then
  BACKEND_PYTHON="$BACKEND_DIR/.venv-local/bin/python"
fi
if [ ! -x "$BACKEND_PYTHON" ]; then
  BACKEND_PYTHON="$BACKEND_DIR/.venv-new/bin/python"
fi

if [ ! -x "$BACKEND_PYTHON" ]; then
  echo "Backend virtualenv Python not found in .venv-local or .venv"
  echo "Recreate the backend virtualenv and install requirements first."
  exit 1
fi

if ! "$BACKEND_PYTHON" -c "import sklearn" >/dev/null 2>&1; then
  echo "The selected backend environment is missing scikit-learn, which the EpiClim What-if models require."
  echo "Install backend dependencies with: $BACKEND_PYTHON -m pip install -r \"$BACKEND_DIR/requirements.txt\""
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
"$BACKEND_PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "Starting frontend on http://localhost:8080 ..."
cd "$FRONTEND_DIR"
npm run dev -- --host 0.0.0.0 --port 8080
