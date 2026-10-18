# EpidemAI

**Public health signals, translated into practical next steps.**

EpidemAI is a prototype public-health platform for exploring disease signals and connecting people with health information. It brings together two experiences: an exploratory surveillance dashboard for public-health teams and an individual portal for general symptom guidance, historical local context, and government health scheme discovery.

> **Demo status:** This repository is a research and demonstration prototype. Dashboard records are bundled sample data, and the district forecast is based on historical research data through June 2022. It is not a live surveillance system, medical device, or source of diagnosis or official decisions.

## Why EpidemAI

Public-health information is spread across dashboards, reports, and service directories. EpidemAI makes these workflows easier to explore in one accessible interface while showing users where data came from and what the tools can and cannot tell them.

- **For public-health exploration:** see city and district signals, compare locations, inspect trends, and explore hypothetical environmental changes.
- **For individuals:** report symptoms through a guided assistant, review general next steps, explore dated local records, and discover relevant health schemes and care services.
- **For maintainers:** connect optional public-health news collection and source-linked scheme updates without putting provider credentials in browser code.

## Try the demo

Start both services from the repository root:

```bash
./run-local.sh
```

Then open:

- **App:** <http://localhost:8080>
- **API health:** <http://localhost:8000/api/health>
- **Interactive API docs:** <http://localhost:8000/docs>

### A quick walkthrough

1. Open **Individual Health Portal** from the landing page.
2. Choose **Report symptoms**, then **Load sample demo**.
3. Review the fictional symptom summary and the general-information notice.
4. Continue to see safety guidance and historical district records for Wardha, Maharashtra.
5. Open **Schemes & care** to explore source-linked public benefit and care information.
6. Return to the landing page and explore the government dashboard, maps, comparisons, and forecast tools.

The sample scenario is fictional; Wardha is selected because the bundled historical dataset contains matching records. It is not a real person or a current outbreak report.

## What you can explore

| Experience | What it includes |
| --- | --- |
| Public-health dashboard | City summaries, maps, charts, alerts, and news |
| Disease map | Geographic view of city-level demonstration signals |
| Trends and comparisons | Explore historical sample trends and compare selected cities |
| Predictive tools | Inspect experimental district estimates and risk-region summaries |
| What-if explorer | Explore hypothetical changes to environmental inputs |
| Reporter prototype | Preview a field-reporting workflow |
| Individual Health Portal | Symptom guidance, local historical context, and opt-in browser history |
| Schemes & care | Filter scheme and service information using user-provided details, with source links |
| Optional news ingestion | Collect and normalize public-health articles through TinyFish |

## How it works

```text
React + TypeScript (Vite)
       │ JSON over HTTP
       ▼
FastAPI API ── sample dashboard services
       ├─────── historical EpiClim forecast service
       ├─────── rule-based health assistant
       ├─────── source-linked scheme catalog and optional sync
       └─────── optional TinyFish news ingestion → SQLite
```

The frontend lives in `frontend/`; the API and analysis helpers live in `backend/`. The API is documented automatically at `/docs` while running. A more detailed code map and data-source explanation is in [Project overview](docs/PROJECT_OVERVIEW.md). See also the [personal health assistant implementation guide](PERSONAL_HEALTH_ASSISTANT_IMPLEMENTATION.md) and [TinyFish integration guide](docs/TINYFISH_INTEGRATION.md).

## Data and model transparency

- Dashboard city metrics, alerts, trends, and much of the news feed use bundled demonstration records in `backend/app/data/seed_data.py`.
- EpiClim uses a bundled district-level research dataset with irregular outbreak reports. The included trained dengue model uses data ending in June 2022; its outputs are historical experimental estimates, not current forecasts.
- Analysis helpers include moving averages, damped trend projection, statistical anomaly checks, and keyword matching. These are exploratory prototype methods and have not been validated for operational public-health decisions.
- TinyFish is an optional article collection path. Collected articles do not become verified case counts or official alerts.
- Scheme information is source-linked. Matching results are informational and do not constitute an official eligibility decision.

## Privacy and responsible use

- The symptom assistant provides general information, not diagnosis, an individual disease probability, or test selection. It can miss warning signs; seek professional care when seriously unwell.
- Symptom history is optional and browser/session scoped; the prototype has no account system or cross-device history. Review the in-app privacy choices before saving anything.
- Do not enter confidential or identifying health information into this demonstration.
- The government portal is a sample interface without secure government authentication. Do not use it for official decisions.
- Always follow the linked source or consult a qualified health professional or responsible authority for decisions.

## Run locally

### Prerequisites

- Node.js and npm
- Python 3.10 or newer

The launcher uses an existing backend environment from `.venv-new`, `.venv-local`, or `.venv`, plus `frontend/node_modules`. If dependencies are not installed, set them up first:

```bash
cd frontend
npm install
cd ../backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

Then start the app:

```bash
./run-local.sh
```

Copy the example environment files if you need to change local settings:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

The default local setup uses bundled data and does not require external API keys. Keep secrets in the backend environment only; never put them in frontend `VITE_*` variables.

### Run services separately

Backend, from `backend/` with its virtual environment activated:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend, from `frontend/`:

```bash
npm run dev -- --host 0.0.0.0 --port 8080
```

The frontend API base can be set with `VITE_API_URL`, for example `http://localhost:8000/api`. The backend's `CORS_ORIGINS` must include the frontend's exact origin.

## Optional integrations

### TinyFish news collection

TinyFish collection is optional and requires a TinyFish API key plus a separate ingestion secret. Configure `TINYFISH_API_KEY`, `TINYFISH_SOURCE_URLS`, and `INGEST_API_KEY` in `backend/.env`. Then request a collection run:

```bash
curl -X POST http://localhost:8000/api/ingest/tinyfish \
  -H "X-Ingest-Key: YOUR_INGEST_API_KEY"
```

Check configuration and stored article count at `GET /api/ingest/tinyfish/status`. Collection can consume provider usage. Read the [TinyFish integration guide](docs/TINYFISH_INTEGRATION.md) before enabling it.

### Government scheme refresh

The scheme catalog can be refreshed from configured sources when an Anthropic API key and model are provided in the backend environment. Review proposed source changes and the sync implementation before enabling automated refresh. The bundled catalog remains available without credentials.

## Build the frontend

```bash
cd frontend
npm run build
```

## Deployment

The repository includes a `render.yaml` backend service definition. The frontend can be deployed as a Vite app on a static hosting provider.

- **Frontend:** root directory `frontend`, build command `npm run build`, output directory `dist`, set `VITE_API_URL` to the deployed backend's `/api` URL.
- **Backend:** root directory `backend`, install with `pip install -r requirements.txt`, start with `uvicorn app.main:app --host 0.0.0.0 --port $PORT`; configure `ENVIRONMENT` and `CORS_ORIGINS`.
- **Persistence:** configure persistent storage for SQLite-backed TinyFish articles if they must survive host restarts or redeploys.

See the repository deployment configuration and integration guide for provider-specific setup. Never commit `.env` files or expose backend secrets to the frontend.

## Repository map

```text
frontend/src/pages/       App pages and user workflows
frontend/src/components/  Reusable interface components
frontend/src/hooks/       API and data hooks
backend/app/api/routes/   FastAPI route handlers
backend/app/services/     Analysis, assistant, forecast, and integration logic
backend/app/data/         Seed records, datasets, models, and scheme catalog
docs/                     Project, implementation, and integration guides
```

## Contributing

Issues and pull requests are welcome. For useful reports, include the page or endpoint, reproduction steps, expected behavior, and observed behavior. Please avoid sharing personal health information, secrets, or private credentials in issues.
