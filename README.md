# EpidemAI

EpidemAI is an AI-driven public health surveillance and prediction system designed for the early detection of disease outbreaks. The project utilizes Natural Language Processing (NLP) and time-series forecasting to provide actionable insights for public health monitoring.

## Project Overview

The system integrates various technologies to track disease trends, analyze regional risks, and provide AI-generated insights. It is specifically designed to support public health surveillance with a focus on the Indian context, utilizing datasets from sources like Kaggle and Data.gov.in.

## Repository Structure

The project is divided into two primary components:

* /frontend: The user interface and visualization dashboard.
* /backend: The REST API and data processing engine.

## Getting Started

### Backend Setup
1. Navigate to the backend directory.
2. Install dependencies: npm install
3. Create a .env file from the .env.example template.
4. Start the development server: npm run dev
The server will be available at http://localhost:5000.

### Frontend Setup
1. Navigate to the frontend directory.
2. Install dependencies: npm install
3. Configure the VITE_API_URL in your .env file to point to your backend (default: http://localhost:5000/api).
4. Start the development server: npm run dev

## API Endpoints

The backend provides several key endpoints for data retrieval:

* GET /api/dashboard: Summary of all cities.
* GET /api/map-data: City clusters for heatmap visualization.
* GET /api/alerts: Filterable alert list by severity.
* GET /api/trends: Monthly disease trend data.
* GET /api/insights: AI-generated health insights.
* GET /api/top-risk-regions: Ranked regions based on risk factors.

## Deployment

### Backend
The backend is configured for deployment on platforms like Render or Railway. Ensure the MONGODB_URI is set in your environment variables if using a persistent database.

### Frontend
The frontend is pre-configured for SPA routing and can be deployed easily via Vercel using the provided vercel.json configuration.
