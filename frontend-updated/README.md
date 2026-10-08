# frontend-updated

Redesigned Next.js (App Router, TypeScript) frontend for the Multiplayer Chess backends in this repo.
The original `frontend/` (Vite) is untouched; this app talks to the same `https-backend` and `backend`.

## Run

```bash
cp .env.example .env.local   # point at your backends
npm install
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
```

The API only accepts requests from its `FRONTEND_ORIGIN` (CORS). `.env.example` at the repo root already uses
`http://localhost:3000`, so start the stack with that value (the dev compose file defaults to `5173`).

## Environment

| Variable | Default | Used for |
| --- | --- | --- |
| `NEXT_PUBLIC_HTTPS_BACKEND_URL` | `http://localhost:8000` | REST: `/api/auth/*`, `/api/games/active` |
| `NEXT_PUBLIC_WEBSOCKET_BACKEND_URL` | `ws://localhost:8080/api/ws` | Game socket. Spectators use the same host at `/api/ws/spectate?gameId=…` |

## Routes

| Route | What it is |
| --- | --- |
| `/` | Landing page |
| `/auth` | Login / register (`POST /api/auth/login`, `/register`, `GET /api/auth/me`, `POST /logout`) |
| `/game` | Live match against another player (WebSocket). Redirects to `/auth` without a valid session |
| `/demo` | The same game screen with a simulated server and opponent. No account or backend needed |
| `/spectate` | Lobby of active games (`GET /api/games/active`) |
| `/spectate/[gameId]` | Read-only live view of a match (`/api/ws/spectate`) |

## Layout

```
src/app/            routes (App Router)
src/components/     landing/, auth/, game/, spectate/ (client components)
src/lib/            API + socket clients, match state (useMatch), demo transport, chess piece art
src/styles/         design tokens and base styles
```

## Protocol notes

Messages and payloads mirror `backend/src/utils/messages.ts` and `backend/src/models/Game.ts`:
`init_game`, `move`, `invalid_move`, `game_over`, `resign`, `draw_request`, `draw_response`.
The session token is stored in `localStorage` under `chess_auth_token`, the same key as the original frontend,
so a login on either app works on the other when served from the same origin.
