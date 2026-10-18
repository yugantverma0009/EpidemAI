# EpidemAI

EpidemAI is a two-part local app:

- `frontend/` — Vite + React dashboard on `http://localhost:8080`
- `backend/` — FastAPI API on `http://localhost:8000`

The landing page provides separate Government and Individual Health Portal entry points. The individual portal lives at `/health-portal` and reuses the symptom assistant at `/health-assistant`. The government view remains a demonstration interface; secure government authentication is not configured.

### Health assistant demo

Open **Individual Health Portal → Report symptoms → Load sample demo**. The sample uses fictional symptoms and Wardha, Maharashtra, which has matching records in the bundled historical dataset. Review the symptom summary, acknowledge the general-information notice, and continue to see the assistant guidance and dated district records. The sample is not a real person's location or live outbreak data. The assistant does not diagnose, estimate an individual's disease probability, or select tests. See [the full implementation guide](PERSONAL_HEALTH_ASSISTANT_IMPLEMENTATION.md) for data sources and limitations.

For an explanation of the app, its current data sources, analysis helpers, and TinyFish's role, see [Project overview](docs/PROJECT_OVERVIEW.md). For TinyFish implementation and operations, see [TinyFish integration](docs/TINYFISH_INTEGRATION.md).

## Local Run

From the project root:

```bash
chmod +x run-local.sh
./run-local.sh
```

This starts both services together with the frontend already pointed at the backend API. The local URLs are `http://localhost:8080` and `http://localhost:8000`.

## Notes

- `run-local.sh` uses an available backend virtual environment (`.venv-new`, `.venv-local`, or `.venv`) and `frontend/node_modules`. If those dependencies are missing, install them using the commands in `backend/README.md` and `frontend/package.json`.
- `/health-portal` and `/health-assistant` are an individual-facing prototype with opt-in history and no account system. `/gov-portal` is a sample dashboard without secure government authentication; do not use it for official decisions or confidential data.
- Frontend production build works with:

```bash
cd frontend
npm run build
```

## Deploy

### Frontend on Vercel

Deploy the `frontend/` folder as a separate Vercel project.

Dashboard values:

- Framework Preset: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Environment variable:

- `VITE_API_URL=https://your-render-backend.onrender.com/api`

CLI commands:

```bash
cd frontend
vercel login
vercel link
vercel env add VITE_API_URL production
vercel --prod
```

When Vercel prompts for the env value, paste:

```text
https://your-render-backend.onrender.com/api
```

### Backend on Render

Deploy the `backend/` folder as a separate Render Web Service. A root-level `render.yaml` is included for the basic service definition.

Dashboard values:

- Runtime: `Python 3`
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Environment variables:

- `ENVIRONMENT=production`
- `CORS_ORIGINS=https://your-frontend-project.vercel.app`

The backend health endpoint after deploy will be:

```text
https://your-render-backend.onrender.com/api/health
```

### Recommended Order

1. Deploy backend on Render first.
2. Copy the Render backend URL.
3. Add that URL as `VITE_API_URL` in Vercel.
4. Deploy frontend on Vercel.
5. Copy the Vercel frontend URL.
6. Set `CORS_ORIGINS` in Render to that Vercel URL and redeploy the backend once.

### TinyFish news ingestion

The backend can collect public-health news with TinyFish and serve normalized articles through the existing `GET /api/news` endpoint. API keys stay on the backend.

For the integration flow, code map, security notes, and deployment details, see [TinyFish integration in EpidemAI](docs/TINYFISH_INTEGRATION.md).

Set these variables in `backend/.env` locally and in Render for deployment:

- `TINYFISH_API_KEY` — create a key in your TinyFish account.
- `TINYFISH_SOURCE_URLS` — comma-separated public source homepages; up to five are collected per run.
- `INGEST_API_KEY` — a separate strong secret authorizing collection runs.
- `TINYFISH_DB_PATH` — optional SQLite path. By default data is stored under `backend/app/data`; on Render, use a persistent disk mount path to retain articles across deploys.

Trigger collection manually (this may consume TinyFish usage):

```bash
curl -X POST http://localhost:8000/api/ingest/tinyfish \
  -H "X-Ingest-Key: YOUR_INGEST_API_KEY"
```

Check setup and stored article count at `GET /api/ingest/tinyfish/status`. To collect regularly, schedule the POST with a trusted scheduler and store `INGEST_API_KEY` there as a secret.
