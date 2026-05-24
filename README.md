# EpidemAI

EpidemAI is a two-part local app:

- `frontend/` — Vite + React dashboard on `http://localhost:8080`
- `backend/` — FastAPI API on `http://localhost:8000`

## Local Run

From the project root:

```bash
chmod +x run-local.sh
./run-local.sh
```

This starts both services together with the frontend already pointed at the backend API.

## Notes

- The backend in this folder includes a `.venv`, but some generated launcher scripts inside it use an old absolute path. `run-local.sh` avoids those broken wrappers and starts the backend with the correct local site-packages path.
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
