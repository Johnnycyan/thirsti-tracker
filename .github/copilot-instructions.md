# Thirsti Tracker — Project Guidelines

Full-stack app tracking Ninja Thirsti machine usage: CO2 tanks, flavor pods, dispense logs.

## Architecture

| Layer      | Stack                                                                          |
| ---------- | ------------------------------------------------------------------------------ |
| Frontend   | React 18, TypeScript (strict), Vite, Material UI v7, React Router v6, Recharts |
| Backend    | Go, Gin, GORM, SQLite                                                          |
| Deployment | Docker (multi-stage), GitHub Actions → GHCR                                    |

**Single-user system**: Only one admin account is ever created. `DISABLE_REGISTRATION=true` once the first user exists.

Frontend is served as static files from `./static/assets` by the Go backend in production. The Vite dev server proxies `/api` → `localhost:8080` and `/ws` → `ws://localhost:8080`.

## Build & Test Commands

**Frontend** (`frontend/`):

```bash
npm install
npm run dev       # dev server on :3000
npm run build     # tsc -b && vite build (type-checks first)
npm run lint      # eslint .
```

**Backend** (`backend/`):

```bash
go mod download
go run main.go    # serves on :8080
```

**Docker** (full stack):

```bash
docker compose up --build
```

## Backend Conventions (Go)

- Routes registered in `main.go`; handlers in `handlers/`
- Public routes at `/api/*`, protected routes require `Authorization: Bearer <token>` (enforced by `middleware/auth.go`)
- WebSocket endpoint `/api/ws` accepts token via **query param** (`?token=<jwt>`), not header
- GORM auto-migrate runs on startup — add new model fields to existing structs
- Soft deletes are active; use `.Unscoped()` to query deleted records
- Consistent error responses: `gin.H{"error": "..."}` with appropriate HTTP status
- Environment variables: `JWT_SECRET`, `DB_PATH` (default: `data/thirsti.db`), `PORT` (default: `8080`), `DISABLE_REGISTRATION`
- Default `JWT_SECRET` is insecure — always override in production

## Frontend Conventions (React/TypeScript)

- `src/pages/` — full-page route components; `src/components/` — reusable components
- `src/services/api.ts` — `ApiClient` class; use `apiClient.*` for all HTTP calls
- Auth token stored in `localStorage` under key `auth_token`; `apiClient.setToken()` / `getToken()` manage it
- **No global state** — local `useState` + `useEffect` for data fetching; no Redux/Zustand
- **MUI styling**: prefer `sx` prop over separate CSS files; use `styled()` only for reusable component variants
- Theme: dark mode, primary `#00BFFF` (cyan). Theme config in `src/theme/theme.ts`
- TypeScript strict mode + `noUnusedLocals` + `noUnusedParameters` — fix all type errors before committing
- `npm run build` runs `tsc -b` first; the build will fail on type errors

## Inventory State Machine

CO2 tanks and flavor pods cycle through statuses:
`extra_full` → `installed` → (`extra_empty` / `consumed`)

Dose counts drive the predictive analytics; always update counts when modifying dispense logic.
