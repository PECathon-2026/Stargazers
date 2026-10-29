# Tsukuyomi Watch API

Small Node.js backend for the hackathon demo. It uses Node 18+ built-in modules and needs no `npm install`.

## Run locally

In one terminal:

```powershell
cd backend
npm start
```

The API listens on port 3001 by default. Set `PORT` to use another port.

In a second terminal, start the Vite frontend with `cd frontend; npm run dev`. Vite proxies `/api/*` to the backend.

## Routes

- `GET /api/health` — API health status.
- `GET /api/weather?latitude=13.08&longitude=80.27` — live current cloud cover, visibility, humidity, and a simple Night Honor Score from Open-Meteo. Both coordinates are required and range checked. The score is a demo heuristic, not an astronomy forecast.
- `GET /api/moon` — approximate current moon phase and illumination, calculated from a known new moon and the average synodic month. This is an approximation.
- `GET /api/events` — sample event cards. The response identifies them as `source: "demo"`; they are not live event predictions.

Weather upstream failures return HTTP 502 with a JSON `error`. Invalid coordinates return HTTP 400.
