# EpidemAI — Public Health Intelligence & Predictive Epidemic Forecasting

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-3776AB.svg?logo=python&logoColor=white)](https://www.python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **EpidemAI** is an end-to-end epidemic surveillance and individual health intelligence platform. It bridges macroeconomic public health surveillance with micro-level personalized health navigation, featuring operational machine learning forecasting across 6 climate-sensitive vector-borne diseases and a safety-first clinical symptom triaging engine.

📖 **For the complete 360° technical specification, read the [Master Project Documentation](docs/PROJECT_DOCUMENTATION.md).**

---

## 🌟 Key Capabilities

### 1. 🏛️ Public Health Surveillance Suite (Portal 1)
- **Surveillance Command Center (`/dashboard`):** Real-time tracking of active caseloads, infection velocities, municipal risk ratings, and prioritized response actions.
- **Interactive Disease Map (`/disease-map`):** Geospatial visualization of municipal epidemic hotspots, climate indicators (temperature, rainfall), and hospital bed utilization.
- **Trend Analytics & Outbreak Anomaly Detection (`/trends`):** Multi-city historical time series with rolling moving averages and statistical $z$-score anomaly detection.
- **Early Warning Alerts (`/alerts`):** Automated alert feeds triaged by urgency (Critical, High, Moderate) with operational response playbooks.
- **Multi-City Comparison (`/compare`):** Side-by-side analytical benchmarking across demographics, testing capabilities, and climate vulnerabilities.
- **Frontline Field Reporter (`/reporter`):** Mobile-first offline logging portal for ASHA and ANM community health workers.
- **Municipal Operations Portal (`/gov-portal`):** Healthcare logistics management for bed allocations, vector control operations, and medical supplies.

### 2. 🧠 EpiClim Predictive Machine Learning Engine
- **6 Vector-Borne & Climate-Sensitive Diseases:**
  - 🦟 **Dengue**
  - 💧 **Acute Diarrheal Disease (ADD)**
  - 🦟 **Chikungunya**
  - 🧪 **Cholera**
  - 🦟 **Malaria**
  - 🧠 **Acute Encephalitis Syndrome (AES)**
- **3 Trained ML Architectures:** Ridge Regression (pure-NumPy inference with sub-12ms latency), Random Forest, and Gradient Boosting Regressors.
- **Coverage:** 300+ Indian districts with 6-month predictive horizons, 95% confidence intervals, and benchmark evaluations against seasonal baselines.
- **What-If Climate Simulation Studio (`/what-if`):** Interactive sensitivity modeling assessing the impact of temperature variations, rainfall swings, and vegetation indices (LAI) on transmission dynamics.

### 3. 🩺 Individual Health Portal & Personal Health Assistant (Portal 2)
- **🤖 Personal Health Assistant & Clinical Copilot (`/ai-assistant`):** Dedicated **Hackathon Track 2** conversational health assistant that understands multi-intent inquiries and autonomously executes 4 clinical tools:
  - 💬 **Smart Intent Handling:** Accurately distinguishes between casual greetings (*"Hello"*, *"Namaste"*), general health and prevention inquiries (*"How to prevent dengue?"*, *"What is normal BP?"*), and active symptom complaints without false disease hallucinations.
  - 🚨 **Tool 1: Red-Flag Emergency Triage:** Instant safety net triggering critical alerts and direct dispatch to 108 (Ambulance) and 112 (National Emergency).
  - 🗺️ **Tool 2: Regional EpiClim Surveillance:** Cross-references symptoms against 13-year district epidemiological records (2009–2022) to evaluate seasonal transmission risk.
  - 🔬 **Tool 3: Differential Disease & Cost Optimizer:** Evaluates match percentages across 25+ tropical conditions and recommends specific targeted lab tests (e.g. Dengue NS1 @ ₹450 vs ₹4,800 blanket panels).
  - 🏛️ **Tool 4: Ayushman Bharat & Welfare Scheme Navigator:** Multi-attribute eligibility matching for PM-JAY (₹5 Lakh cashless hospital cover), ABHA digital health IDs, and state-specific welfare.
- **📋 Structured Diagnostic Triage & Lab Cost Optimizer (`/health-assistant`):** Dedicated guided 4-step intake for citizens preferring structured symptom duration counters (`+`/`-`) and severity steppers.
- **Multilingual & Multimodal Voice:** Full natural language understanding in English, Hindi, and Hinglish with integrated Web Speech voice transcription.
- **Zero-Failure Autonomous Engine:** High-performance deterministic clinical pipeline executes identical multi-tool orchestration with sub-millisecond local rule fallback.
- **Privacy-Preserving Architecture:** Zero required user accounts, zero PII logging, and client-side session-gated SQLite storage with instant JSON export and one-click deletion.

---

## 🏗️ Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                 React + TypeScript (Vite)                   │
│       Tailwind CSS • TanStack Query • Framer Motion         │
│                 http://localhost:8080                       │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API / JSON (CORS)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 FastAPI Backend (Uvicorn)                   │
│                 http://localhost:8000                       │
│                                                             │
│  ├── /api/dashboard, /map-data, /city, /compare, /trends    │
│  ├── /api/epiclim (forecast, whatif, diseases, districts)   │
│  ├── /api/assistant (agent/chat, triage, diagnostic)        │
│  └── /api/health/schemes (catalog, match)                   │
│                                                             │
│  Services:                                                  │
│  ├── gemini_agent_service.py (Personal Assistant + 4 tools) │
│  ├── epiclim_service.py (pure NumPy Ridge dot-product)      │
│  ├── disease_prediction_service.py (differential models)   │
│  ├── guidance_service.py & safety_service.py (red flags)    │
│  └── health_navigator.py (government scheme matching)       │
│                                                             │
│  Data & Models:                                             │
│  ├── epiclim_final_data.csv (10,000+ surveillance records)  │
│  ├── LLM Integration / Autonomous Rule Fallback Engine      │
│  ├── Pre-trained JSON Ridge weights & Scikit-learn PKLs     │
│  └── SQLite stores (assistant sessions & check-in history)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- **Node.js** (v18.0.0 or newer)
- **Python** (v3.10, 3.11, or 3.12)

### One-Command Launch
Clone the repository and run the startup script:
```bash
git clone https://github.com/yugantverma0009/EpidemAI.git
cd EpidemAI
chmod +x run-local.sh
./run-local.sh
```

Once running, access:
- **Application Frontend:** [http://localhost:8080](http://localhost:8080)
- **API Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)
- **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🛠️ Manual Installation

### 1. Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev -- --port 8080
```

### 3. Environment Variables
- **Frontend (`frontend/.env`):**
  ```env
  VITE_API_URL=http://127.0.0.1:8000/api
  ```
- **Backend (`backend/.env`):**
  ```env
  CORS_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
  ```

---

## 📁 Repository Structure

```text
EpidemAI/
├── docs/
│   └── PROJECT_DOCUMENTATION.md                 # Complete Master Project Documentation
├── README.md                                    # Project overview & quick start
├── run-local.sh                                 # Unified service launch script
├── render.yaml                                  # Cloud deployment descriptor
├── backend/
│   ├── requirements.txt                         # Python dependencies
│   ├── app/
│   │   ├── main.py                              # FastAPI initialization & routers
│   │   ├── api/routes/                          # API endpoint controllers
│   │   ├── services/                            # ML forecasting, triage & NLP logic
│   │   │   └── assistant/                       # Clinical safety, guidance, diagnostic
│   │   └── data/
│   │       ├── seed_data.py                     # Baseline surveillance records
│   │       ├── datasets/epiclim_final_data.csv  # 2009–2022 surveillance dataset
│   │       └── models/                          # Trained ML model weights
└── frontend/
    ├── package.json                             # Frontend dependencies & scripts
    ├── vite.config.ts                           # Vite build configuration
    └── src/
        ├── pages/                               # Application pages & route views
        ├── components/                          # UI components & design system
        └── hooks/useApi.ts                      # TanStack Query API hooks
```

## ☁️ Deployment

- **Frontend on Vercel:** Import the repository, set the project root to `frontend`, and add `VITE_API_URL` in Project Settings → Environment Variables. Set it to the Render backend URL followed by `/api` (for example, `https://epidemai-backend.onrender.com/api`), then redeploy.
- **Backend on Render:** Create a Blueprint Instance from the repository root; [`render.yaml`](./render.yaml) configures the FastAPI service on the Free plan, including its health check and production environment.
- The Render Blueprint allows the `https://epidemai.vercel.app` frontend origin. If the Vercel domain differs, update `CORS_ORIGINS` in Render to match it. Free Render services spin down when idle, so the first request after inactivity may take longer.

---

## 🛡️ Responsible AI & Clinical Disclaimer

> **IMPORTANT CLINICAL & REGULATORY NOTICE:**  
> EpidemAI is an exploratory research and public health surveillance demonstration prototype. It is **not** a certified Software as a Medical Device (SaMD) under CDSCO, FDA, or CE regulations and does not provide formal medical diagnoses, clinical treatment orders, or diagnostic test selections.  
> Users experiencing severe or acute warning signs must immediately contact qualified emergency medical professionals or call national emergency numbers (**108** / **112** in India).

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
