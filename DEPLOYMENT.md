# Deployment Guide

Runbook for the Multiplayer Chess stack. Four layers: local dev, Docker Compose, Kubernetes, and CI/CD.

## Stack map

| Service | Dir | Container port | Env source | Exposed? |
|---|---|---|---|---|
| Frontend (React/Vite SPA) | `frontend/` | 80 (nginx) | build-time `VITE_*` args | Yes — `/` |
| HTTP API (Express + Prisma) | `https-backend/` | 8000 | `DATABASE_URL`, `AUTH_JWT_SECRET`, `FRONTEND_ORIGIN` | Yes — `/api` |
| WebSocket game server (`ws`) | `backend/` | 8080 | `AUTH_JWT_SECRET`, `HTTPS_BACKEND_URL` | Yes — `/api/ws` |
| Database (PostgreSQL) | — | 5432 | `DATABASE_URL` | No — internal |

Traffic flow: browser → frontend; frontend → API over REST (auth, games) and WS server (moves, spectate); WS server persists through the API; API reads/writes Postgres via Prisma.

Key detail: `backend` (WS) and `https-backend` (API) share the same `AUTH_JWT_SECRET`. They are separate processes — never merge them into one container.

## Layer 1 — Local development

Run from source, one terminal per service:

```bash
cd https-backend && npm run dev   # Express API on :8000
cd backend && npm run dev         # WebSocket server on :8080
cd frontend && npm run dev        # Vite UI on :5173
```

Postgres: local install or `docker run -p 5432:5432 -e POSTGRES_USER=chess -e POSTGRES_PASSWORD=chess -e POSTGRES_DB=chess postgres:16-alpine`.

Env files (never committed):
- `https-backend/.env` — `PORT`, `DATABASE_URL`, `AUTH_JWT_SECRET`, `FRONTEND_ORIGIN`
- `backend/.env` — `PORT`, `AUTH_JWT_SECRET`, `HTTPS_BACKEND_URL`
- `frontend/.env` — `VITE_HTTPS_BACKEND_URL`, `VITE_WEBSOCKET_BACKEND_URL`

Schema sync (no migration files exist yet — `db push` syncs the schema):

```bash
cd https-backend && npx prisma db push
```

## Layer 2 — Docker Compose (full local stack)

```bash
cp .env.example .env        # adjust AUTH_JWT_SECRET, URLs
docker compose up --build   # starts db, migrate, https-backend, backend, frontend
```

- Frontend: http://localhost:3000 (nginx serving the built SPA)
- HTTP API: http://localhost:8000/api/health
- WebSocket: ws://localhost:8080/api/ws

Notes:
- `migrate` runs `prisma db push` once (job) before `https-backend` starts, so the schema is ready before the API boot.
- `AUTH_JWT_SECRET` is interpolated from the root `.env` and shared by both Node services.
- The frontend is a static SPA: `VITE_*` values are baked at **build time** in the image. Change them → rebuild.
- DB data lives in the named volume `db_data`. `docker compose down` keeps it; `docker compose down -v` wipes it.

## Layer 3 — Docker images

All three services use multi-stage Dockerfiles (`deps → builder → runner`).

Build with build args for client env:

```bash
docker build --build-arg VITE_HTTPS_BACKEND_URL=https://chess.visheshxdevs.in/api \
             --build-arg VITE_WEBSOCKET_BACKEND_URL=wss://chess.visheshxdevs.in/api/ws \
             -t ghcr.io/vishesh-verma-07/multiplayer-chess/frontend:1.4.0 ./frontend
docker build -t ghcr.io/vishesh-verma-07/multiplayer-chess/backend:1.4.0 ./backend
docker build -t ghcr.io/vishesh-verma-07/multiplayer-chess/https-backend:1.4.0 ./https-backend
```

- Never bake `DATABASE_URL`/`AUTH_JWT_SECRET` into images — they come from env at deploy time.
- The `https-backend` image runs `prisma generate` during build, keeps only the generated client in the runner stage, and keeps the `prisma` CLI + schema in the image so the migrate Job can run `db push` inside the cluster.
- Tag with unique tags (SHA or semver) for anything deployed to Kubernetes; `latest` alone makes rollbacks painful.

## Layer 4 — Kubernetes

Layout:

```
kubernetes/
├── namespace.yml
├── ingress.yml
├── backend/          # deployment, service, config.yml, secret.yml
├── https-backend/    # deployment, service, config.yml, secret.yml
├── frontend/         # deployment, service
└── infra/            # postgres-statefulset.yml, postgres-service.yml, prisma-migrate-job.yml
```

Apply order:

```bash
kubectl apply -f kubernetes/namespace.yml
kubectl apply -f kubernetes/backend/config.yml
kubectl apply -f kubernetes/backend/secret.yml
kubectl apply -f kubernetes/https-backend/config.yml
kubectl apply -f kubernetes/https-backend/secret.yml
kubectl apply -f kubernetes/infra/        # postgres + migrate job
kubectl apply -f kubernetes/backend/
kubectl apply -f kubernetes/https-backend/
kubectl apply -f kubernetes/frontend/
kubectl apply -f kubernetes/ingress.yml
```

Secrets: generate them, don't edit the checked-in placeholders:

```bash
kubectl -n chessgame create secret generic https-backend-secrets \
  --from-env-file=./.env --dry-run=client -o yaml | kubectl apply -f -
kubectl -n chessgame create secret generic backend-secrets \
  --from-env-file=./.env --dry-run=client -o yaml | kubectl apply -f -
```

Keep the real `.env` out of git.

The CD workflow creates both secrets itself from GitHub Actions secrets (idempotent), so a fresh cluster gets real values automatically. The checked-in `secret.yml` files are placeholders for manual/minikube setups only — never applied by CD.

Routing: `/api/ws` → WS server (websocket upgrade), `/api` → HTTP API, `/` → frontend. Path order matters — `/api/ws` must be listed before `/api`. TLS secret is `chessgame-tls` (cert-manager or pre-created).

Database schema on the cluster: the `prisma-migrate-job.yml` Job applies the schema (`prisma db push`). Run it once after Postgres is up. For real migration files, replace with `prisma migrate deploy`.

Deploying a new release:

```bash
kubectl -n chessgame set image deployment/backend backend=ghcr.io/vishesh-verma-07/multiplayer-chess/backend:1.4.0
kubectl -n chessgame set image deployment/https-backend https-backend=ghcr.io/vishesh-verma-07/multiplayer-chess/https-backend:1.4.0
kubectl -n chessgame set image deployment/frontend frontend=ghcr.io/vishesh-verma-07/multiplayer-chess/frontend:1.4.0
kubectl -n chessgame rollout status deployment/backend
kubectl -n chessgame rollout status deployment/https-backend
kubectl -n chessgame rollout status deployment/frontend
kubectl -n chessgame rollout undo deployment/backend   # rollback
```

Note: the frontend image embeds its API/WS URLs at build time — rebuilding it (CD workflow does this) is how you update `VITE_*`.

## Layer 5 — CI/CD

- `.github/workflows/ci.yml` — on push/PR to `main`: install, `prisma generate`, build all three (lint for frontend).
- `.github/workflows/cd.yml` — on push to `main` (service files) or manual dispatch: build & push all three images to GHCR tagged `${{ github.sha }}` + `latest`, then apply manifests and wait for rollouts.

GitHub secrets required for CD:
- `KUBECONFIG` — base64 or raw kubeconfig for the target cluster
- `KUBE_CONTEXT` — context name inside it
- `AUTH_JWT_SECRET` — the shared JWT secret (must match on both Node services)
- `DATABASE_URL` — `postgres://user:pass@postgres:5432/chess` for the cluster DB

Skip deployment (build/push only): trigger the workflow manually; the `deploy` job gates on `github.ref == 'refs/heads/main'`.

## Verification checklist

1. `kubectl -n chessgame rollout status deployment/...` — all replicas ready.
2. `curl https://chess.visheshxdevs.in/api/health` — 200.
3. Load the site — static assets resolve, login works.
4. Open a game — move messages flow over the socket (not HTTP 400/502).
5. `kubectl -n chessgame logs deploy/https-backend` — no DB connection errors; `kubectl get pvc -n chessgame` shows bound volume.
6. `kubectl -n chessgame get secrets` — both secrets present; no CrashLoopBackOff.

## Gotchas

1. `VITE_*` is baked at build time — stale frontend image = stale API URL.
2. Both Node services must use the same `AUTH_JWT_SECRET`, or socket auth fails with 401.
3. `FRONTEND_ORIGIN` must match the real browser origin or CORS blocks login.
4. WS needs upgrade support in the ingress (nginx/traefik) + long proxy timeouts (already set on `chessgame-ingress`).
5. Postgres without a persistent volume loses data — the StatefulSet uses a PVC, compose uses `db_data`.
6. Run `prisma db push` (or migrations) before the API starts or it will fail on first query.
