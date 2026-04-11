# Silent Delivery Receipt Analyzer (SDRA)

Full-stack academic cybersecurity research platform for studying **silent delivery receipt timing behavior** in controlled, consent-based environments.

SDRA helps researchers analyze timing metadata patterns (RTT, acknowledgment behavior, linked-device estimates) without requiring live production messaging integration.

## Purpose

This system is built for:

- Academic research
- Controlled lab experiments
- Consent-only metadata timing analysis

This system is **not** intended for unauthorized surveillance, tracking, or non-consensual use.

## What The System Does

- Sends simulated probe events to authorized test devices
- Captures one or multiple receipt acknowledgments per probe
- Calculates RTT (`receipt_time - sent_time`)
- Infers:
  - Online/offline probability
  - Screen active/inactive probability
  - Estimated linked device count
- Streams updates in real time through Socket.IO
- Provides admin controls, user management, and CSV/PDF exports

## Key Benefits

- Fast experimental iteration for cybersecurity researchers
- Real-time visibility of timing signals and trends
- Role-based access control (`admin`, `researcher`)
- Consent enforcement in probe workflows
- Repeatable data generation via built-in simulator
- Easy extension path to real integrations later

## Tech Stack

- Frontend: React + Vite + Tailwind CSS + Chart.js
- Backend: Flask + Flask-SocketIO + Flask-JWT-Extended
- Database: PostgreSQL (Neon supported) or SQLite fallback for local dev
- Realtime: Socket.IO (websocket + polling fallback)

## Project Structure

```text
careless_whisper/
  backend/
    app/
      routes/
      models.py
      simulator.py
      sockets.py
      bootstrap.py
    config.py
    run.py
    requirements.txt
  frontend/
    src/
      pages/
      components/
      context/
      hooks/
      services/
    vite.config.js
    package.json
```

## Database Schema (Core Tables)

- `users`: login identity, role, credentials (bcrypt hash)
- `test_devices`: authorized test devices + consent state
- `probes`: sent probe metadata + status
- `receipts`: captured acknowledgments + RTT + raw payload
- `analysis_results`: persisted inference outputs per device/session

## Authentication & Roles

- Login via username **or** email + password
- JWT access token issued on login
- Roles:
  - `admin`: full access (users, devices, exports, simulator control)
  - `researcher`: analysis and probe workflows (no admin-only actions)
- No public registration endpoint in normal flow

## Environment Configuration

Create `backend/.env`:

```env
SECRET_KEY=replace-with-random-secret
JWT_SECRET_KEY=replace-with-random-secret
AUTH_ALLOW_SEED=false

# format: username|password|role|email;username2|password2|role|email2
PREDEFINED_USERS=admin1|AdminPass123!|admin|admin1@lab.com;research1|ResearchPass123!|researcher|research1@lab.com

DATABASE_URL=postgresql://<user>:<pass>@<host>/<db>?sslmode=require
DB_SSLMODE=require
```

Notes:

- `PREDEFINED_USERS` creates missing users on startup (does not overwrite existing users).
- For local quick start, backend falls back to SQLite if `DATABASE_URL` is not set.

## Local Setup & Run

### 1. Backend

```powershell
cd "D:\react project\careless_whisper\backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

Backend runs on `http://127.0.0.1:5000`.

### 2. Frontend

```powershell
cd "D:\react project\careless_whisper\frontend"
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Recommended First Test Flow

1. Login with one predefined user from `.env`
2. Open Admin Panel
3. Add a test device with **Consent verified = true**
4. Start simulator
5. Wait for probe/receipt data
6. Open RTT Analysis and run analysis
7. Verify dashboard charts and status predictions update

## API Overview

- Auth:
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- Devices:
  - `GET /api/devices`
  - `POST /api/devices` (admin)
  - `PUT /api/devices/<id>` (admin)
  - `DELETE /api/devices/<id>` (admin)
- Probes:
  - `GET /api/probes`
  - `POST /api/probes/send`
  - `GET /api/probes/stats`
- Receipts:
  - `GET /api/receipts`
  - `POST /api/receipts/capture`
- Analysis:
  - `GET /api/analysis/rtt`
  - `GET /api/analysis/status/<device_id>`
  - `POST /api/analysis/run`
  - `GET /api/analysis/history/<device_id>`
  - `GET /api/analysis/summary`
- Simulator:
  - `GET /api/simulator/status`
  - `POST /api/simulator/start` (admin)
  - `POST /api/simulator/stop` (admin)
- Admin:
  - `GET /api/admin/stats`
  - `GET/POST /api/admin/users`
  - `DELETE /api/admin/users/<id>`
  - `GET /api/admin/export/csv`
  - `GET /api/admin/export/pdf`

## Common Troubleshooting

- `401 Invalid credentials`:
  - user/password mismatch in DB
  - verify `.env` predefined users and restart backend
- `422 No receipt data to analyze`:
  - no receipts yet; start simulator and ensure consent-verified device exists
- `404 /analysis/status/<id>`:
  - no analysis created yet for that device
- Vite socket proxy errors (`ECONNREFUSED`):
  - backend not running on port `5000`
  - restart backend first, then frontend

## Security & Ethics

- Use only with explicit participant/device consent
- Restrict deployments to research/lab environments
- Protect `.env` and database credentials
- Rotate secrets for production environments

## Future Enhancements

- Password reset flow and audit logs
- Multi-factor admin login
- Experiment labeling and batch reports
- Statistical model plug-ins for advanced inference
- Optional integration adapters for external messaging platforms

