# EpidemAI Backend

Python FastAPI backend for epidemic intelligence with AI/ML services.

## Setup

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

## Development

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at http://localhost:8000/docs

## API Endpoints

| Route | Description |
|---|---|
| GET /api/dashboard | Stats summary |
| GET /api/map-data | All cities with coordinates and risk |
| GET /api/city/{name} | City detail |
| GET /api/compare?cities=Delhi,Mumbai | Side-by-side comparison |
| GET /api/alerts | Active disease alerts |
| GET /api/trends | Monthly time-series |
| GET /api/insights | AI-generated insights |
| GET /api/news | Disease-related news |
| GET /api/health | Health check |

## Deploy on Render

1. Push to GitHub
2. Create Web Service on render.com
3. Runtime: Python 3
4. Root Directory: `backend`
5. Build: `pip install -r requirements.txt`
6. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
7. Add env: `ENVIRONMENT=production`
8. Add env: `CORS_ORIGINS=https://your-frontend.vercel.app`

Health check after deploy:

```text
https://your-render-service.onrender.com/api/health
```

## AI/ML Services

- **prediction_service.py** — Moving average trend detection, weighted forecasting
- **anomaly_service.py** — Z-score statistical anomaly detection
- **nlp_service.py** — Disease/symptom/location entity extraction
